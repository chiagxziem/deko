import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import type {
  LogLevelBreakdown,
  StatusCodeBreakdown,
} from "@repo/db/validators/dashboard.validator";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

// ——————————————————————————————————————————————
// STATUS BREAKDOWN
// ——————————————————————————————————————————————

const STATUS_COLORS: Record<string, string> = {
  "2xx": "hsl(142 71% 45%)",
  "3xx": "hsl(217 91% 60%)",
  "4xx": "hsl(38 92% 50%)",
  "5xx": "hsl(0 84% 60%)",
  Other: "hsl(240 5% 64%)",
};

const STATUS_ORDER = ["2xx", "3xx", "4xx", "5xx", "Other"];

function sortByStatusOrder(
  a: { category: string },
  b: { category: string },
): number {
  return STATUS_ORDER.indexOf(a.category) - STATUS_ORDER.indexOf(b.category);
}

interface StatusBreakdownChartProps {
  data: StatusCodeBreakdown;
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const isMobile = useIsMobile();

  // Only handle category groupBy in overview
  const categoryBreakdown = useMemo(
    () =>
      data.breakdown.filter((item) => "category" in item) as {
        category: string;
        label: string;
        count: number;
        percentage: number;
      }[],
    [data.breakdown],
  );

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        categoryBreakdown.map((item) => [
          item.category,
          { label: item.label, color: STATUS_COLORS[item.category] ?? "#888" },
        ]),
      ),
    [categoryBreakdown],
  );

  const chartData = useMemo(
    () =>
      [...categoryBreakdown].toSorted(sortByStatusOrder).map((item) => ({
        name: item.category,
        value: item.count,
        fill: STATUS_COLORS[item.category] ?? "#888",
      })),
    [categoryBreakdown],
  );

  return (
    <Card>
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-sm font-medium">Status Codes</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout={isMobile ? "horizontal" : "vertical"}
            margin={
              isMobile
                ? { left: 0, right: 0, top: 20, bottom: 0 }
                : { left: 0, right: 20, top: 0, bottom: 0 }
            }
          >
            {!isMobile ? (
              <>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-foreground)" radius={4}>
                  <LabelList
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </>
            ) : (
              <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-foreground)" radius={4}>
                  <LabelList
                    position="top"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function StatusBreakdownChartSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b border-border/50 pb-3">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

// ——————————————————————————————————————————————
// LOG LEVEL BREAKDOWN
// ——————————————————————————————————————————————

const LEVEL_COLORS: Record<string, string> = {
  info: "hsl(217 91% 60%)",
  warn: "hsl(38 92% 50%)",
  error: "hsl(0 84% 60%)",
  debug: "hsl(240 5% 64%)",
};

const LOG_LEVEL_ORDER = ["debug", "info", "warn", "error"];

function sortByLogLevelOrder(
  a: { level: string },
  b: { level: string },
): number {
  return LOG_LEVEL_ORDER.indexOf(a.level) - LOG_LEVEL_ORDER.indexOf(b.level);
}

interface LogLevelBreakdownChartProps {
  data: LogLevelBreakdown;
}

export function LogLevelBreakdownChart({ data }: LogLevelBreakdownChartProps) {
  const isMobile = useIsMobile();

  const chartConfig: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        data.breakdown.map((item) => [
          item.level,
          {
            label: item.level.charAt(0).toUpperCase() + item.level.slice(1),
            color: LEVEL_COLORS[item.level] ?? "#888",
          },
        ]),
      ),
    [data.breakdown],
  );

  const chartData = useMemo(
    () =>
      [...data.breakdown].toSorted(sortByLogLevelOrder).map((item) => ({
        name: item.level,
        value: item.count,
        fill: LEVEL_COLORS[item.level] ?? "#888",
      })),
    [data.breakdown],
  );

  return (
    <Card>
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-sm font-medium">Log Levels</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout={isMobile ? "horizontal" : "vertical"}
            margin={
              isMobile
                ? { left: 0, right: 0, top: 20, bottom: 0 }
                : { left: 0, right: 20, top: 0, bottom: 0 }
            }
          >
            {!isMobile ? (
              <>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-foreground)" radius={4}>
                  <LabelList
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </>
            ) : (
              <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill="var(--color-foreground)" radius={4}>
                  <LabelList
                    position="top"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </>
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function LogLevelBreakdownChartSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b border-border/50 pb-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="pt-4">
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}
