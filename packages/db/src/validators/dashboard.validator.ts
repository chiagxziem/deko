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
