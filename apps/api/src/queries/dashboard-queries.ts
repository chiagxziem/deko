import { and, db, desc, eq, gte, ilike, like, lt, lte, or, sql } from "@repo/db";
import { logEvent } from "@repo/db/schemas/event.schema";
import {
  GranularityType,
  LevelType,
  MethodType,
  PeriodType,
} from "@repo/db/validators/dashboard.validator";

export type Period = "1h" | "24h" | "7d" | "30d";
export type Granularity = "minute" | "hour" | "day";
export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE";

export type LogFilters = {
  serviceId: string;
  level?: Level;
  status?: number;
  environment?: string;
  method?: Method;
  path?: string;
  search?: string;
  period?: Period;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
  cursor?: {
    timestamp: Date;
    id: string;
  };
};

export type TimeseriesFilters = {
  serviceId: string;
  granularity?: Granularity;
  period?: Period;
  from?: Date;
  to?: Date;
};

/**
 * Converts a period string to a Date representing the start of that period.
 * @param period - The period to convert (1h, 24h, 7d, 30d)
 * @returns The start date for the period
 */
const periodToDate = (period: Period): Date => {
  const now = new Date();
  switch (period) {
    case "1h":
      return new Date(now.getTime() - 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
};

/**
 * Returns the from/to dates for the previous period (for comparison stats)
 * @param period - The period to get the previous range for
 * @returns Object with `from` and `to` dates for the previous period
 */
export const getPrevPeriod = (period: Period): { from: Date; to: Date } => {
  const now = new Date();
  const periodMs = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  }[period];

  return {
    from: new Date(now.getTime() - 2 * periodMs),
    to: new Date(now.getTime() - periodMs),
  };
};

/**
 * Determines the best granularity based on the period.
 * - 1h → minute (60 data points)
 * - 24h → hour (24 data points)
 * - 7d/30d → day (7-30 data points)
 */
const getDefaultGranularity = (period: Period): Granularity => {
  switch (period) {
    case "1h":
      return "minute";
    case "24h":
      return "hour";
    case "7d":
    case "30d":
      return "day";
  }
};

/**
 * Converts a path filter with wildcards to a SQL LIKE pattern.
 * Supports wildcards like /api/* which becomes /api/%
 * @param path - The path pattern to convert
 * @returns The SQL LIKE pattern
 */
const pathToLikePattern = (path: string): string => {
  // Escape SQL LIKE special characters (% and _) in the path
  let pattern = path.replace(/%/g, "\\%").replace(/_/g, "\\_");
  // Convert * wildcards to SQL %
  pattern = pattern.replace(/\*/g, "%");
  return pattern;
};

/**
 * Internal helper to build filtering conditions for logs.
 * Centralizes filtering logic for logs, counts, and stats.
 */
const getLogConditions = (filters: LogFilters) => {
  const { serviceId, level, status, environment, method, path, search, period, from, to, cursor } =
    filters;

  const conditions = [eq(logEvent.serviceId, serviceId)];

  if (level) conditions.push(eq(logEvent.level, level));
  if (status) conditions.push(eq(logEvent.status, status));
  if (environment) conditions.push(eq(logEvent.environment, environment));
  if (method) conditions.push(eq(logEvent.method, method));

  // Path filtering with wildcard support
  if (path) {
    if (path.includes("*")) {
      conditions.push(like(logEvent.path, pathToLikePattern(path)));
    } else {
      conditions.push(eq(logEvent.path, path));
    }
  }

  // full-text search across path and message fields
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(ilike(logEvent.path, searchPattern), ilike(logEvent.message, searchPattern)) ?? sql`true`,
    );
  }

  let periodStart: Date | undefined;
  let periodEnd: Date | undefined;

  if (period) {
    periodStart = periodToDate(period);
    periodEnd = new Date();
  } else {
    if (from) periodStart = from;
    if (to) periodEnd = to;
  }

  if (periodStart) conditions.push(gte(logEvent.timestamp, periodStart));
  if (periodEnd) conditions.push(lte(logEvent.timestamp, periodEnd));

  // if cursor is present, we prioritize the cursor logic for pagination
  // cursor logic: (timestamp < cursorTime) ie get all logs that happened before the cursor time OR (timestamp = cursorTime AND id < cursorId) ie get all logs that happened at the same time as the cursor but with a smaller id
  if (cursor) {
    conditions.push(
      or(
        lt(logEvent.timestamp, cursor.timestamp),
        and(eq(logEvent.timestamp, cursor.timestamp), lt(logEvent.id, cursor.id)),
      ) ?? sql`true`,
    );
  }

  return { conditions, periodStart, periodEnd };
};

/**
 * Fetches logs for a specific service based on the provided filters.
 */
export const getServiceLogs = async (filters: LogFilters) => {
  const { limit = 50, offset = 0 } = filters;
  const { conditions } = getLogConditions(filters);

  return await db
    .select()
    .from(logEvent)
    .where(and(...conditions))
    .orderBy(desc(logEvent.timestamp), desc(logEvent.id))
    .limit(limit)
    .offset(offset);
};

/**
 * Gets the exact count of logs matching the filters.
 * Used for totalEstimate in pagination.
 */
export const getServiceLogsCount = async (filters: LogFilters): Promise<number> => {
  const { conditions } = getLogConditions(filters);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(logEvent)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
};

/**
 * Calculates overview stats using SQL aggregation.
 */
export const getServiceOverviewStats = async (filters: LogFilters) => {
  const { conditions, periodStart, periodEnd } = getLogConditions(filters);

  const result = await db.execute(sql`
    SELECT
      COUNT(*)::int AS "totalRequests",
      COUNT(*) FILTER (WHERE status >= 400)::int AS "errorCount",
      COALESCE(AVG(duration), 0)::real AS "avgDuration",
      COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration), 0)::real AS "p50Duration",
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration), 0)::real AS "p95Duration",
      COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration), 0)::real AS "p99Duration"
    FROM log_event
    WHERE ${and(...conditions)}
  `);

  const stats = result.rows[0] as {
    totalRequests: number;
    errorCount: number;
    avgDuration: number;
    p50Duration: number;
    p95Duration: number;
    p99Duration: number;
  };

  return {
    ...stats,
    errorRate: stats.totalRequests > 0 ? (stats.errorCount / stats.totalRequests) * 100 : 0,
    period: {
      from: periodStart ?? new Date(),
      to: periodEnd ?? new Date(),
    },
  };
};

/**
 * Fetches time-bucketed aggregated data for charting.
 *
 * Use cases in the dashboard:
 * - Request volume chart: Show requests over time (line/area chart)
 * - Error rate trends: Track error spikes and patterns
 * - Latency monitoring: Visualize avg/p95 response times
 * - Traffic patterns: Identify peak usage hours
 *
 * @param filters - The filters to apply including granularity
 * @returns Bucketed timeseries data with counts and avg duration
 */
export const getLogTimeseries = async (filters: TimeseriesFilters) => {
  const { serviceId, granularity, period = "24h", from, to } = filters;

  // Use provided granularity or auto-select based on period
  const bucketSize = granularity ?? getDefaultGranularity(period);
  const bucketInterval =
    bucketSize === "minute" ? "1 minute" : bucketSize === "hour" ? "1 hour" : "1 day";

  // Determine time range
  let startTime: Date;
  let endTime: Date;

  if (period) {
    startTime = periodToDate(period);
    endTime = new Date();
  } else {
    startTime = from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    endTime = to ?? new Date();
  }

  // Use TimescaleDB's time_bucket for efficient aggregation
  const result = await db.execute(sql`
    SELECT
      time_bucket(${bucketInterval}::interval, timestamp) AS bucket,
      COUNT(*)::int AS requests,
      COUNT(*) FILTER (WHERE status >= 400)::int AS errors,
      AVG(duration)::real AS avg_duration,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration)::real AS p50_duration,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration)::real AS p95_duration,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration)::real AS p99_duration
    FROM log_event
    WHERE service_id = ${serviceId}
      AND timestamp >= ${startTime}
      AND timestamp <= ${endTime}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  return {
    granularity: bucketSize,
    period: { from: startTime, to: endTime },
    buckets: result.rows as Array<{
      bucket: Date;
      requests: number;
      errors: number;
      avg_duration: number;
      p50_duration: number;
      p95_duration: number;
      p99_duration: number;
    }>,
  };
};

/**
 * Fetches a single log event by ID.
 * Note: timestamp is required for efficient lookup due to composite primary key.
 *
 * @param serviceId - The service ID
 * @param logId - The log event ID
 * @param timestamp - The log timestamp (required for hypertable lookup)
 * @returns The log event or null if not found
 */
export const getSingleLog = async (serviceId: string, logId: string, timestamp: Date) => {
  const result = await db
    .select()
    .from(logEvent)
    .where(
      and(
        eq(logEvent.serviceId, serviceId),
        eq(logEvent.id, logId),
        eq(logEvent.timestamp, timestamp),
      ),
    )
    .limit(1);

  return result[0] ?? null;
};
