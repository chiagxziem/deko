import { describeRoute } from "hono-openapi";

import HttpStatusCodes from "@/lib/http-status-codes";
import {
  createErrorResponse,
  createGenericErrorResponse,
  createRateLimitErrorResponse,
  createServerErrorResponse,
  createSuccessResponse,
  getErrDetailsFromErrFields,
} from "@/lib/openapi";
import { dashboardExamples } from "@/lib/openapi-examples";
import { ServiceOverviewStatsSchema } from "@repo/db/validators/dashboard.validator";

const tags = ["Dashboard"];

export const getServiceOverviewStatsDoc = describeRoute({
  description: "Get overview statistics for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Service overview statistics retrieved", {
      details: "Service overview statistics retrieved successfully",
      dataSchema: ServiceOverviewStatsSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(dashboardExamples.serviceOverviewStatsValErrs.idErrors),
        fields: dashboardExamples.serviceOverviewStatsValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceOverviewStatsValErrs.invalidData,
        ),
        fields: dashboardExamples.serviceOverviewStatsValErrs.invalidData,
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse("Service not found", {
      code: "NOT_FOUND",
      details: "Service not found",
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});
