import { validator } from "hono-openapi";
import { z } from "zod";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import {
  getLogTimeseries,
  getPrevPeriod,
  getServiceLogs,
  getServiceLogsCount,
  getServiceOverviewStats,
} from "@/queries/dashboard-queries";
import { getSingleService } from "@/queries/service-queries";
import {
  ServiceLogListSchema,
  ServiceOverviewStatsSchema,
  ServiceTimeseriesStatsSchema,
} from "@repo/db/validators/dashboard.validator";

import {
  getServiceLogsDoc,
  getServiceOverviewStatsDoc,
  getServiceTimeseriesStatsDoc,
} from "./dashboard.docs";

const dashboard = createRouter();

type ServiceOverviewStats = z.infer<typeof ServiceOverviewStatsSchema>;
type ServiceTimeseriesStats = z.infer<typeof ServiceTimeseriesStatsSchema>;
type ServiceLogList = z.infer<typeof ServiceLogListSchema>;

// Get Service Overview Stats by ID
dashboard.get(
  "/:serviceId/stats/overview",
  getServiceOverviewStatsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
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
      return c.json(errorResponse("NOT_FOUND", "Service not found"), HttpStatusCodes.NOT_FOUND);
    }

    // Get current period stats
    const serviceOverviewStats = await getServiceOverviewStats({ serviceId, period, environment });

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
        successResponse(defaultOverviewStats, "Service overview statistics retrieved successfully"),
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
      comparison: {
        totalRequestsChange:
          prevPeriodOverviewStats.totalRequests > 0
            ? ((serviceOverviewStats.totalRequests - prevPeriodOverviewStats.totalRequests) /
                prevPeriodOverviewStats.totalRequests) *
              100
            : null,
        errorRateChange:
          prevPeriodOverviewStats.errorRate > 0
            ? ((serviceOverviewStats.errorRate - prevPeriodOverviewStats.errorRate) /
                prevPeriodOverviewStats.errorRate) *
              100
            : null,
        avgDurationChange:
          prevPeriodOverviewStats.avgDuration > 0
            ? ((serviceOverviewStats.avgDuration - prevPeriodOverviewStats.avgDuration) /
                prevPeriodOverviewStats.avgDuration) *
              100
            : null,
      },
    };

    return c.json(
      successResponse(response, "Service overview statistics retrieved successfully"),
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
      period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      granularity: z.enum(["minute", "hour", "day"]).optional(),
      metrics: z
        .string()
        .default("requests,errors,avg_duration")
        .describe(
          "Comma separated list of metrics to retrieve. Valid values: requests, errors, avg_duration",
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
      return c.json(errorResponse("NOT_FOUND", "Service not found"), HttpStatusCodes.NOT_FOUND);
    }

    // if there's no valid metrics, return an error
    const metricsArray = metrics.split(",");
    if (
      !metricsArray.includes("requests") &&
      !metricsArray.includes("errors") &&
      !metricsArray.includes("avg_duration")
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
        requests: metricsArray.includes("requests") ? bucket.requests : undefined,
        errors: metricsArray.includes("errors") ? bucket.errors : undefined,
        avgDuration: metricsArray.includes("avg_duration") ? bucket.avg_duration : undefined,
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
      period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      level: z.enum(["info", "warn", "error", "debug"]).optional(),
      status: z.coerce.number().optional(),
      environment: z.string().optional(),
      method: z
        .enum(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "CONNECT", "OPTIONS", "TRACE"])
        .optional(),
      path: z.string().optional(),
      to: z.coerce.date().optional(),
      from: z.coerce.date().optional(),
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, level, status, environment, method, path, to, from, search, cursor, limit } =
      c.req.valid("query");

    // ensure the service exists
    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(errorResponse("NOT_FOUND", "Service not found"), HttpStatusCodes.NOT_FOUND);
    }

    let cursorTimestamp: number | undefined;
    let cursorId: string | undefined;

    // Decode cursor if present
    if (cursor) {
      try {
        // Handle potential space vs plus issue in base64 from URL
        const normalizedCursor = cursor.replace(/ /g, "+");
        const decoded = Buffer.from(normalizedCursor, "base64").toString("utf-8");
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
        level: log.level as "info" | "warn" | "error" | "debug",
        method: log.method as
          | "GET"
          | "HEAD"
          | "POST"
          | "PUT"
          | "PATCH"
          | "DELETE"
          | "CONNECT"
          | "OPTIONS"
          | "TRACE",
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

export default dashboard;
