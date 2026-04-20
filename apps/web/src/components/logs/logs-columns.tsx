import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import type { FilterConfig } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

export interface LogEntry {
  id: string;
  serviceId: string;
  timestamp: string | Date;
  level: "debug" | "info" | "warn" | "error";
  method: string;
  path: string;
  status: number;
  duration: number;
  environment: string;
  requestId: string;
  message: string | null;
  sessionId: string | null;
}

const LEVEL_STYLES: Record<string, string> = {
  error: "bg-red-500/15 text-red-400 border-red-500/20",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  debug: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
};

const METHOD_STYLES: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-amber-400",
  PATCH: "text-orange-400",
  DELETE: "text-red-400",
  OPTIONS: "text-zinc-400",
  HEAD: "text-zinc-400",
  CONNECT: "text-zinc-400",
  TRACE: "text-zinc-400",
};

function statusColor(status: number): string {
  if (status >= 500) return "text-red-400";
  if (status >= 400) return "text-amber-400";
  if (status >= 300) return "text-blue-400";
  return "text-emerald-400";
}

function durationColor(ms: number): string {
  if (ms >= 1000) return "text-red-400";
  if (ms >= 500) return "text-amber-400";
  return "text-muted-foreground";
}

function formatTimestamp(ts: string | Date): string {
  const date = typeof ts === "string" ? new Date(ts) : ts;
  return format(date, "MMM dd, HH:mm:ss");
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export const logsColumns: ColumnDef<LogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    enableSorting: false,
    meta: { headerClassName: "w-35" },
    cell: ({ row }) => (
      <span className="font-mono text-[11px] text-muted-foreground">
        {formatTimestamp(row.original.timestamp)}
      </span>
    ),
  },
  {
    accessorKey: "level",
    header: "Level",
    enableSorting: false,
    meta: { headerClassName: "w-17.5" },
    filterFn: (row, _id, filterValue: string[]) =>
      filterValue.includes(row.getValue(_id) as string),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] uppercase",
          LEVEL_STYLES[row.original.level],
        )}
      >
        {row.original.level}
      </Badge>
    ),
  },
  {
    id: "request",
    accessorFn: (row) => `${row.method} ${row.path}`,
    header: "Request",
    enableSorting: false,
    filterFn: (row, _id, filterValue: string[]) =>
      filterValue.includes(row.original.method),
    cell: ({ row }) => (
      <span className="flex items-center gap-1.5 font-mono text-xs">
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold",
            METHOD_STYLES[row.original.method],
          )}
        >
          {row.original.method}
        </span>
        <span className="truncate text-foreground/80">{row.original.path}</span>
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    meta: { headerClassName: "w-15" },
    filterFn: (row, _id, filterValue: string[]) =>
      filterValue.includes(String(row.getValue(_id))),
    cell: ({ row }) => (
      <span
        className={cn("font-mono text-xs", statusColor(row.original.status))}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "duration",
    header: "Duration",
    enableSorting: false,
    meta: { headerClassName: "w-20" },
    cell: ({ row }) => (
      <span
        className={cn(
          "font-mono text-xs",
          durationColor(row.original.duration),
        )}
      >
        {formatDuration(row.original.duration)}
      </span>
    ),
  },
  {
    accessorKey: "message",
    header: "Message",
    enableSorting: false,
    meta: {
      headerClassName: "hidden lg:table-cell w-50",
      cellClassName: "hidden lg:table-cell max-w-50 truncate",
    },
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.message ?? "—"}
      </span>
    ),
  },
];

export const logsFilters: FilterConfig[] = [
  {
    type: "search",
    placeholder: "Search path or message...",
    searchColumns: ["path", "message"],
  },
  {
    type: "single-dropdown",
    columnId: "level",
    label: "Level",
    options: [
      { value: "debug", label: "Debug" },
      { value: "info", label: "Info" },
      { value: "warn", label: "Warn" },
      { value: "error", label: "Error" },
    ],
  },
  {
    type: "single-dropdown",
    columnId: "request",
    label: "Method",
    options: [
      { value: "GET", label: "GET" },
      { value: "POST", label: "POST" },
      { value: "PUT", label: "PUT" },
      { value: "PATCH", label: "PATCH" },
      { value: "DELETE", label: "DELETE" },
      { value: "OPTIONS", label: "OPTIONS" },
      { value: "HEAD", label: "HEAD" },
    ],
  },
  {
    type: "single-dropdown",
    columnId: "status",
    label: "Status",
    options: [
      { value: "200", label: "200 OK" },
      { value: "201", label: "201 Created" },
      { value: "301", label: "301 Redirect" },
      { value: "400", label: "400 Bad Request" },
      { value: "401", label: "401 Unauthorized" },
      { value: "403", label: "403 Forbidden" },
      { value: "404", label: "404 Not Found" },
      { value: "429", label: "429 Rate Limited" },
      { value: "500", label: "500 Server Error" },
      { value: "502", label: "502 Bad Gateway" },
      { value: "503", label: "503 Unavailable" },
    ],
  },
];
