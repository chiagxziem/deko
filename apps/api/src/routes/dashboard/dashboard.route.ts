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
  TopEndpointSortBySchema,
} from "@repo/db/validators/dashboard.validator";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import {
  getErrorGroups,
  getLogLevelBreakdown,
  getLogTimeseries,
  getLogsByRequestId,
  getPrevPeriod,
  getServiceLogs,
  getServiceLogsCount,
  getServiceOverviewStats,
  getSingleLog,
  getStatusCodeBreakdown,
  getTopEndpoints,
} from "@/queries/dashboard-queries";
import { getSingleService } from "@/queries/service-queries";

import {
  getErrorGroupsDoc,
  getLogLevelBreakdownDoc,
  getLogsByRequestIdDoc,
  getServiceLogsDoc,
  getServiceOverviewStatsDoc,
  getServiceTimeseriesStatsDoc,
  getSingleLogDoc,
  getSlowLogsDoc,
  getStatusCodeBreakdownDoc,
  getTopEndpointsDoc,
} from "./dashboard.docs";

const dashboard = createRouter();

// In-memory cache for count queries since they can be expensive in large datasets
const LOG_COUNT_CACHE_TTL_MS = 10_000;
const logCountCache = new Map<string, { value: number; expiresAt: number }>();

// the cursor is excluded because total count should represent the full filtered set,
// not the current page position.
const makeCountCacheKey = (params: {
  serviceId: string;
  period: string;
  level?: string;
  status?: number;
  environment?: string;
  method?: string;
  path?: string;
  to?: Date;
  from?: Date;
  search?: string;
  minDuration?: number;
}) => {
  return JSON.stringify({
    ...params,
    to: params.to?.toISOString(),
    from: params.from?.toISOString(),
  });
};

// ---------------------------------------------------------------------------
// Overview Stats Endpoint
// Purpose:
// - Produces KPI cards for a service: total requests, error rate, and latency
//   percentiles for the selected period.
//
// Behavior:
// - Verifies service existence first for predictable 404 behavior.
// - Computes current period metrics and compares against previous equal-length
//   period to return percentage deltas.
// - Returns sensible zero defaults when no logs exist yet.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Timeseries Stats Endpoint
// Purpose:
// - Returns bucketed metrics for charting trends over time (traffic, errors,
//   and latency percentiles).
//
// Behavior:
// - Supports optional metric projection to reduce payload size.
// - Supports optional dimension filters (`environment`, `method`, `path`, `level`)
//   so clients can chart a precise traffic slice.
// ---------------------------------------------------------------------------
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
      environment: z.string().optional(),
      method: MethodEnumSchema.optional(),
      path: z.string().optional(),
      level: LevelEnumSchema.optional(),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, granularity, metrics, environment, method, path, level } =
      c.req.valid("query");

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
      environment,
      method,
      path,
      level,
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

// ---------------------------------------------------------------------------
// Service Logs Endpoint
// Purpose:
// - Provides the main paginated log feed for a service with rich filtering.
//
// Behavior:
// - Uses cursor pagination for stable traversal under write-heavy workloads.
// - Can optionally compute exact filtered totals (`exactCount=true`) and reuses
//   a short-lived in-memory cache to reduce repeated count-query load.
// - Redacts sensitive transport fields (`ipHash`, `userAgent`) before response.
// ---------------------------------------------------------------------------
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
      // exactCount is opt-in because exact counts can be expensive on large datasets
      exactCount: z.coerce.boolean().default(false),
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
      exactCount,
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
        // Reject invalid cursors explicitly
        console.error("Failed to decode cursor:", cursor, err);
        return c.json(
          errorResponse("INVALID_CURSOR", "Invalid pagination cursor"),
          HttpStatusCodes.BAD_REQUEST,
        );
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

    // totalEstimate defaults to null and is only computed when exactCount=true
    let totalEstimate: number | null = null;

    if (exactCount) {
      const cacheKey = makeCountCacheKey({
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
      });

      const cached = logCountCache.get(cacheKey);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        // if cached data exist, serve to reduce repeated count load
        totalEstimate = cached.value;
      } else {
        // if there's no cached data, fetch & serve fresh data
        totalEstimate = await getServiceLogsCount({
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
        });

        logCountCache.set(cacheKey, {
          value: totalEstimate,
          expiresAt: now + LOG_COUNT_CACHE_TTL_MS,
        });
      }
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
        totalEstimate,
      },
    };

    return c.json(
      successResponse(logList, "Service logs retrieved successfully"),
      HttpStatusCodes.OK,
    );
  },
);

// ---------------------------------------------------------------------------
// Logs by Request ID
// Returns all log events that share the same requestId, ordered chronologically.
// This lets the dashboard reconstruct a full request trace when the user clicks
// into a specific request.  The route must be defined before /:serviceId/logs/:logId
// to prevent "by-request" from being captured as a logId param – though Hono
// resolves static segments first, registering explicitly avoids confusion.
// ---------------------------------------------------------------------------
dashboard.get(
  "/:serviceId/logs/by-request/:requestId",
  getLogsByRequestIdDoc,
  validator(
    "param",
    z.object({ serviceId: z.uuid(), requestId: z.string().min(1) }),
    validationHook,
  ),
  async (c) => {
    const { serviceId, requestId } = c.req.valid("param");

    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Strip ipHash and userAgent from each row
    const rawLogs = await getLogsByRequestId(serviceId, requestId);
    const logs = rawLogs.map(({ ipHash: _ih, userAgent: _ua, ...log }) => log);

    if (logs.length === 0) {
      return c.json(
        errorResponse("NOT_FOUND", "No logs found for this request ID"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    return c.json(
      successResponse(
        { requestId, logs, count: logs.length },
        "Request logs retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// ---------------------------------------------------------------------------
// Slow Logs
// A convenience wrapper around the standard /logs endpoint that pre-applies a
// duration filter.  Callers can pass minDuration to adjust the threshold; omitting
// it defaults to 1000 ms (1 second), which is a common SLO boundary.
// The effective threshold is echoed back in the response so clients know which
// cutoff was applied when they relied on the default.
// ---------------------------------------------------------------------------
dashboard.get(
  "/:serviceId/logs/slow",
  getSlowLogsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      // minDuration has a default of 1000 ms
      minDuration: z.coerce.number().min(1).default(1000),
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
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(50),
      exactCount: z.coerce.boolean().default(false),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const {
      period,
      minDuration,
      level,
      status,
      environment,
      method,
      path,
      to,
      from,
      cursor: cursorRaw,
      limit,
      exactCount,
    } = c.req.valid("query");

    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    // Decode cursor
    let cursorTimestamp: number | undefined;
    let cursorId: string | undefined;

    if (cursorRaw) {
      try {
        const normalizedCursor = cursorRaw.replace(/ /g, "+");
        const decoded = Buffer.from(normalizedCursor, "base64").toString(
          "utf-8",
        );
        const [timestampStr, idStr] = decoded.split(":");
        if (!timestampStr || !idStr) throw new Error("Invalid cursor format");

        const timestamp = parseInt(timestampStr);
        if (isNaN(timestamp) || !z.uuid().safeParse(idStr).success) {
          throw new Error("Invalid cursor values");
        }

        cursorTimestamp = timestamp;
        cursorId = idStr;
      } catch {
        return c.json(
          errorResponse("INVALID_CURSOR", "Invalid pagination cursor"),
          HttpStatusCodes.BAD_REQUEST,
        );
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
      limit,
      minDuration,
      cursor:
        cursorTimestamp && cursorId
          ? { timestamp: new Date(cursorTimestamp), id: cursorId }
          : undefined,
    });

    // Generate next cursor
    let nextCursor: string | null = null;
    if (logs.length === limit) {
      const lastLog = logs[logs.length - 1];
      nextCursor = Buffer.from(
        `${lastLog.timestamp.getTime()}:${lastLog.id}`,
      ).toString("base64");
    }

    // Optional exact count
    let totalEstimate: number | null = null;
    if (exactCount) {
      const cacheKey = makeCountCacheKey({
        serviceId,
        period,
        level,
        status,
        environment,
        method,
        path,
        to,
        from,
        search: undefined,
        // Include the active slow-log threshold in the key so count cache
        // invalidates immediately when minDuration changes.
        minDuration,
      });

      const cached = logCountCache.get(cacheKey);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        totalEstimate = cached.value;
      } else {
        totalEstimate = await getServiceLogsCount({
          serviceId,
          period,
          level,
          status,
          environment,
          method,
          path,
          to,
          from,
          minDuration,
        });
        logCountCache.set(cacheKey, {
          value: totalEstimate,
          expiresAt: now + LOG_COUNT_CACHE_TTL_MS,
        });
      }
    }

    return c.json(
      successResponse(
        {
          logs: logs.map(({ ipHash: _ih, userAgent: _ua, ...log }) => log),
          pagination: {
            hasNext: logs.length === limit,
            nextCursor,
            totalEstimate,
          },
          // Echo the threshold so the client knows what "slow" meant for this request
          thresholdMs: minDuration,
        },
        "Slow logs retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// ---------------------------------------------------------------------------
// Single Log Endpoint
// Purpose:
// - Returns details of one log record for drill-down interactions.
//
// Behavior:
// - Requires both `logId` and `timestamp` to align with hypertable/composite-key
//   lookup strategy and keep queries selective.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Status Breakdown Endpoint
// Purpose:
// - Returns status distribution for charting either as exact codes or grouped
//   categories (2xx/3xx/4xx/5xx).
//
// Behavior:
// - Shares filter semantics with other dashboard analytics endpoints.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Log Level Breakdown Endpoint
// Purpose:
// - Shows severity distribution (`debug/info/warn/error`) for alerting and
//   operational health trend monitoring.
//
// Behavior:
// - Returns count + percentage for each observed level.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Top Endpoints
// Ranks unique (method, path) pairs by a chosen metric (requests, errors,
// error_rate, p95_duration, p99_duration).  Useful for surfacing hotspots
// without requiring the user to scroll through raw logs.
// ---------------------------------------------------------------------------
dashboard.get(
  "/:serviceId/stats/top-endpoints",
  getTopEndpointsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      sortBy: TopEndpointSortBySchema.default("requests"),
      environment: z.string().optional(),
      method: MethodEnumSchema.optional(),
      // limit is capped at 50 to prevent excessively large payloads
      limit: z.coerce.number().min(1).max(50).default(10),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, sortBy, environment, method, limit } = c.req.valid("query");

    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const endpoints = await getTopEndpoints({
      serviceId,
      period,
      sortBy,
      environment,
      method,
      limit,
    });

    return c.json(
      successResponse(
        { endpoints, sortBy },
        "Top endpoints retrieved successfully",
      ),
      HttpStatusCodes.OK,
    );
  },
);

// ---------------------------------------------------------------------------
// Error Groups
// Fingerprints recurring errors by (method, path, status, message) so the
// dashboard can show "42 occurrences of the same 500 on POST /api/checkout"
// instead of 42 individual log lines.
// ---------------------------------------------------------------------------
dashboard.get(
  "/:serviceId/errors/groups",
  getErrorGroupsDoc,
  validator("param", z.object({ serviceId: z.uuid() }), validationHook),
  validator(
    "query",
    z.object({
      period: PeriodEnumSchema.default("24h"),
      environment: z.string().optional(),
      // limit is capped at 100. showing more than 100 distinct error fingerprints
      // is rarely useful and starts to become noise rather than signal.
      limit: z.coerce.number().min(1).max(100).default(20),
    }),
    validationHook,
  ),
  async (c) => {
    const { serviceId } = c.req.valid("param");
    const { period, environment, limit } = c.req.valid("query");

    const service = await getSingleService(serviceId);
    if (!service) {
      return c.json(
        errorResponse("NOT_FOUND", "Service not found"),
        HttpStatusCodes.NOT_FOUND,
      );
    }

    const result = await getErrorGroups({
      serviceId,
      period,
      environment,
      limit,
    });

    return c.json(
      successResponse(result, "Error groups retrieved successfully"),
      HttpStatusCodes.OK,
    );
  },
);

export default dashboard;
