import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef } from "react";
import { z } from "zod";

import type { TopEndpointSortBy } from "@repo/db/validators/dashboard.validator";

import { EndpointsTable } from "@/components/endpoints/endpoints-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { $getTopEndpoints } from "@/server/dashboard";
import { usePeriodStore } from "@/stores/period-store";

const endpointsSearchSchema = z.object({
  sortBy: z
    .enum(["requests", "errors", "error_rate", "p95_duration", "p99_duration"])
    .catch("requests"),
});

const SORT_TAB_OPTIONS: Array<{ value: TopEndpointSortBy; label: string }> = [
  { value: "requests", label: "Most Requests" },
  { value: "errors", label: "Most Errors" },
  { value: "error_rate", label: "Highest Error Rate" },
  { value: "p95_duration", label: "Highest P95" },
  { value: "p99_duration", label: "Highest P99" },
];

const EMPTY_ENDPOINTS: never[] = [];

export const Route = createFileRoute("/_app/services/$serviceId/endpoints")({
  validateSearch: endpointsSearchSchema,
  component: EndpointsPage,
});

function EndpointsPage() {
  const searchParams = useSearch({
    from: "/_app/services/$serviceId/endpoints",
  });
  const { serviceId } = useParams({
    from: "/_app/services/$serviceId/endpoints",
  });
  const navigate = useNavigate();

  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const navigateWithSearch = useCallback(
    (newSearch: Partial<z.infer<typeof endpointsSearchSchema>>) => {
      void navigate({
        to: "/services/$serviceId/endpoints",
        params: { serviceId },
        search: { ...searchParamsRef.current, ...newSearch },
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, serviceId],
  );

  const period = usePeriodStore((s) => s.period);
  const sortBy = searchParams.sortBy;

  const getTopEndpoints = useServerFn($getTopEndpoints);

  const endpointsQuery = useQuery({
    queryKey: queryKeys.topEndpoints(serviceId, { period, sortBy, limit: 50 }),
    queryFn: () =>
      getTopEndpoints({ data: { serviceId, period, sortBy, limit: 50 } }),
  });

  const endpoints = endpointsQuery.data?.endpoints ?? EMPTY_ENDPOINTS;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Top Endpoints</h1>
        <p className="text-sm text-muted-foreground">
          Explore response times and volumes per endpoint.
        </p>
      </div>

      <Tabs
        value={sortBy}
        onValueChange={(value) =>
          navigateWithSearch({ sortBy: value as TopEndpointSortBy })
        }
      >
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1">
          {SORT_TAB_OPTIONS.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className="flex-none"
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {endpointsQuery.isError ? (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTitle>Could not load endpoints</AlertTitle>
          <AlertDescription>
            An unexpected error occurred while loading endpoints.
          </AlertDescription>
        </Alert>
      ) : null}

      {!endpointsQuery.isLoading && endpoints.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No endpoints</EmptyTitle>
            <EmptyDescription>
              No endpoint data found for the selected period.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <EndpointsTable
          endpoints={endpoints}
          isLoading={endpointsQuery.isLoading}
        />
      )}
    </div>
  );
}
