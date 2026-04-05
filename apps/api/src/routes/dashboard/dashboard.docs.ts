import { describeRoute } from "hono-openapi";

import {
  LogLevelBreakdownSchema,
  ServiceLogListSchema,
  ServiceLogSchema,
  ServiceOverviewStatsSchema,
  ServiceTimeseriesStatsSchema,
  StatusCodeBreakdownSchema,
} from "@repo/db/validators/dashboard.validator";

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

const tags = ["Dashboard"];

export const getServiceOverviewStatsDoc = describeRoute({
  description: "Get overview statistics for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse(
      "Service overview statistics retrieved",
      {
        details: "Service overview statistics retrieved successfully",
        dataSchema: ServiceOverviewStatsSchema,
      },
    ),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceOverviewStatsValErrs.idErrors,
        ),
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
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Service not found",
      {
        code: "NOT_FOUND",
        details: "Service not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const getServiceTimeseriesStatsDoc = describeRoute({
  description: "Get timeseries statistics for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse(
      "Service timeseries statistics retrieved",
      {
        details: "Service timeseries statistics retrieved successfully",
        dataSchema: ServiceTimeseriesStatsSchema,
      },
    ),
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
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Service not found",
      {
        code: "NOT_FOUND",
        details: "Service not found",
      },
    ),
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
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceLogsValErrs.idErrors,
        ),
        fields: dashboardExamples.serviceLogsValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.serviceLogsValErrs.invalidData,
        ),
        fields: dashboardExamples.serviceLogsValErrs.invalidData,
      },
      invalidCursor: {
        summary: "Invalid cursor",
        code: "INVALID_CURSOR",
        details: "Invalid pagination cursor",
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: createGenericErrorResponse(
      "Service not found",
      {
        code: "NOT_FOUND",
        details: "Service not found",
      },
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const getSingleLogDoc = describeRoute({
  description: "Get details of a single log event",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse("Log event retrieved", {
      details: "Log event retrieved successfully",
      dataSchema: ServiceLogSchema,
    }),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.singleServiceLogValErrs.idErrors,
        ),
        fields: dashboardExamples.singleServiceLogValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.singleServiceLogValErrs.invalidData,
        ),
        fields: dashboardExamples.singleServiceLogValErrs.invalidData,
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: createErrorResponse("Service not found", {
      serviceNotFound: {
        summary: "Service not found",
        code: "NOT_FOUND",
        details: "Service not found",
      },
      logNotFound: {
        summary: "Log not found",
        code: "NOT_FOUND",
        details: "Log not found",
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const getStatusCodeBreakdownDoc = describeRoute({
  description: "Get status code breakdown for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse(
      "Status code breakdown retrieved",
      {
        details: "Status code breakdown retrieved successfully",
        dataSchema: StatusCodeBreakdownSchema,
      },
    ),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.breakdownValErrs.idErrors,
        ),
        fields: dashboardExamples.breakdownValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.breakdownValErrs.invalidData,
        ),
        fields: dashboardExamples.breakdownValErrs.invalidData,
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: createErrorResponse("Service not found", {
      serviceNotFound: {
        summary: "Service not found",
        code: "NOT_FOUND",
        details: "Service not found",
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});

export const getLogLevelBreakdownDoc = describeRoute({
  description: "Get log level breakdown for a service",
  tags,
  responses: {
    [HttpStatusCodes.OK]: createSuccessResponse(
      "Log level breakdown retrieved",
      {
        details: "Log level breakdown retrieved successfully",
        dataSchema: LogLevelBreakdownSchema,
      },
    ),
    [HttpStatusCodes.BAD_REQUEST]: createErrorResponse("Invalid request data", {
      invalidUUID: {
        summary: "Invalid service ID",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.breakdownValErrs.idErrors,
        ),
        fields: dashboardExamples.breakdownValErrs.idErrors,
      },
      validationError: {
        summary: "Invalid request data",
        code: "INVALID_DATA",
        details: getErrDetailsFromErrFields(
          dashboardExamples.breakdownValErrs.invalidData,
        ),
        fields: dashboardExamples.breakdownValErrs.invalidData,
      },
    }),
    [HttpStatusCodes.NOT_FOUND]: createErrorResponse("Service not found", {
      serviceNotFound: {
        summary: "Service not found",
        code: "NOT_FOUND",
        details: "Service not found",
      },
    }),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: createRateLimitErrorResponse(),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: createServerErrorResponse(),
  },
});
