import { createFileRoute, redirect } from "@tanstack/react-router";

import { DUMMY_SERVICES, resolveDefaultServiceId } from "@/lib/service-cookie";

export const Route = createFileRoute("/_app/")({
  beforeLoad: () => {
    const serviceId = resolveDefaultServiceId(DUMMY_SERVICES);
    throw redirect({
      to: "/services/$serviceId/overview",
      params: { serviceId },
    });
  },
});
