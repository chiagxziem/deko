import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { levelEnum, logEvent, methodEnum } from "../schemas/event.schema";

export const LevelEnumSchema = createSelectSchema(levelEnum);
export const MethodEnumSchema = createSelectSchema(methodEnum);
export const PeriodEnumSchema = z.enum(["1h", "24h", "7d", "30d"]);
export const GranularityEnumSchema = z.enum(["minute", "hour", "day"]);

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
    totalEstimate: z.number(),
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
