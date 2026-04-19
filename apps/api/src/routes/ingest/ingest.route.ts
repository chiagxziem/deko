import crypto from "node:crypto";

import type { BulkJobOptions } from "bullmq";
import { validator } from "hono-openapi";
import { getConnInfo } from "hono/bun";
import { z } from "zod";

import { IngestSchema, type Event } from "@repo/db/validators/log.validator";
import { logEventsQueue } from "@repo/redis";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { checkAndIncrementSlidingWindowBatch } from "@/lib/rate-limit";
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
import {
  ServiceRepository,
  type IServiceRepository,
} from "@/repositories/service.repository";

import { ingestLogDoc } from "./ingest.docs";

type IngestRouteDeps = {
  serviceRepository: IServiceRepository;
};

export const createIngestRouter = ({ serviceRepository }: IngestRouteDeps) => {
  const ingest = createRouter();

  // ---------------------------------------------------------------------------
  // INGEST LOGS
  // Accepts one or many log events from client SDKs and enqueues them for async processing.
  // Applies layered protections: body-size cap, validation, rate limits, per-event guardrails.
  // Supports partial acceptance: invalid events rejected, valid events proceed with counts returned.
  // ---------------------------------------------------------------------------
  ingest.post(
    "/",
    maxBodySize(256 * 1024),
    ingestLogDoc,
    validator(
      "header",
      z.object({
        "x-deko-service-token": z.string().length(40),
      }),
      validationHook,
    ),
    validator(
      "json",
      z.union([IngestSchema, z.array(IngestSchema)]),
      validationHook,
    ),
    ingestRateLimit,
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

      const serviceToken = c.req.header("x-deko-service-token");
      if (!serviceToken) {
        return c.json(
          errorResponse("MISSING_TOKEN", "Service token is required"),
          HttpStatusCodes.UNAUTHORIZED,
        );
      }

      // --- START EVENT QUOTA CHECK ---
      // per-minute (10k events) event rate-limit since the batch size is known
      // an atomic Redis script helper is used to ensure transaction isolation
      // and prevent race conditions

      const keyMin = `ingest-rate-limit:${serviceToken}:min`;
      const now = Date.now();
      const limitMin = 10_000;
      const windowMs = 60_000;

      try {
        const quotaResult = await checkAndIncrementSlidingWindowBatch(
          keyMin,
          now,
          limitMin,
          windowMs,
          logs.length,
        );

        if (!quotaResult.allowed) {
          return c.json(
            errorResponse(
              "TOO_MANY_REQUESTS",
              "Rate limit exceeded. Max 10,000 events per minute.",
            ),
            HttpStatusCodes.TOO_MANY_REQUESTS,
          );
        }
      } catch (err) {
        console.error("Ingest Event Quota Check Error:", err);
        return c.json(
          errorResponse(
            "INTERNAL_SERVER_ERROR",
            "Internal server error. Please try again later.",
          ),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      // --- END EVENT QUOTA CHECK ---

      const service = await serviceRepository.getServiceByToken(serviceToken);

      if (!service) {
        return c.json(
          errorResponse(
            "INVALID_TOKEN",
            "Invalid or non-existing service token",
          ),
          HttpStatusCodes.UNAUTHORIZED,
        );
      }

      // update service token updatedAt
      try {
        await serviceRepository.touchServiceTokenLastUsed(serviceToken);
      } catch (touchErr) {
        console.warn(
          "Failed to update service token last-used timestamp:",
          touchErr,
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

  return ingest;
};

const ingest = createIngestRouter({
  serviceRepository: new ServiceRepository(),
});

export default ingest;
