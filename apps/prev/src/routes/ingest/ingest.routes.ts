import { createRoute, z } from "@hono/zod-openapi";
import { LogSchema } from "@repo/db/validators/log.validator";

import HttpStatusCodes from "@/utils/http-status-codes";
import { logsExamples } from "@/utils/openapi-examples";
import {
  errorContent,
  getErrDetailsFromErrFields,
  serverErrorContent,
  successContent,
} from "@/utils/openapi-helpers";

const tags = ["Ingest"];

export const ingestLog = createRoute({
  path: "/ingest",
  method: "post",
  tags,
  description: "Ingest log",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LogSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    [HttpStatusCodes.OK]: successContent({
      description: "Log ingested",
      schema: z.object({
        status: z.string().default("ok"),
      }),
      resObj: {
        details: "Log ingested successfully",
        data: {
          status: "ok",
        },
      },
    }),
    [HttpStatusCodes.BAD_REQUEST]: errorContent({
      description: "Invalid request data",
      examples: {
        validationError: {
          summary: "Validation error",
          code: "INVALID_DATA",
          details: getErrDetailsFromErrFields(logsExamples.ingestLogValErrs),
          fields: logsExamples.ingestLogValErrs,
        },
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: errorContent({
      description: "Invalid project token",
      examples: {
        invalidProjectToken: {
          summary: "Project not found",
          code: "NOT_FOUND",
          details: "Project not found",
        },
      },
    }),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: serverErrorContent(),
  },
});

export type IngestLogRoute = typeof ingestLog;
