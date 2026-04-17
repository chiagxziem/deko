import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/$serviceId/logs")({
  component: LogsPage,
});

function LogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Inspect and search API request logs.
        </p>
      </div>

      <div className="h-96 rounded-lg border border-border/50 bg-card" />
    </div>
  );
}
