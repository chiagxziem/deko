import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";

import type { LogEntry } from "@/components/logs/logs-columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyToClipboard } from "@/hooks/use-copy";
import { useIsMobile } from "@/hooks/use-mobile";
import { queryKeys } from "@/lib/query-keys";
import { cn, truncateMiddle } from "@/lib/utils";
import { $getSingleLog } from "@/server/dashboard";

interface LogDetailPanelProps {
  serviceId: string;
  logId: string;
  timestamp: string;
  initialLog?: LogEntry;
  open: boolean;
  onClose: () => void;
}

const LEVEL_STYLES: Record<string, string> = {
  error: "bg-red-500/15 text-red-600 border-red-500/20 dark:text-red-400",
  warn: "bg-amber-500/15 text-amber-600 border-amber-500/20 dark:text-amber-400",
  info: "bg-blue-500/15 text-blue-600 border-blue-500/20 dark:text-blue-400",
  debug: "bg-zinc-500/15 text-zinc-600 border-zinc-500/20 dark:text-zinc-400",
};

const METHOD_STYLES: Record<string, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-blue-600 dark:text-blue-400",
  PUT: "text-amber-600 dark:text-amber-400",
  PATCH: "text-orange-600 dark:text-orange-400",
  DELETE: "text-red-600 dark:text-red-400",
};

function statusColor(status: number): string {
  if (status >= 500) return "text-red-600 dark:text-red-400";
  if (status >= 400) return "text-amber-600 dark:text-amber-400";
  if (status >= 300) return "text-blue-600 dark:text-blue-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function LogDetailPanel({
  serviceId,
  logId,
  timestamp,
  initialLog,
  open,
  onClose,
}: LogDetailPanelProps) {
  const getSingleLog = useServerFn($getSingleLog);

  const isMobile = useIsMobile();

  const logQuery = useQuery({
    queryKey: queryKeys.singleLog(serviceId, logId),
    queryFn: () => getSingleLog({ data: { serviceId, logId, timestamp } }),
    enabled: open && !!logId && !initialLog,
  });

  const log = initialLog ?? logQuery.data;
  const logMetaObject =
    log?.meta && typeof log.meta === "object" && !Array.isArray(log.meta)
      ? (log.meta as Record<string, unknown>)
      : null;

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && onClose()}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader className="gap-1 border-b border-border/50 p-4">
          <DrawerTitle className="text-sm">Log Details</DrawerTitle>
          {log && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  METHOD_STYLES[log.method] ?? "text-zinc-400",
                )}
              >
                {log.method}
              </span>
              <span className="truncate font-mono text-xs text-foreground/80">
                {log.path}
              </span>
              <span
                className={cn(
                  "ml-auto font-mono text-xs font-semibold",
                  statusColor(log.status),
                )}
              >
                {log.status}
              </span>
            </div>
          )}
        </DrawerHeader>

        {!initialLog && logQuery.isPending ? (
          <DetailSkeleton />
        ) : !initialLog && logQuery.isError ? (
          <DetailError onRetry={() => logQuery.refetch()} />
        ) : !log ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Log not found.
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0 px-4 py-2">
              <DetailRow label="Timestamp">
                {format(
                  new Date(log.timestamp),
                  "MMM dd, yyyy 'at' HH:mm:ss.SSS",
                )}
              </DetailRow>
              <DetailRow label="Duration">
                <span
                  className={cn(
                    "font-mono",
                    log.duration >= 1000
                      ? "text-red-600 dark:text-red-400"
                      : log.duration >= 500
                        ? "text-amber-600 dark:text-amber-400"
                        : "",
                  )}
                >
                  {formatDuration(log.duration)}
                </span>
              </DetailRow>
              <DetailRow label="Level">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold uppercase",
                    LEVEL_STYLES[log.level],
                  )}
                >
                  {log.level}
                </Badge>
              </DetailRow>
              <DetailRow label="Environment">{log.environment}</DetailRow>
              <DetailRow label="Request ID" copyable={log.requestId}>
                <span className="font-mono text-[11px]">
                  {truncateMiddle(log.requestId)}
                </span>
              </DetailRow>
              {log.sessionId && (
                <DetailRow label="Session ID" copyable={log.sessionId}>
                  <span className="font-mono text-[11px]">
                    {truncateMiddle(log.sessionId)}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Received At">
                {format(
                  new Date(log.receivedAt),
                  "MMM dd, yyyy 'at' HH:mm:ss.SSS",
                )}
              </DetailRow>
              {log.userAgent && (
                <DetailRow label="User Agent">
                  <span className="max-w-50 truncate text-[11px]">
                    {log.userAgent}
                  </span>
                </DetailRow>
              )}
              {log.ipHash && (
                <DetailRow label="IP Hash" copyable={log.ipHash}>
                  <span className="font-mono text-[11px]">
                    {truncateMiddle(log.ipHash)}
                  </span>
                </DetailRow>
              )}

              {log.message && (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Message
                    </span>
                    <p className="rounded-md bg-muted/50 p-2.5 font-mono text-xs leading-relaxed text-foreground">
                      {log.message}
                    </p>
                  </div>
                </>
              )}

              {logMetaObject && Object.keys(logMetaObject).length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Metadata
                    </span>
                    <pre className="overflow-x-auto rounded-md bg-muted/50 p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
                      {JSON.stringify(logMetaObject, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </DrawerContent>
    </Drawer>
  );
}

function DetailRow({
  label,
  children,
  copyable,
}: {
  label: string;
  children: React.ReactNode;
  copyable?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 text-right">
        <span className="text-xs text-foreground">{children}</span>
        {copyable && <CopyButton value={copyable} />}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="size-5 shrink-0"
      disabled={copied}
      onClick={() => void copy(value)}
    >
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={10} />
    </Button>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-6">
      {Array.from({ length: 8 }, (_, i) => (
        // oxlint-disable-next-line react/no-array-index-key
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

function DetailError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Alert variant="destructive">
        <AlertTitle>Failed to load log details</AlertTitle>
        <AlertDescription>
          We couldn&apos;t fetch this log entry right now. Please try again.
        </AlertDescription>
      </Alert>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-fit"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}
