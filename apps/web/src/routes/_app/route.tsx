import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useNavigationOverlay } from "@/hooks/use-navigation-overlay";
import { cn } from "@/lib/utils";
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
    await context.queryClient.prefetchQuery(servicesQueryOptions());
  },
  component: AppLayout,
});

function AppLayout() {
  const { isNavigating } = useNavigationOverlay();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {isNavigating && (
          <div className="absolute inset-0 isolate z-20 flex bg-black/60 duration-100 supports-backdrop-filter:backdrop-blur-xs">
            <div className="flex h-svh w-full items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-transparent border-t-foreground/60" />
            </div>
          </div>
        )}
        <AppHeader />
        <div
          className={cn(
            "relative flex-1 p-4 md:p-6",
            isNavigating ? "overflow-hidden" : "overflow-auto",
          )}
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
