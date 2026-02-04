import type { BulkJobOptions } from "bullmq";
import { validator } from "hono-openapi";
import { getConnInfo } from "hono/bun";
import { z } from "zod";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import {
  errorResponse,
  extractTraceId,
  hashIp,
  normalizeLevel,
  successResponse,
} from "@/lib/utils";
import { ingestRateLimit } from "@/middleware/ingest-rate-limit";
import { maxBodySize } from "@/middleware/max-body-size";
import { validationHook } from "@/middleware/validation-hook";
import { getServiceByToken } from "@/queries/service-queries";
import { type Event, IngestSchema } from "@repo/db/validators/log.validator";
import { logEventsQueue, redisClient as redis } from "@repo/redis";

import { ingestLogDoc } from "./ingest.docs";

const ingest = createRouter();

ingest.post(
  "/",
  maxBodySize(256 * 1024),
  ingestLogDoc,
  validator(
    "header",
    z.object({
      "x-deko-service-token": z.string().length(32),
    }),
    validationHook,
  ),
  validator("json", z.union([IngestSchema, z.array(IngestSchema)]), validationHook),
  ingestRateLimit,
  async (c) => {
    const rawBody = c.req.valid("json");
    const logs = Array.isArray(rawBody) ? rawBody : [rawBody];

    // hard batch limit
    if (logs.length > 100) {
      return c.json(
        errorResponse("BATCH_TOO_LARGE", "Batch size exceeds maximum of 100 events"),
        HttpStatusCodes.PAYLOAD_TOO_LARGE,
      );
    }

    const serviceToken = c.req.header("x-deko-service-token");
    if (!serviceToken) {
      return c.json(
        errorResponse("MISSING_TOKEN", "Service token is required"),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    // --- START EVENT QUOTA CHECK ---
    // only the per-minute event quota is checked here to prevent connection spam
    // the per-second request limit is checked in the ingest rate limit middleware
    // this implements the "10,000 events per minute" logic accurately by counting batch size

    const keyMin = `ingest-rate-limit:${serviceToken}:min`;
    const now = Date.now();
    const limitMin = 10_000;

    try {
      await redis.send("MULTI", []);
      await redis.send("ZREMRANGEBYSCORE", [keyMin, "0", (now - 60_000).toString()]);
      await redis.send("ZCARD", [keyMin]);

      const quotaResults = (await redis.send("EXEC", [])) as any[];
      const currentEventCount = quotaResults[1] ?? 0;

      if (currentEventCount + logs.length > limitMin) {
        return c.json(
          errorResponse("TOO_MANY_REQUESTS", "Rate limit exceeded. Max 10,000 events per minute."),
          HttpStatusCodes.TOO_MANY_REQUESTS,
        );
      }

      // add each event from the batch into the sliding window
      // We collect all promises to pipeline the commands to Redis
      const batchPromises: Promise<unknown>[] = [];
      batchPromises.push(redis.send("MULTI", []));

      const randomSuffix = Math.random().toString(36).substring(2, 5);

      for (let i = 0; i < logs.length; i++) {
        // we use a slightly offset random member for each log in the batch
        const eventMember = `${now}-${i}-${randomSuffix}`;
        batchPromises.push(redis.send("ZADD", [keyMin, now.toString(), eventMember]));
      }

      batchPromises.push(redis.send("PEXPIRE", [keyMin, "60000"]));
      batchPromises.push(redis.send("EXEC", []));

      // Resolve all "QUEUED" responses and the final EXEC in one go
      await Promise.all(batchPromises);
    } catch (err) {
      console.error("Ingest Event Quota Check Error:", err);
      return c.json(
        errorResponse("INTERNAL_SERVER_ERROR", "Internal server error. Please try again later."),
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
    // --- END EVENT QUOTA CHECK ---

    const service = await getServiceByToken(serviceToken);

    if (!service) {
      return c.json(
        errorResponse("INVALID_TOKEN", "Invalid or non-existing service token"),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    const receivedAt = new Date();

    const requestId =
      extractTraceId(c.req.header("traceparent")) ??
      c.req.header("x-request-id") ??
      crypto.randomUUID();

    const eventsToQueue: {
      name: "log-event";
      data: Event;
      opts: BulkJobOptions;
    }[] = [];

    let accepted = 0;
    let rejected = 0;

    const connectionInfo = getConnInfo(c);
    const ipHash = hashIp(connectionInfo.remote.address ?? "127.0.0.1");

    for (const log of logs) {
      // status validation
      if (log.status < 100 || log.status > 599) {
        rejected++;
        continue;
      }

      const normalizedEvent: Event = {
        serviceId: service.id,
        level: normalizeLevel(log.level ?? "info"),
        timestamp: new Date(log.timestamp),
        receivedAt,
        environment: log.environment,
        requestId,
        method: log.method.toUpperCase() as typeof log.method,
        path: log.path,
        status: log.status,
        duration: log.duration,
        message: log.message,
        sessionId: log.sessionId,
        meta: log.meta ?? {},
        ipHash,
        userAgent: c.req.header("User-Agent") ?? "",
      };

      // per-event size guard (~32KB)
      const estimatedSize = Buffer.byteLength(JSON.stringify(normalizedEvent), "utf8");

      if (estimatedSize > 32 * 1024) {
        rejected++;
        continue;
      }

      eventsToQueue.push({
        name: "log-event",
        data: normalizedEvent,
        opts: {
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 500,
          },
          removeOnComplete: 1000,
          removeOnFail: 2000,
        },
      });

      accepted++;
    }

    if (eventsToQueue.length === 0) {
      return c.json(
        errorResponse("NO_VALID_EVENTS", "All events in the request were rejected"),
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }

    await logEventsQueue.addBulk(eventsToQueue);

    return c.json(
      successResponse(
        {
          accepted,
          rejected,
          requestId,
        },
        "Logs ingested",
      ),
      HttpStatusCodes.OK,
    );
  },
);

export default ingest;
