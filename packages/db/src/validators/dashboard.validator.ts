import { z } from "zod";

export const ServiceOverviewStatsSchema = z.object({
  totalRequests: z.number(),
  errorCount: z.number(),
  errorRate: z.number(),
  avgDuration: z.number(),
  p50Duration: z.number(),
  p95Duration: z.number(),
  p99Duration: z.number(),
  period: z.object({
    from: z.number().transform((n) => new Date(n)),
    to: z.number().transform((n) => new Date(n)),
  }),
  comparison: z.object({
    totalRequestsChange: z.number().nullable(),
    errorRateChange: z.number().nullable(),
    avgDurationChange: z.number().nullable(),
  }),
});

export const ServiceTimeseriesStatsSchema = z.object({
  granularity: z.enum(["minute", "hour", "day"]),
  buckets: z.array(
    z.object({
      timestamp: z.number().transform((n) => new Date(n)),
      requests: z.number().optional(),
      errors: z.number().optional(),
      avgDuration: z.number().optional(),
    }),
  ),
});

export const ServiceLogListSchema = z.object({
  logs: z.array(
    z.object({
      id: z.uuid(),
      serviceId: z.uuid(),
      timestamp: z.number().transform((n) => new Date(n)),
      level: z.enum(["info", "warn", "error", "debug"]),
      method: z.enum([
        "GET",
        "HEAD",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "CONNECT",
        "OPTIONS",
        "TRACE",
      ]),
      path: z.string(),
      status: z.number(),
      duration: z.number(),
      environment: z.string(),
      message: z.string().nullable(),
      requestId: z.string().nullable(),
      sessionId: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    hasNext: z.boolean(),
    nextCursor: z.string().nullable(),
    totalEstimate: z.number(),
  }),
});
