import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ErrorGroupQuerySchema,
  ErrorGroupsResponseSchema,
  LogLevelBreakdownQuerySchema,
  LogLevelBreakdownSchema,
  LogsQuerySchema,
  ServiceLogListSchema,
  ServiceLogSchema,
  ServiceOverviewQuerySchema,
  ServiceOverviewStatsSchema,
  ServiceTimeseriesQuerySchema,
  ServiceTimeseriesStatsSchema,
  SlowLogsQuerySchema,
  SlowLogsResponseSchema,
  StatusBreakdownQuerySchema,
  StatusCodeBreakdownSchema,
  TopEndpointsQuerySchema,
  TopEndpointsResponseSchema,
} from "@repo/db/validators/dashboard.validator";

import { $fetchAndThrow } from "@/lib/fetch";
import { successResSchema } from "@/lib/schemas";

// ————— get service logs ———————————————————
export const $getServiceLogs = createServerFn()
  .inputValidator(
    LogsQuerySchema.extend({
      serviceId: z.uuid(),
    }).omit({
      to: true,
      from: true,
    }),
  )
  .handler(async ({ data }) => {
    const { serviceId, ...filters } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/logs`, {
      params: { serviceId },
      query: filters,
      output: successResSchema(ServiceLogListSchema),
    });

    return res.data;
  });

// ————— get slow logs ———————————————————
export const $getSlowLogs = createServerFn()
  .inputValidator(
    SlowLogsQuerySchema.extend({
      serviceId: z.uuid(),
    }).omit({
      to: true,
      from: true,
    }),
  )
  .handler(async ({ data }) => {
    const { serviceId, ...filters } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/logs/slow`, {
      params: { serviceId },
      query: filters,
      output: successResSchema(SlowLogsResponseSchema),
    });

    return res.data;
  });

// ————— get single log ———————————————————
export const $getSingleLog = createServerFn()
  .inputValidator(
    z.object({
      serviceId: z.uuid(),
      logId: z.uuid(),
      timestamp: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { serviceId, logId, timestamp } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/logs/:logId`, {
      params: { serviceId, logId },
      query: { timestamp },
      output: successResSchema(ServiceLogSchema),
    });

    return res.data;
  });

// ————— get overview stats ———————————————————
export const $getOverviewStats = createServerFn()
  .inputValidator(ServiceOverviewQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/stats/overview`, {
      params: { serviceId },
      query,
      output: successResSchema(ServiceOverviewStatsSchema),
    });

    return res.data;
  });

// ————— get timeseries stats ———————————————————
export const $getTimeseriesStats = createServerFn()
  .inputValidator(ServiceTimeseriesQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/stats/timeseries`, {
      params: { serviceId },
      query,
      output: successResSchema(ServiceTimeseriesStatsSchema),
    });

    return res.data;
  });

// ————— get status code breakdown ———————————————————
export const $getStatusBreakdown = createServerFn()
  .inputValidator(StatusBreakdownQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(
      `/dashboard/:serviceId/stats/status-breakdown`,
      {
        params: { serviceId },
        query,
        output: successResSchema(StatusCodeBreakdownSchema),
      },
    );

    return res.data;
  });

// ————— get log level breakdown ———————————————————
export const $getLogLevelBreakdown = createServerFn()
  .inputValidator(LogLevelBreakdownQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(
      `/dashboard/:serviceId/stats/log-level-breakdown`,
      {
        params: { serviceId },
        query,
        output: successResSchema(LogLevelBreakdownSchema),
      },
    );

    return res.data;
  });

// ————— get top endpoints ———————————————————
export const $getTopEndpoints = createServerFn()
  .inputValidator(TopEndpointsQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(
      `/dashboard/:serviceId/stats/top-endpoints`,
      {
        params: { serviceId },
        query,
        output: successResSchema(TopEndpointsResponseSchema),
      },
    );

    return res.data;
  });

// ————— get error groups ———————————————————
export const $getErrorGroups = createServerFn()
  .inputValidator(ErrorGroupQuerySchema.extend({ serviceId: z.uuid() }))
  .handler(async ({ data }) => {
    const { serviceId, ...query } = data;

    const res = await $fetchAndThrow(`/dashboard/:serviceId/errors/groups`, {
      params: { serviceId },
      query,
      output: successResSchema(ErrorGroupsResponseSchema),
    });

    return res.data;
  });
