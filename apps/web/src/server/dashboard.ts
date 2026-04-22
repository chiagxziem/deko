import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  LogsQuerySchema,
  ServiceLogListSchema,
  ServiceLogSchema,
  SlowLogsQuerySchema,
  SlowLogsResponseSchema,
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
