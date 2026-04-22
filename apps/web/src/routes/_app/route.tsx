import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  $resolveDefaultServiceId,
  $setLastService,
  servicesQueryOptions,
} from "@/server/services";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context }) => {
    const services = await context.queryClient.ensureQueryData(
      servicesQueryOptions(),
    );

    const serviceId = await $resolveDefaultServiceId({ data: services });

    if (!serviceId) {
      throw redirect({ to: "/get-started" });
    }

    await $setLastService({ data: serviceId });
  },
  loader: async ({ context }) => {
    // await Promise.all([
    //   context.queryClient.prefetchQuery(servicesQueryOptions())
    // ])
    await context.queryClient.prefetchQuery(servicesQueryOptions());
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
