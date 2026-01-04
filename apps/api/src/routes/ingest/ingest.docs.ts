import { describeRoute } from "hono-openapi";
import z from "zod";

import HttpStatusCodes from "@/lib/http-status-codes";
import {
  createErrorResponse,
  createServerErrorResponse,
  createSuccessResponse,
  getErrDetailsFromErrFields,
} from "@/lib/openapi";
import { logsExamples } from "@/lib/openapi-examples";

const tags = ["Ingest"];

export const ingestLogDoc = describeRoute({
  description: "Ingest log(s)",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Log(s) ingested", {
      details: "Logs ingested",
      dataSchema: z.object({
        accepted: z.number(),
        rejected: z.number(),
        requestId: z.string(),
      }),
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(logsExamples.ingestLogValErrs),
        fields: logsExamples.ingestLogValErrs,
      },
    }),
    [HttpStatusCodes.UNAUTHORIZED]: createErrorResponse(
      "Missing or invalid token",
      {
        missingToken: {
          summary: "Missing token",
          code: "MISSING_TOKEN",
          details: "Service token is required",
        },
        invalidToken: {
          summary: "Invalid token",
          code: "INVALID_TOKEN",
          details: "Invalid or non-existing service token",
        },
      },
    ),
    [HttpStatusCodes.PAYLOAD_TOO_LARGE]: createErrorResponse(
      "Batch too large",
      {
        batchTooLarge: {
          summary: "Batch too large",
          code: "BATCH_TOO_LARGE",
          details: "Batch size exceeds maximum of 100 events",
        },
        payloadTooLarge: {
          summary: "Payload too large",
          code: "PAYLOAD_TOO_LARGE",
          details: `Request body exceeds maximum size of ${256 * 1024} bytes`,
        },
      },
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: createErrorResponse(
      "No valid events",
      {
        noValidEvents: {
          summary: "No valid events",
          code: "NO_VALID_EVENTS",
          details: "All events in the request were rejected",
        },
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createErrorResponse(
      "Rate limit exceeded",
      {
        perSecondRateLimit: {
          summary: "Rate limit exceeded",
          code: "TOO_MANY_REQUESTS",
          details: "Rate limit exceeded. Max 100 requests per second.",
        },
        perMinuteRateLimit: {
          summary: "Rate limit exceeded",
          code: "TOO_MANY_REQUESTS",
          details: "Rate limit exceeded. Max 10,000 events per minute.",
        },
      },
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(
      "Internal server error. Please try again later.",
    ),
  },
});
