import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { levelEnum, logEvent, methodEnum } from "../schemas/event.schema";

export const LevelEnumSchema = createSelectSchema(levelEnum);
export const MethodEnumSchema = createSelectSchema(methodEnum);
export const PeriodEnumSchema = z.enum(["1h", "24h", "7d", "30d"]);
export const GranularityEnumSchema = z.enum(["minute", "hour", "day"]);
export const TopEndpointSortBySchema = z.enum([
  "requests",
  "errors",
  "error_rate",
  "p95_duration",
  "p99_duration",
]);

export const ServiceOverviewStatsSchema = z.object({
  totalRequests: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgDuration: z.number(),
  p50Duration: z.number(),
  p95Duration: z.number(),
  p99Duration: z.number(),
  period: z.object({
    from: z.iso.datetime().transform((n) => new Date(n)),
    to: z.iso.datetime().transform((n) => new Date(n)),
  }),
  comparison: z.object({
    totalRequestsChange: z.number().nullable(),
    errorRateChange: z.number().nullable(),
    avgDurationChange: z.number().nullable(),
  }),
});

export const ServiceTimeseriesStatsSchema = z.object({
  granularity: GranularityEnumSchema,
  buckets: z.array(
    z.object({
      timestamp: z.iso.datetime().transform((n) => new Date(n)),
      requests: z.number().optional(),
      errors: z.number().optional(),
      avgDuration: z.number().optional(),
      p50Duration: z.number().optional(),
      p95Duration: z.number().optional(),
      p99Duration: z.number().optional(),
    }),
  ),
});

export const ServiceLogListSchema = z.object({
  logs: z.array(
    z.object({
      id: z.uuid(),
      serviceId: z.uuid(),
      timestamp: z.iso.datetime().transform((n) => new Date(n)),
      level: LevelEnumSchema,
      method: MethodEnumSchema,
      path: z.string(),
      status: z.number(),
      duration: z.number(),
      environment: z.string(),
      requestId: z.string(),
      message: z.string().nullable(),
      sessionId: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    hasNext: z.boolean(),
    nextCursor: z.string().nullable(),
    totalEstimate: z.number().nullable(),
  }),
});

export const ServiceLogSchema = createSelectSchema(logEvent).extend({
  timestamp: z.iso.datetime().transform((n) => new Date(n)),
  receivedAt: z.iso.datetime().transform((n) => new Date(n)),
});

export const StatusCodeBreakdownSchema = z.object({
  breakdown: z.array(
    z.union([
      z.object({
        status: z.number(),
        count: z.number(),
        percentage: z.number(),
      }),
      z.object({
        category: z.string(),
        label: z.string(),
        count: z.number(),
        percentage: z.number(),
      }),
    ]),
  ),
  total: z.number(),
});

export const LogLevelBreakdownSchema = z.object({
  breakdown: z.array(
    z.object({
      level: LevelEnumSchema,
      count: z.number(),
      percentage: z.number(),
    }),
  ),
  total: z.number(),
});

export const TopEndpointSchema = z.object({
  method: MethodEnumSchema,
  path: z.string(),
  requests: z.number(),
  errors: z.number(),
  errorRate: z.number(),
  avgDuration: z.number(),
  p95Duration: z.number(),
  p99Duration: z.number(),
});

export const TopEndpointsResponseSchema = z.object({
  endpoints: z.array(TopEndpointSchema),
  sortBy: TopEndpointSortBySchema,
});

export const ErrorGroupSchema = z.object({
  method: MethodEnumSchema,
  path: z.string(),
  status: z.number(),
  message: z.string().nullable(),
  count: z.number(),
  firstSeen: z.iso.datetime().transform((n) => new Date(n)),
  lastSeen: z.iso.datetime().transform((n) => new Date(n)),
});

export const ErrorGroupsResponseSchema = z.object({
  groups: z.array(ErrorGroupSchema),
  total: z.number(),
});

export const LogsQuerySchema = z.object({
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
});

export const RequestTraceLogsResponseSchema = z.object({
  requestId: z.string(),
  logs: z.array(
    z.object({
      id: z.uuid(),
      serviceId: z.uuid(),
      timestamp: z.iso.datetime().transform((n) => new Date(n)),
      level: LevelEnumSchema,
      method: MethodEnumSchema,
      path: z.string(),
      status: z.number(),
      duration: z.number(),
      environment: z.string(),
      requestId: z.string(),
      message: z.string().nullable(),
      sessionId: z.string().nullable(),
    }),
  ),
  count: z.number(),
});

export const SlowLogsQuerySchema = LogsQuerySchema.extend({
  minDuration: z.coerce.number().min(1).default(1000),
});

// ---------------------------------------------------------------------------
// Slow Logs – same paginated structure as ServiceLogListSchema but with an
// added thresholdMs field that echoes the effective duration cutoff.
// Returning thresholdMs is important when the route applies a default threshold
// so the client knows which value was actually used.
// ---------------------------------------------------------------------------

export const SlowLogsResponseSchema = z.object({
  logs: z.array(
    z.object({
      id: z.uuid(),
      serviceId: z.uuid(),
      timestamp: z.iso.datetime().transform((n) => new Date(n)),
      level: LevelEnumSchema,
      method: MethodEnumSchema,
      path: z.string(),
      status: z.number(),
      duration: z.number(),
      environment: z.string(),
      requestId: z.string(),
      message: z.string().nullable(),
      sessionId: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    hasNext: z.boolean(),
    nextCursor: z.string().nullable(),
    totalEstimate: z.number().nullable(),
  }),
  thresholdMs: z.number(),
});

export type LevelType = z.infer<typeof LevelEnumSchema>;
export type MethodType = z.infer<typeof MethodEnumSchema>;
export type PeriodType = z.infer<typeof PeriodEnumSchema>;
export type GranularityType = z.infer<typeof GranularityEnumSchema>;
export type ServiceOverviewStats = z.infer<typeof ServiceOverviewStatsSchema>;
export type ServiceTimeseriesStats = z.infer<
  typeof ServiceTimeseriesStatsSchema
>;
export type ServiceLogList = z.infer<typeof ServiceLogListSchema>;
export type ServiceLog = z.infer<typeof ServiceLogSchema>;
export type StatusCodeBreakdown = z.infer<typeof StatusCodeBreakdownSchema>;
export type LogLevelBreakdown = z.infer<typeof LogLevelBreakdownSchema>;
export type TopEndpointSortBy = z.infer<typeof TopEndpointSortBySchema>;
export type TopEndpoint = z.infer<typeof TopEndpointSchema>;
export type TopEndpointsResponse = z.infer<typeof TopEndpointsResponseSchema>;
export type ErrorGroup = z.infer<typeof ErrorGroupSchema>;
export type ErrorGroupsResponse = z.infer<typeof ErrorGroupsResponseSchema>;
export type RequestLogsResponse = z.infer<
  typeof RequestTraceLogsResponseSchema
>;
export type SlowLogsResponse = z.infer<typeof SlowLogsResponseSchema>;
