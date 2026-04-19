import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ServiceSelectSchema } from "@repo/db/validators/service.validator";

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
  const { data, error } = await $fetch("/services", {
    output: successResSchema(z.array(ServiceSelectSchema)),
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data.data;
});
// get all services query options
export const servicesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.services(),
    queryFn: $getAllServices,
  });

// ————— create service server fn ———————————————————
export const $createService = createServerFn({ method: "POST" })
  .inputValidator(z.string())
  .handler(async ({ data: name }) => {
    const data = await $fetchAndThrow("/services", {
      method: "POST",
      body: { name },
      output: successResSchema(ServiceSelectSchema),
    });

    return data.data;
  });

// ————— get single service ———————————————————
export const $getSingleService = createServerFn()
  .inputValidator(z.uuid())
  .handler(async ({ data: serviceId }) => {
    const { data, error } = await $fetch("/services/:serviceId", {
      params: { serviceId },
      output: successResSchema(ServiceSelectSchema),
    });

    if (error) {
      console.error(error);
      return null;
    }

    return data.data;
  });
// get single service query options
export const singleServiceQueryOptions = (serviceId: string) =>
  queryOptions({
    queryKey: queryKeys.service(serviceId),
    queryFn: () => $getSingleService({ data: serviceId }),
  });

// ————— update service server fn ———————————————————
export const $updateService = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string(), serviceId: z.uuid() }))
  .handler(async ({ data: { name, serviceId } }) => {
    const data = await $fetchAndThrow("/services/:serviceId", {
      method: "PATCH",
      params: { serviceId },
      body: { name },
      output: successResSchema(ServiceSelectSchema),
    });

    return data.data;
  });
