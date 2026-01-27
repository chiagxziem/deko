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
import {
  ServiceLogListSchema,
  ServiceOverviewStatsSchema,
  ServiceTimeseriesStatsSchema,
} from "@repo/db/validators/dashboard.validator";

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

export const getServiceTimeseriesStatsDoc = describeRoute({
  description: "Get timeseries statistics for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Service timeseries statistics retrieved", {
      details: "Service timeseries statistics retrieved successfully",
      dataSchema: ServiceTimeseriesStatsSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceTimeseriestatsValErrs.idErrors,
        ),
        fields: dashboardExamples.serviceTimeseriestatsValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceTimeseriestatsValErrs.invalidData,
        ),
        fields: dashboardExamples.serviceTimeseriestatsValErrs.invalidData,
      },
      invalidMetric: {
        summary: "Invalid metric",
        code: "INVALID_DATA",
        details: "Invalid metric requested",
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

export const getServiceLogsDoc = describeRoute({
  description: "Get service logs",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Service logs retrieved", {
      details: "Service logs retrieved successfully",
      dataSchema: ServiceLogListSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(dashboardExamples.serviceLogsValErrs.idErrors),
        fields: dashboardExamples.serviceLogsValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(dashboardExamples.serviceLogsValErrs.invalidData),
        fields: dashboardExamples.serviceLogsValErrs.invalidData,
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
