import { createFileRoute, redirect } from "@tanstack/react-router";

import {
  $resolveDefaultServiceId,
  servicesQueryOptions,
} from "@/server/services";

export const Route = createFileRoute("/_app/")({
  beforeLoad: async ({ context }) => {
    const services = await context.queryClient.ensureQueryData(
      servicesQueryOptions(),
    );

    const serviceId = await $resolveDefaultServiceId({ data: services });

    if (!serviceId) {
      throw redirect({ to: "/get-started" });
    }

    throw redirect({
      to: "/services/$serviceId/overview",
      params: { serviceId },
    });
  },
});
