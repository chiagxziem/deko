import { validator } from "hono-openapi";
import { z } from "zod";

import { createRouter } from "@/app";
import HttpStatusCodes from "@/lib/http-status-codes";
import { errorResponse, successResponse } from "@/lib/utils";
import { validationHook } from "@/middleware/validation-hook";
import { getPrevPeriod, getServiceLogs } from "@/queries/dashboard-queries";
import { getSingleService } from "@/queries/service-queries";
import { ServiceOverviewStatsSchema } from "@repo/db/validators/dashboard.validator";

import { getServiceOverviewStatsDoc } from "./dashboard.docs";

const dashboard = createRouter();

type ServiceOverviewStats = z.infer<typeof ServiceOverviewStatsSchema>;

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

    const serviceLogs = await getServiceLogs({ serviceId, period, environment });

    console.log(`SERVICE LOGS: ${serviceLogs}`);

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
    if (serviceLogs.length === 0) {
      return c.json(
        successResponse(defaultOverviewStats, "Service overview statistics retrieved successfully"),
        HttpStatusCodes.OK,
      );
    }

    // get previous period logs to calculate stats comparison
    const prevPeriodServiceLogs = await getServiceLogs({
      serviceId,
      from: getPrevPeriod(period).from,
      to: getPrevPeriod(period).to,
      environment,
    });

    const sortedDurations = serviceLogs.map((log) => log.duration).toSorted((a, b) => a - b);
    const getPercentile = (p: number) => {
      if (sortedDurations.length === 0) return 0;
      const index = Math.max(0, Math.ceil((p / 100) * sortedDurations.length) - 1);
      return sortedDurations[index] ?? 0;
    };

    const serviceOverviewStats: ServiceOverviewStats = serviceLogs.reduce(
      (stats, request) => {
        stats.totalRequests++;
        if (request.status >= 400) stats.errorCount++;
        stats.avgDuration += request.duration;
        return stats;
      },
      {
        totalRequests: 0,
        errorCount: 0,
        errorRate: 0,
        avgDuration: 0,
        p50Duration: getPercentile(50),
        p95Duration: getPercentile(95),
        p99Duration: getPercentile(99),
        period: {
          from: serviceLogs[0].timestamp,
          to: serviceLogs[serviceLogs.length - 1].timestamp,
        },
        comparison: {
          totalRequestsChange: 0,
          errorRateChange: 0,
          avgDurationChange: 0,
        },
      },
    );

    serviceOverviewStats.errorRate = (serviceOverviewStats.errorCount / serviceLogs.length) * 100;
    // what is gotten in the reduce is the sum of all durations, so we need to divide by the number of requests to get the average
    serviceOverviewStats.avgDuration /= serviceLogs.length;

    if (prevPeriodServiceLogs.length > 0) {
      serviceOverviewStats.comparison.totalRequestsChange =
        ((serviceOverviewStats.totalRequests - prevPeriodServiceLogs.length) /
          prevPeriodServiceLogs.length) *
        100;
    }

    const prevPeriodErrorCount = prevPeriodServiceLogs.filter((log) => log.status >= 400).length;
    if (prevPeriodErrorCount > 0) {
      serviceOverviewStats.comparison.errorRateChange =
        ((serviceOverviewStats.errorCount - prevPeriodErrorCount) / prevPeriodErrorCount) * 100;
    }

    const prevPeriodAvgDuration =
      prevPeriodServiceLogs.reduce((totalDuration, log) => totalDuration + log.duration, 0) /
      prevPeriodServiceLogs.length;

    if (prevPeriodAvgDuration > 0) {
      serviceOverviewStats.comparison.avgDurationChange =
        ((serviceOverviewStats.avgDuration - prevPeriodAvgDuration) / prevPeriodAvgDuration) * 100;
    }

    return c.json(
      successResponse(serviceOverviewStats, "Service overview statistics retrieved successfully"),
      HttpStatusCodes.OK,
    );
  },
);

export default dashboard;
