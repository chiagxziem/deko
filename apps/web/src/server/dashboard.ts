import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  LogsQuerySchema,
  ServiceLogListSchema,
  ServiceLogSchema,
  SlowLogsQuerySchema,
  SlowLogsResponseSchema,
} from "@repo/db/validators/dashboard.validator";

import { $fetch } from "@/lib/fetch";
import { successResSchema } from "@/lib/schemas";

// function buildQueryString(params: Record<string, unknown>): string {
//   const searchParams = new URLSearchParams();
//   for (const [key, value] of Object.entries(params)) {
//     if (value !== undefined && value !== null && value !== "") {
//       searchParams.set(key, String(value));
//     }
//   }
//   const qs = searchParams.toString();
//   return qs ? `?${qs}` : "";
// }

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

    const { data: res, error } = await $fetch(`/dashboard/:serviceId/logs`, {
      params: { serviceId },
      query: filters,
      output: successResSchema(ServiceLogListSchema),
    });

    if (error) {
      console.error(error);
      return null;
    }

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

    const { data: res, error } = await $fetch(
      `/dashboard/:serviceId/logs/slow`,
      {
        params: { serviceId },
        query: filters,
        output: successResSchema(SlowLogsResponseSchema),
      },
    );

    if (error) {
      console.error(error);
      return null;
    }

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

    const { data: res, error } = await $fetch(
      `/dashboard/:serviceId/logs/:logId`,
      {
        params: { serviceId, logId },
        query: { timestamp },
        output: successResSchema(ServiceLogSchema),
      },
    );

    if (error) {
      console.error(error);
      return null;
    }

    return res.data;
  });
