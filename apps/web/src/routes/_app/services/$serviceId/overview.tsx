import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/$serviceId/overview")({
  component: OverviewPage,
});

function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Service health and performance at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            // oxlint-disable-next-line react/no-array-index-key
            key={i}
            className="h-28 rounded-lg border border-border/50 bg-card"
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-lg border border-border/50 bg-card" />
        <div className="h-72 rounded-lg border border-border/50 bg-card" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-lg border border-border/50 bg-card" />
        <div className="h-72 rounded-lg border border-border/50 bg-card" />
      </div>
    </div>
  );
}
