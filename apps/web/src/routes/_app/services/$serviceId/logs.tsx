import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { LogDetailPanel } from "@/components/logs/log-detail-panel";
import {
  type LogEntry,
  logsColumns,
  logsFilters,
} from "@/components/logs/logs-columns";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { $getServiceLogs, $getSlowLogs } from "@/server/dashboard";
import { usePeriodStore } from "@/stores/period-store";

const logsSearchSchema = z.object({
  view: z.enum(["all", "slow"]).catch("all"),
  search: z.string().optional().catch(undefined),
  level: z.enum(["info", "warn", "error", "debug"]).optional().catch(undefined),
  status: z.coerce.number().optional().catch(undefined),
  method: z
    .enum([
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
      "HEAD",
      "CONNECT",
      "TRACE",
    ])
    .optional()
    .catch(undefined),
  cursor: z.string().optional().catch(undefined),
  logId: z.string().optional().catch(undefined),
  timestamp: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/_app/services/$serviceId/logs")({
  validateSearch: logsSearchSchema,
  component: LogsPage,
});

function LogsPage() {
  const searchParams = useSearch({ from: "/_app/services/$serviceId/logs" });
  const { serviceId } = useParams({ from: "/_app/services/$serviceId/logs" });
  const navigate = useNavigate();

  const period = usePeriodStore((s) => s.period);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState(searchParams.search ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isSlowView = searchParams.view === "slow";

  useEffect(() => {
    setSearchValue(searchParams.search ?? "");
  }, [searchParams.search]);

  useEffect(() => {
    return () => {
      clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const logsQuery = useQuery({
    queryKey: queryKeys.logs(serviceId, {
      period,
      view: searchParams.view,
      search: searchParams.search,
      level: searchParams.level,
      method: searchParams.method,
      status: searchParams.status,
      cursor: searchParams.cursor,
    }),
    queryFn: async () => {
      const params = {
        serviceId,
        period,
        search: searchParams.search,
        level: searchParams.level,
        method: searchParams.method,
        status: searchParams.status,
        cursor: searchParams.cursor,
        limit: 100,
      };
      if (isSlowView) {
        const result = await $getSlowLogs({
          data: { ...params, minDuration: 1000 },
        });
        return result
          ? { logs: result.logs, pagination: result.pagination }
          : null;
      }
      return $getServiceLogs({ data: params });
    },
    placeholderData: keepPreviousData,
  });

  const logs = useMemo(
    () => logsQuery.data?.logs ?? [],
    [logsQuery.data?.logs],
  );
  const pagination = logsQuery.data?.pagination;

  const navigateWithSearch = (
    newSearch: Partial<z.infer<typeof logsSearchSchema>>,
    replace = false,
  ) => {
    navigate({
      to: "/services/$serviceId/logs",
      params: { serviceId },
      search: { ...searchParams, ...newSearch },
      replace,
    });
  };

  const handleViewChange = (view: string) => {
    setCursorHistory([]);
    navigateWithSearch({ view: view as "all" | "slow", cursor: undefined });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      setCursorHistory([]);
      navigateWithSearch(
        {
          search: value ? value : undefined,
          cursor: undefined,
        },
        true,
      );
    }, 300);
  };

  const handleFilterChange = (columnId: string, values: string[]) => {
    const selected = values[0];
    setCursorHistory([]);

    if (columnId === "level") {
      navigateWithSearch(
        {
          level: selected as z.infer<typeof logsSearchSchema>["level"],
          cursor: undefined,
        },
        true,
      );
      return;
    }

    if (columnId === "request") {
      navigateWithSearch(
        {
          method: selected as z.infer<typeof logsSearchSchema>["method"],
          cursor: undefined,
        },
        true,
      );
      return;
    }

    if (columnId === "status") {
      const statusValue = selected ? Number(selected) : undefined;
      navigateWithSearch(
        {
          status:
            statusValue !== undefined && !Number.isNaN(statusValue)
              ? statusValue
              : undefined,
          cursor: undefined,
        },
        true,
      );
    }
  };

  const handleClearAllFilters = () => {
    setCursorHistory([]);
    navigateWithSearch(
      {
        level: undefined,
        method: undefined,
        status: undefined,
        cursor: undefined,
      },
      true,
    );
  };

  const activeFilterValues = useMemo(
    () => ({
      level: searchParams.level ? [searchParams.level] : [],
      request: searchParams.method ? [searchParams.method] : [],
      status:
        searchParams.status !== undefined ? [String(searchParams.status)] : [],
    }),
    [searchParams.level, searchParams.method, searchParams.status],
  );

  const handleOlder = () => {
    if (pagination?.nextCursor) {
      setCursorHistory((prev) => [...prev, searchParams.cursor ?? ""]);
      navigateWithSearch({ cursor: pagination.nextCursor });
    }
  };

  const handleNewer = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      navigateWithSearch({ cursor: prevCursor || undefined });
    }
  };

  const handleSelectLog = (log: LogEntry) => {
    const ts =
      typeof log.timestamp === "string"
        ? log.timestamp
        : log.timestamp.toISOString();
    navigateWithSearch({ logId: log.id, timestamp: ts });
  };

  const handleCloseDetail = () => {
    navigateWithSearch({ logId: undefined, timestamp: undefined });
  };

  const showPagination = pagination?.hasNext || cursorHistory.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Inspect and search API request logs.
        </p>
      </div>

      <Tabs value={searchParams.view} onValueChange={handleViewChange}>
        <TabsList>
          <TabsTrigger value="all">All Logs</TabsTrigger>
          <TabsTrigger value="slow">Slow Requests</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={logsColumns}
        data={logs}
        filters={logsFilters}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        activeFilterValues={activeFilterValues}
        onFilterChange={handleFilterChange}
        onClearAllFilters={handleClearAllFilters}
        enableFuzzyGlobalFilter
        defaultPagination={{ pageIndex: 0, pageSize: 200 }}
        emptyMessage={
          logsQuery.isLoading
            ? "Loading logs..."
            : "No logs found. Try adjusting your filters or time range."
        }
        onRowClick={handleSelectLog}
      />

      {showPagination && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewer}
            disabled={cursorHistory.length === 0}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
            Newer
          </Button>
          <div className="text-xs text-muted-foreground">
            {logs.length > 0 && `Showing ${logs.length} logs`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOlder}
            disabled={!pagination?.hasNext}
          >
            Older
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Button>
        </div>
      )}

      {searchParams.logId && searchParams.timestamp && (
        <LogDetailPanel
          serviceId={serviceId}
          logId={searchParams.logId}
          timestamp={searchParams.timestamp}
          open={!!searchParams.logId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}
