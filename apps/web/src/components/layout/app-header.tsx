import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams, useRouterState } from "@tanstack/react-router";

import { PeriodSelector } from "@/components/layout/period-selector";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PAGE_SEGMENT_TITLES: Record<string, string> = {
  overview: "Overview",
  logs: "Logs",
  errors: "Errors",
  endpoints: "Endpoints",
  settings: "Settings",
};

export function AppHeader() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const { serviceId = "" } = useParams({ strict: false });

  // oxlint-disable-next-line unicorn/prefer-array-find
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const title = PAGE_SEGMENT_TITLES[lastSegment] ?? "Deko";

  const homeHref = serviceId ? `/services/${serviceId}/overview` : "/";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4">
      <div className="flex items-center gap-1.5">
        <SidebarTrigger size={"icon"} className="-ml-1" />
        <span
          aria-hidden="true"
          className="mr-2 ml-1 h-4 w-px shrink-0 self-center bg-border/70"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:inline-flex">
              <BreadcrumbLink href={homeHref}>Deko</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="mr-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Live</span>
        </div>

        <span
          aria-hidden="true"
          className="mx-1 h-4 w-px shrink-0 self-center bg-border/70"
        />

        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            <span className="sr-only">Refresh</span>
          </TooltipTrigger>
          <TooltipContent>Refresh data</TooltipContent>
        </Tooltip>

        <PeriodSelector />
      </div>
    </header>
  );
}
