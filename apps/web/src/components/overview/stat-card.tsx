import { TradeDownIcon, TradeUpIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  /** Percentage delta vs previous period. Positive = increase, negative = decrease. */
  change?: number | null;
  /** When true, an increase is good (e.g. requests). When false, increase is bad (e.g. error rate). */
  positiveIsGood?: boolean;
  suffix?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  positiveIsGood = true,
  suffix,
  className,
}: StatCardProps) {
  const hasChange = change !== null && change !== undefined;
  const isPositive = hasChange && change > 0;
  const isNegative = hasChange && change < 0;

  // A positive change is "good" depending on the metric semantics
  const changeIsGood = isPositive ? positiveIsGood : !positiveIsGood;
  const changeColor =
    isPositive || isNegative
      ? changeIsGood
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardHeader className="pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-2">
          <span className="text-2xl leading-none font-semibold tabular-nums">
            {value}
            {suffix && (
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                {suffix}
              </span>
            )}
          </span>
          {hasChange && change !== 0 && (
            <span
              className={cn(
                "mb-0.5 flex items-center gap-1 text-xs font-medium",
                changeColor,
              )}
            >
              <HugeiconsIcon
                icon={isPositive ? TradeUpIcon : TradeDownIcon}
                size={16}
              />
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          vs previous period
        </p>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="pb-0">
        <Skeleton className="h-3.5 w-24" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="mt-1.5 h-3 w-28" />
      </CardContent>
    </Card>
  );
}
