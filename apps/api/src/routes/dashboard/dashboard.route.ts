import { validator } from "hono-openapi";
import { z } from "zod";

import {
  GranularityEnumSchema,
  LevelEnumSchema,
  MethodEnumSchema,
  PeriodEnumSchema,
  ServiceLogList,
  ServiceOverviewStats,
  ServiceTimeseriesStats,
} from "@repo/db/validators/dashboard.validator";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import {
  getLogLevelBreakdown,
  getLogTimeseries,
  getPrevPeriod,
  getServiceLogs,
  getServiceLogsCount,
  getServiceOverviewStats,
  getSingleLog,
  getStatusCodeBreakdown,
} from "@/queries/dashboard-queries";
import { getSingleService } from "@/queries/service-queries";

import {
  getLogLevelBreakdownDoc,
  getServiceLogsDoc,
  getServiceOverviewStatsDoc,
  getServiceTimeseriesStatsDoc,
  getSingleLogDoc,
  getStatusCodeBreakdownDoc,
} from "./dashboard.docs";

const dashboard = createRouter();

// Get Service Overview Stats by ID
dashboard.get(
  "/:serviceId/stats/overview",
  getServiceOverviewStatsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      environment: z.string().optional(),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, environment } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Get current period stats
    const serviceOverviewStats = await getServiceOverviewStats({
      serviceId,
      period,
      environment,
    });

    const defaultOverviewStats: ServiceOverviewStats = {
      totalRequests: 0,
      errorCount: 0,
      errorRate: 0,
      avgDuration: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
      period: {
        from: getPrevPeriod(period).to,
        to: new Date(),
      },
      comparison: {
        totalRequestsChange: null,
        errorRateChange: null,
        avgDurationChange: null,
      },
    };

    // return sensible default if there's no log in service yet
    if (serviceOverviewStats.totalRequests === 0) {
      return c.json(
        successResponse(
          defaultOverviewStats,
          "Service overview statistics retrieved successfully",
        ),
        HttpStatusCodes.OK,
      );
    }

    // get previous period stats for comparison
    const prevPeriod = getPrevPeriod(period);
    const prevPeriodOverviewStats = await getServiceOverviewStats({
      serviceId,
      from: prevPeriod.from,
      to: prevPeriod.to,
      environment,
    });

    const response: ServiceOverviewStats = {
      ...serviceOverviewStats,
      period: {
        from: serviceOverviewStats.period.from,
        to: serviceOverviewStats.period.to,
      },
      comparison: {
        totalRequestsChange:
          prevPeriodOverviewStats.totalRequests > 0
            ? ((serviceOverviewStats.totalRequests -
                prevPeriodOverviewStats.totalRequests) /
                prevPeriodOverviewStats.totalRequests) *
              100
            : null,
        errorRateChange:
          prevPeriodOverviewStats.errorRate > 0
            ? ((serviceOverviewStats.errorRate -
                prevPeriodOverviewStats.errorRate) /
                prevPeriodOverviewStats.errorRate) *
              100
            : null,
        avgDurationChange:
          prevPeriodOverviewStats.avgDuration > 0
            ? ((serviceOverviewStats.avgDuration -
                prevPeriodOverviewStats.avgDuration) /
                prevPeriodOverviewStats.avgDuration) *
              100
            : null,
      },
    };

    return c.json(
      successResponse(
        response,
        "Service overview statistics retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Get Service Time Series Stats by ID
dashboard.get(
  "/:serviceId/stats/timeseries",
  getServiceTimeseriesStatsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      granularity: GranularityEnumSchema.optional(),
      metrics: z
        .string()
        .default(
          "requests,errors,avg_duration,p50_duration,p95_duration,p99_duration",
        )
        .describe(
          "Comma separated list of metrics to retrieve. Valid values: requests, errors, avg_duration, p50_duration, p95_duration, p99_duration",
        ),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, granularity, metrics } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // if there's no valid metrics, return an error
    const metricsArray = metrics.split(",");
    if (
      !metricsArray.includes("requests") &&
      !metricsArray.includes("errors") &&
      !metricsArray.includes("avg_duration") &&
      !metricsArray.includes("p50_duration") &&
      !metricsArray.includes("p95_duration") &&
      !metricsArray.includes("p99_duration")
    ) {
      return c.json(
        errorResponse("INVALID_DATA", "Invalid metric requested"),
        HttpStatusCodes.BAD_REQUEST,
      );
    }

    const serviceTimeseries = await getLogTimeseries({
      serviceId,
      period,
      granularity,
    });

    const serviceTimeseriesStats: ServiceTimeseriesStats = {
      granularity: serviceTimeseries.granularity,
      buckets: serviceTimeseries.buckets.map((bucket) => ({
        timestamp: bucket.bucket,
        requests: metricsArray.includes("requests")
          ? bucket.requests
          : undefined,
        errors: metricsArray.includes("errors") ? bucket.errors : undefined,
        avgDuration: metricsArray.includes("avg_duration")
          ? bucket.avg_duration
          : undefined,
        p50Duration: metricsArray.includes("p50_duration")
          ? bucket.p50_duration
          : undefined,
        p95Duration: metricsArray.includes("p95_duration")
          ? bucket.p95_duration
          : undefined,
        p99Duration: metricsArray.includes("p99_duration")
          ? bucket.p99_duration
          : undefined,
      })),
    };

    return c.json(
      successResponse(
        serviceTimeseriesStats,
        "Service timeseries statistics retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Get Service Logs by ID
dashboard.get(
  "/:serviceId/logs",
  getServiceLogsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      level: LevelEnumSchema.optional(),
      status: z.coerce.number().optional(),
      environment: z.string().optional(),
      method: MethodEnumSchema.optional(),
      path: z.string().optional(),
      to: z.iso
        .datetime()
        .transform((n) => new Date(n))
        .optional(),
      from: z.iso
        .datetime()
        .transform((n) => new Date(n))
        .optional(),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const {
      period,
      level,
      status,
      environment,
      method,
      path,
      to,
      from,
      search,
      cursor,
      limit,
    } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    let cursorTimestamp: number | undefined;
    let cursorId: string | undefined;

    // Decode cursor if present
    if (cursor) {
      try {
        // Handle potential space vs plus issue in base64 from URL
        const normalizedCursor = cursor.replace(/ /g, "+");
        const decoded = Buffer.from(normalizedCursor, "base64").toString(
          "utf-8",
        );
        const [timestampStr, idStr] = decoded.split(":");
        if (!timestampStr || !idStr) {
          throw new Error("Invalid cursor format");
        }

        const timestamp = parseInt(timestampStr);
        if (isNaN(timestamp) || !z.uuid().safeParse(idStr).success) {
          throw new Error("Invalid cursor values");
        }

        cursorTimestamp = timestamp;
        cursorId = idStr;
      } catch (err) {
        console.error("Failed to decode cursor:", cursor, err);
        // Invalid cursor, ignore
      }
    }

    const logs = await getServiceLogs({
      serviceId,
      period,
      level,
      status,
      environment,
      method,
      path,
      to,
      from,
      search,
      limit,
      cursor:
        cursorTimestamp && cursorId
          ? {
              timestamp: new Date(cursorTimestamp),
              id: cursorId,
            }
          : undefined,
    });

    // Generate next cursor
    let nextCursor: string | null = null;
    if (logs.length === limit) {
      const lastLog = logs[logs.length - 1];
      const cursorStr = `${lastLog.timestamp.getTime()}:${lastLog.id}`;
      nextCursor = Buffer.from(cursorStr).toString("base64");
    }

    const logList: ServiceLogList = {
      logs: logs.map(({ ipHash: _ih, userAgent: _ua, ...log }) => ({
        ...log,
        level: log.level,
        method: log.method,
      })),
      pagination: {
        hasNext: logs.length === limit,
        nextCursor,
        totalEstimate: await getServiceLogsCount({
          serviceId,
          period,
          level,
          status,
          environment,
          method,
          path,
          to,
          from,
          search,
        }),
      },
    };

    return c.json(
      successResponse(logList, "Service logs retrieved successfully"),
      HttpStatusCodes.OK,
    );
  },
);

// Get Single Log
dashboard.get(
  "/:serviceId/logs/:logId",
  getSingleLogDoc,
  validator(
    "param",
    z.object({ serviceId: z.uuid(), logId: z.uuid() }),
    validationHook,
  ),
  validator(
    "query",
    z.object({
      timestamp: z.iso.datetime().transform((n) => new Date(n)),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId, logId } = c.req.valid("param");
    const { timestamp } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // ensure the log exists
    const log = await getSingleLog(serviceId, logId, new Date(timestamp));
    if (!log) {
      return c.json(
        errorResponse("NOT_FOUND", "Log not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse(
        {
          ...log,
          timestamp: log.timestamp,
          receivedAt: log.receivedAt,
        },
        "Log retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Get Status Code Breakdown
dashboard.get(
  "/:serviceId/stats/status-breakdown",
  getStatusCodeBreakdownDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      environment: z.string().optional(),
      groupBy: z
        .union([z.literal("category"), z.literal("code")])
        .default("category"),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, environment, groupBy } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const breakdown = await getStatusCodeBreakdown({
      serviceId,
      period,
      groupBy,
      environment,
    });

    return c.json(
      successResponse(
        breakdown,
        "Status code breakdown retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// Get Log Level Breakdown
dashboard.get(
  "/:serviceId/stats/log-level-breakdown",
  getLogLevelBreakdownDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      environment: z.string().optional(),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, environment } = c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const breakdown = await getLogLevelBreakdown({
      serviceId,
      period,
      environment,
    });

    return c.json(
      successResponse(breakdown, "Log level breakdown retrieved successfully"),
      HttpStatusCodes.OK,
    );
  },
);

export default dashboard;
