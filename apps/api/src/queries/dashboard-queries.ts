import {
  and,
  asc,
  db,
  desc,
  eq,
  gte,
  ilike,
  like,
  lt,
  lte,
  or,
  sql,
} from "@repo/db";
import { logEvent } from "@repo/db/schemas/event.schema";
import {
  ErrorGroupsResponse,
  GranularityType,
  LevelType,
  LogLevelBreakdown,
  MethodType,
  PeriodType,
  StatusCodeBreakdown,
  TopEndpoint,
  TopEndpointSortBy,
} from "@repo/db/validators/dashboard.validator";

export type Period = PeriodType;
export type Granularity = GranularityType;
export type Method = MethodType;
export type Level = LevelType;

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
  // When provided, only logs with duration >= minDuration are included.
  // Used by the /logs/slow endpoint to filter by latency threshold.
  minDuration?: number;
};

export type TimeseriesFilters = {
  serviceId: string;
  granularity?: Granularity;
  period?: Period;
  from?: Date;
  to?: Date;
  // Optional dimension filters allow slicing the timeseries by a specific attribute.
  // Without these, every bucket aggregates all logs for the service regardless of
  // method, environment, path, or level.
  environment?: string;
  method?: Method;
  path?: string;
  level?: Level;
};

// Filters for the top-endpoints leaderboard query.
export type TopEndpointsFilters = {
  serviceId: string;
  period?: Period;
  from?: Date;
  to?: Date;
  // Optional dimension pre-filters applied before grouping so the leaderboard
  // reflects only the slice of traffic the user cares about.
  environment?: string;
  method?: Method;
  // Which metric to rank endpoints by (defaults to requests if omitted).
  sortBy?: TopEndpointSortBy;
  limit?: number;
};

// Filters for the error-groups aggregation query.
export type ErrorGroupFilters = {
  serviceId: string;
  period?: Period;
  from?: Date;
  to?: Date;
  environment?: string;
  limit?: number;
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
 * Returns the previous window for a given period length.
 *
 * Why this exists:
 * - Overview endpoints compare "current period" against the immediately
 *   preceding period of identical duration to compute percentage deltas.
 *
 * Example:
 * - If period is `24h`, the function returns `[now-48h, now-24h]`.
 * - Current period is then `[now-24h, now]`.
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
  const {
    serviceId,
    level,
    status,
    environment,
    method,
    path,
    search,
    period,
    from,
    to,
    cursor,
  } = filters;

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
      or(
        ilike(logEvent.path, searchPattern),
        ilike(logEvent.message, searchPattern),
      ) ?? sql`true`,
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
        and(
          eq(logEvent.timestamp, cursor.timestamp),
          lt(logEvent.id, cursor.id),
        ),
      ) ?? sql`true`,
    );
  }

  // When minDuration is provided, exclude all logs with a shorter response time.
  // This is used by the /logs/slow endpoint to enforce a latency threshold.
  const { minDuration } = filters;
  if (minDuration !== undefined)
    conditions.push(gte(logEvent.duration, minDuration));

  return { conditions, periodStart, periodEnd };
};

/**
 * Fetches a page of logs for a service with composable filters.
 *
 * Why this exists:
 * - Provides the canonical list query used by both `/logs` and `/logs/slow`.
 * - Consolidates pagination ordering to ensure cursor semantics remain stable.
 *
 * Behavior notes:
 * - Orders by `(timestamp DESC, id DESC)` for deterministic pagination.
 * - Applies wildcard path filtering and optional full-text search.
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
 * Computes the exact row count for a filtered log set.
 *
 * Why this exists:
 * - Some UI views need accurate totals for pagination controls.
 * - Count queries are intentionally separate from list queries so handlers can
 *   make this work optional (`exactCount=true`) and cache it aggressively.
 */
export const getServiceLogsCount = async (
  filters: LogFilters,
): Promise<number> => {
  const { conditions } = getLogConditions(filters);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(logEvent)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
};

/**
 * Calculates service-level summary metrics for a selected time window.
 *
 * Why this exists:
 * - Dashboard cards need high-level KPIs (traffic, errors, latency percentiles)
 *   without transferring large raw log volumes.
 *
 * Behavior notes:
 * - Uses SQL aggregates and percentile functions directly in the database.
 * - Returns zero-safe metrics for empty sets via `COALESCE`.
 * - Includes resolved period bounds so callers can echo the exact evaluated
 *   window in API responses.
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
    errorRate:
      stats.totalRequests > 0
        ? (stats.errorCount / stats.totalRequests) * 100
        : 0,
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
  const {
    serviceId,
    granularity,
    period = "24h",
    from,
    to,
    // Dimension filters that allow slicing the timeseries chart by a specific attribute.
    // For example, passing environment="prod" will only include production traffic in each bucket.
    environment,
    method,
    path,
    level,
  } = filters;

  // Use provided granularity or auto-select based on period
  const bucketSize = granularity ?? getDefaultGranularity(period);
  const bucketInterval =
    bucketSize === "minute"
      ? "1 minute"
      : bucketSize === "hour"
        ? "1 hour"
        : "1 day";

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

  // Build optional dimension conditions derived from the filter parameters.
  // These are added to the raw SQL so the time_bucket aggregation only considers
  // the requested slice, rather than requiring client-side post-filtering.
  const dimensionConditions = [];
  if (environment)
    dimensionConditions.push(eq(logEvent.environment, environment));
  if (method) dimensionConditions.push(eq(logEvent.method, method));
  if (path) {
    // Wildcard paths like /api/* are translated to SQL LIKE patterns.
    if (path.includes("*")) {
      dimensionConditions.push(like(logEvent.path, pathToLikePattern(path)));
    } else {
      dimensionConditions.push(eq(logEvent.path, path));
    }
  }
  if (level) dimensionConditions.push(eq(logEvent.level, level));

  // Use TimescaleDB's time_bucket for efficient aggregation.
  // Dimension conditions are appended to the WHERE clause only when present,
  // avoiding an unnecessary AND TRUE that could confuse query planners.
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
      ${dimensionConditions.length > 0 ? sql`AND ${and(...dimensionConditions)}` : sql``}
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
export const getSingleLog = async (
  serviceId: string,
  logId: string,
  timestamp: Date,
) => {
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

/**
 * Builds status-code breakdown analytics for dashboards.
 *
 * Why this exists:
 * - Enables two visualization styles from one query path:
 *   1) `groupBy=code` for exact status slices (e.g. 500, 404)
 *   2) `groupBy=category` for coarse classes (2xx, 4xx, 5xx)
 *
 * Behavior notes:
 * - Computes percentages relative to the filtered total row count.
 * - Applies the same shared filter builder as the log list endpoints to keep
 *   analytics and raw log views consistent.
 */
export const getStatusCodeBreakdown = async ({
  serviceId,
  period,
  environment,
  groupBy,
}: {
  serviceId: string;
  period: Period;
  groupBy: "category" | "code";
  environment?: string;
}): Promise<StatusCodeBreakdown> => {
  const { conditions } = getLogConditions({
    serviceId,
    period,
    environment,
  });

  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(logEvent)
    .where(and(...conditions));

  const breakdown =
    groupBy === "code"
      ? await db
          .select({
            status: logEvent.status,
            count: sql<number>`count(*)`,
            percentage: sql<number>`count(*)::real / ${total} * 100`,
          })
          .from(logEvent)
          .where(and(...conditions))
          .groupBy(logEvent.status)
          .orderBy(asc(logEvent.status))
      : await db
          .select({
            category: sql<string>`
              CASE
                WHEN ${logEvent.status} >= 200 AND ${logEvent.status} < 300 THEN '2xx'
                WHEN ${logEvent.status} >= 300 AND ${logEvent.status} < 400 THEN '3xx'
                WHEN ${logEvent.status} >= 400 AND ${logEvent.status} < 500 THEN '4xx'
                WHEN ${logEvent.status} >= 500 THEN '5xx'
                ELSE 'Other'
              END
            `,
            label: sql<string>`
              CASE
                WHEN ${logEvent.status} >= 200 AND ${logEvent.status} < 300 THEN 'Success'
                WHEN ${logEvent.status} >= 300 AND ${logEvent.status} < 400 THEN 'Redirection'
                WHEN ${logEvent.status} >= 400 AND ${logEvent.status} < 500 THEN 'Client Error'
                WHEN ${logEvent.status} >= 500 THEN 'Server Error'
                ELSE 'Other'
              END
            `,
            count: sql<number>`count(*)::int`,
            percentage: sql<number>`count(*)::real / ${total} * 100`,
          })
          .from(logEvent)
          .where(and(...conditions))
          .groupBy(
            sql`
              CASE
                WHEN ${logEvent.status} >= 200 AND ${logEvent.status} < 300 THEN '2xx'
                WHEN ${logEvent.status} >= 300 AND ${logEvent.status} < 400 THEN '3xx'
                WHEN ${logEvent.status} >= 400 AND ${logEvent.status} < 500 THEN '4xx'
                WHEN ${logEvent.status} >= 500 THEN '5xx'
                ELSE 'Other'
              END
            `,
            sql`
              CASE
                WHEN ${logEvent.status} >= 200 AND ${logEvent.status} < 300 THEN 'Success'
                WHEN ${logEvent.status} >= 300 AND ${logEvent.status} < 400 THEN 'Redirection'
                WHEN ${logEvent.status} >= 400 AND ${logEvent.status} < 500 THEN 'Client Error'
                WHEN ${logEvent.status} >= 500 THEN 'Server Error'
                ELSE 'Other'
              END
            `,
          )
          .orderBy(desc(sql`count(*)`));

  return { breakdown, total };
};

/**
 * Builds log-level distribution analytics for dashboards.
 *
 * Why this exists:
 * - Lets operators quickly understand severity distribution drift over time
 *   (e.g., spikes in `error` or `warn` levels).
 *
 * Behavior notes:
 * - Returns both absolute counts and percentage contribution per level.
 * - Shares filter semantics with the rest of dashboard analytics.
 */
export const getLogLevelBreakdown = async ({
  serviceId,
  period,
  environment,
}: {
  serviceId: string;
  period: Period;
  environment?: string;
}): Promise<LogLevelBreakdown> => {
  const { conditions } = getLogConditions({
    serviceId,
    period,
    environment,
  });

  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(logEvent)
    .where(and(...conditions));

  const breakdown = await db
    .select({
      level: logEvent.level,
      count: sql<number>`count(*)`,
      percentage: sql<number>`count(*)::real / ${total} * 100`,
    })
    .from(logEvent)
    .where(and(...conditions))
    .groupBy(logEvent.level)
    .orderBy(asc(logEvent.level));

  return { breakdown, total };
};

// ---------------------------------------------------------------------------
// Top Endpoints
// Groups all log events by (method, path) and computes aggregate performance
// stats per endpoint.  A dynamic ORDER BY expression lets callers rank by
// whichever signal matters most (volume, error count, latency, etc.) without
// requiring multiple queries or post-processing on the client.
// ---------------------------------------------------------------------------

export const getTopEndpoints = async (
  filters: TopEndpointsFilters,
): Promise<TopEndpoint[]> => {
  const {
    serviceId,
    period = "24h",
    from,
    to,
    environment,
    method,
    sortBy = "requests",
    limit = 10,
  } = filters;

  // Build time-range conditions.
  let startTime: Date;
  let endTime: Date;
  if (from && to) {
    startTime = from;
    endTime = to;
  } else {
    startTime = periodToDate(period);
    endTime = new Date();
  }

  const conditions = [
    eq(logEvent.serviceId, serviceId),
    gte(logEvent.timestamp, startTime),
    lte(logEvent.timestamp, endTime),
  ];

  // Optional pre-filters narrow the group by before aggregation.
  if (environment) conditions.push(eq(logEvent.environment, environment));
  if (method) conditions.push(eq(logEvent.method, method));

  // Map the sortBy enum value to a raw SQL ORDER BY expression.
  // Using predefined sql`` fragments is safe because sortBy is Zod-enum validated –
  // no user-controlled string ever reaches this switch.
  const orderByExprMap = {
    requests: sql`COUNT(*)`,
    errors: sql`COUNT(*) FILTER (WHERE status >= 400)`,
    error_rate: sql`COUNT(*) FILTER (WHERE status >= 400)::real / NULLIF(COUNT(*), 0)`,
    p95_duration: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration)`,
    p99_duration: sql`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration)`,
  } as const;
  const orderByExpr = orderByExprMap[sortBy];

  const result = await db.execute(sql`
    SELECT
      method,
      path,
      COUNT(*)::int AS requests,
      COUNT(*) FILTER (WHERE status >= 400)::int AS errors,
      COALESCE(AVG(duration), 0)::real AS "avgDuration",
      COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration), 0)::real AS "p95Duration",
      COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration), 0)::real AS "p99Duration"
    FROM log_event
    WHERE ${and(...conditions)}
    GROUP BY method, path
    ORDER BY ${orderByExpr} DESC NULLS LAST
    LIMIT ${limit}
  `);

  // errorRate is computed in TypeScript to avoid a second DB round-trip.
  // It is expressed as a percentage (0–100), consistent with the overview stats endpoint.
  return (
    result.rows as Array<{
      method: string;
      path: string;
      requests: number;
      errors: number;
      avgDuration: number;
      p95Duration: number;
      p99Duration: number;
    }>
  ).map((row) => ({
    method: row.method as TopEndpoint["method"],
    path: row.path,
    requests: row.requests,
    errors: row.errors,
    errorRate: row.requests > 0 ? (row.errors / row.requests) * 100 : 0,
    avgDuration: row.avgDuration,
    p95Duration: row.p95Duration,
    p99Duration: row.p99Duration,
  }));
};

// ---------------------------------------------------------------------------
// Error Groups
// Fingerprints recurring errors by (method, path, status, message) so the
// dashboard can surface "N occurrences of this error" rather than individual
// log lines.  COUNT(*) OVER() is evaluated after GROUP BY, giving us the total
// number of distinct groups before the LIMIT is applied in a single query.
// ---------------------------------------------------------------------------

export const getErrorGroups = async (
  filters: ErrorGroupFilters,
): Promise<ErrorGroupsResponse> => {
  const {
    serviceId,
    period = "24h",
    from,
    to,
    environment,
    limit = 20,
  } = filters;

  const conditions = [
    eq(logEvent.serviceId, serviceId),
    // Only include error status codes (4xx and 5xx).
    // This avoids including successful requests in the error group view.
    gte(logEvent.status, 400),
  ];

  if (from && to) {
    conditions.push(gte(logEvent.timestamp, from));
    conditions.push(lte(logEvent.timestamp, to));
  } else {
    conditions.push(gte(logEvent.timestamp, periodToDate(period)));
  }

  if (environment) conditions.push(eq(logEvent.environment, environment));

  const result = await db.execute(sql`
    SELECT
      method,
      path,
      status::int,
      message,
      COUNT(*)::int                  AS count,
      MIN(timestamp)                 AS "firstSeen",
      MAX(timestamp)                 AS "lastSeen",
      -- COUNT(*) OVER() counts the number of rows in the full result set AFTER
      -- GROUP BY but BEFORE LIMIT, so we get the total group count for free
      -- without a separate COUNT subquery.
      COUNT(*) OVER()::int           AS "totalGroups"
    FROM log_event
    WHERE ${and(...conditions)}
    GROUP BY method, path, status, message
    ORDER BY count DESC
    LIMIT ${limit}
  `);

  // Extract the total distinct group count from any row (it's the same on every row).
  const total =
    (result.rows[0] as { totalGroups?: number } | undefined)?.totalGroups ?? 0;

  return {
    groups: (
      result.rows as Array<{
        method: string;
        path: string;
        status: number;
        message: string | null;
        count: number;
        firstSeen: Date;
        lastSeen: Date;
        totalGroups: number;
      }>
    ).map(({ totalGroups: _t, ...row }) => ({
      // Cast method to the enum type; it comes back as a plain string from raw SQL.
      method: row.method as ErrorGroupsResponse["groups"][number]["method"],
      path: row.path,
      status: row.status,
      message: row.message,
      count: row.count,
      firstSeen: row.firstSeen,
      lastSeen: row.lastSeen,
    })),
    total,
  };
};

// ---------------------------------------------------------------------------
// Logs by Request ID
// Fetches all log events that share the same requestId, ordered
// chronologically so the dashboard can reconstruct a full request trace.
// No pagination: a single request trace is a bounded, small dataset.
// A hard limit of 200 guards against edge cases (e.g. fan-out services that
// emit many events per request).
// ---------------------------------------------------------------------------

export const getLogsByRequestId = async (
  serviceId: string,
  requestId: string,
) => {
  return await db
    .select()
    .from(logEvent)
    .where(
      and(eq(logEvent.serviceId, serviceId), eq(logEvent.requestId, requestId)),
    )
    // Ascending order exposes the request lifecycle from start to finish.
    .orderBy(asc(logEvent.timestamp), asc(logEvent.id))
    .limit(200);
};
