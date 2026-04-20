import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ServiceSelectSchema,
  ServiceTokenPublicSchema,
  ServiceTokenSelectSchema,
} from "@repo/db/validators/service.validator";

import { $getLastServiceId, $setLastServiceId } from "@/lib/cookies";
import { $fetch, $fetchAndThrow } from "@/lib/fetch";
import { queryKeys } from "@/lib/query-keys";
import { successResSchema } from "@/lib/schemas";

// ————— resolve default service id ————————————————————
export const $resolveDefaultServiceId = createServerFn()
  .inputValidator(
    z.array(
      z.object({
        id: z.uuid(),
      }),
    ),
  )
  .handler(({ data: services }) => {
    if (services.length === 0) return null;
    const lastServiceId = $getLastServiceId();
    const valid = services.find((s) => s.id === lastServiceId);
    return valid ? valid.id : services[0].id;
  });

// ————— set last service ———————————————————
export const $setLastService = createServerFn()
  .inputValidator(z.uuid())
  .handler(({ data: serviceId }) => {
    $setLastServiceId(serviceId);
  });

// ————— get all services ———————————————————
export const $getAllServices = createServerFn().handler(async () => {
  const { data: res, error } = await $fetch("/services", {
    output: successResSchema(z.array(ServiceSelectSchema)),
  });

  if (error) {
    console.error(error);
    return null;
  }

  return res.data;
});
// get all services query options
export const servicesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.services(),
    queryFn: $getAllServices,
  });

// ————— create service server fn ———————————————————
export const $createService = createServerFn({ method: "POST" })
  .inputValidator(z.string().min(1))
  .handler(async ({ data: name }) => {
    const res = await $fetchAndThrow("/services", {
      method: "POST",
      body: { name },
      output: successResSchema(ServiceSelectSchema),
    });

    return res.data;
  });

// ————— get single service ———————————————————
export const $getSingleService = createServerFn()
  .inputValidator(z.uuid())
  .handler(async ({ data: serviceId }) => {
    const { data: res, error } = await $fetch("/services/:serviceId", {
      params: { serviceId },
      output: successResSchema(
        ServiceSelectSchema.extend({
          tokens: z.array(ServiceTokenPublicSchema),
        }),
      ),
    });

    if (error) {
      console.error(error);
      return null;
    }

    return res.data;
  });
// get single service query options
export const singleServiceQueryOptions = (serviceId: string) =>
  queryOptions({
    queryKey: queryKeys.service(serviceId),
    queryFn: () => $getSingleService({ data: serviceId }),
  });

// ————— update service server fn ———————————————————
export const $updateService = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1), serviceId: z.uuid() }))
  .handler(async ({ data: { name, serviceId } }) => {
    const res = await $fetchAndThrow("/services/:serviceId", {
      method: "PATCH",
      params: { serviceId },
      body: { name },
      output: successResSchema(
        ServiceSelectSchema.extend({
          tokens: z.array(ServiceTokenPublicSchema),
        }),
      ),
    });

    return res.data;
  });

// ————— delete service server fn ———————————————————
export const $deleteService = createServerFn({ method: "POST" })
  .inputValidator(z.uuid())
  .handler(async ({ data: serviceId }) => {
    const res = await $fetchAndThrow("/services/:serviceId", {
      method: "DELETE",
      params: { serviceId },
      output: successResSchema(
        z.object({
          status: z.literal("ok"),
        }),
      ),
    });

    return res.data;
  });

// ————— create service token server fn ———————————————————
export const $createServiceToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1), serviceId: z.uuid() }))
  .handler(async ({ data: { name, serviceId } }) => {
    const res = await $fetchAndThrow("/services/:serviceId/tokens", {
      method: "POST",
      params: { serviceId },
      body: { name },
      output: successResSchema(ServiceTokenSelectSchema),
    });

    return res.data;
  });

// ————— update service token server fn ———————————————————
export const $updateServiceToken = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      serviceId: z.uuid(),
      tokenId: z.uuid(),
    }),
  )
  .handler(async ({ data: { name, serviceId, tokenId } }) => {
    const res = await $fetchAndThrow("/services/:serviceId/tokens/:tokenId", {
      method: "PATCH",
      params: { serviceId, tokenId },
      body: { name },
      output: successResSchema(ServiceTokenPublicSchema),
    });

    return res.data;
  });

// ————— rotate service token server fn ———————————————————
export const $rotateServiceToken = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      serviceId: z.uuid(),
      tokenId: z.uuid(),
    }),
  )
  .handler(async ({ data: { serviceId, tokenId } }) => {
    const res = await $fetchAndThrow(
      "/services/:serviceId/tokens/:tokenId/rotate",
      {
        method: "POST",
        params: { serviceId, tokenId },
        output: successResSchema(ServiceTokenSelectSchema),
      },
    );

    return res.data;
  });

// ————— delete service token server fn ———————————————————
export const $deleteServiceToken = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      serviceId: z.uuid(),
      tokenId: z.uuid(),
    }),
  )
  .handler(async ({ data: { serviceId, tokenId } }) => {
    const res = await $fetchAndThrow("/services/:serviceId/tokens/:tokenId", {
      method: "DELETE",
      params: { serviceId, tokenId },
      output: successResSchema(
        z.object({
          status: z.literal("ok"),
        }),
      ),
    });

    return res.data;
  });
