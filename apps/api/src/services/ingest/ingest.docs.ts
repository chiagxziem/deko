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
  description: "Ingest a log",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Log ingested", {
      details: "Log ingested successfully",
      dataSchema: z.object({
        status: z.literal("ok"),
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
      "Invalid project token",
      {
        invalidProjectToken: {
          summary: "Invalid project token",
          code: "INVALID_TOKEN",
          details: "Invalid or non-existing project token",
        },
      },
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});
