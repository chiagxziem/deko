import { type Event, IngestSchema } from "@repo/db/validators/log.validator";
import { logEventsQueue } from "@repo/redis";
import type { BulkJobOptions } from "bullmq";
import { validator } from "hono-openapi";
import { z } from "zod";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import {
  errorResponse,
  extractTraceId,
  normalizeLevel,
  successResponse,
} from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import { getServiceByToken } from "@/queries/service-queries";
import { ingestLogDoc } from "./ingest.docs";

const ingest = createRouter();

// TODO: add rate limiting: 10_000 events per minute per project token,
// TODO: and a max of 100 requests per second per project token

ingest.post(
  "/",
  ingestLogDoc,
  validator(
    "header",
    z.object({
      "x-logr-token": z.uuid(),
    }),
    validationHook,
  ),
  validator(
    "json",
    z.union([IngestSchema, z.array(IngestSchema)]),
    validationHook,
  ),
  async (c) => {
    const rawBody = c.req.valid("json");
    const logs = Array.isArray(rawBody) ? rawBody : [rawBody];

    // hard batch limit
    if (logs.length > 100) {
      return c.json(
        errorResponse(
          "BATCH_TOO_LARGE",
          "Batch size exceeds maximum of 100 events",
        ),
        HttpStatusCodes.PAYLOAD_TOO_LARGE,
      );
    }

    const serviceToken = c.req.header("x-logr-token");
    if (!serviceToken) {
      return c.json(
        errorResponse("MISSING_TOKEN", "Service token is required"),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

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
      data: Record<string, unknown>;
      opts: BulkJobOptions;
    }[] = [];

    let accepted = 0;
    let rejected = 0;

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
        // TODO: ipHashed
        // TODO: userAgent
      };

      // per-event size guard (~32KB)
      const estimatedSize = Buffer.byteLength(
        JSON.stringify(normalizedEvent),
        "utf8",
      );

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
        errorResponse(
          "NO_VALID_EVENTS",
          "All events in the request were rejected",
        ),
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
