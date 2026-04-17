import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/services/$serviceId/errors")({
  component: ErrorsPage,
});

function ErrorsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold">Errors</h1>
        <p className="text-sm text-muted-foreground">
          Recurring error patterns grouped by fingerprint.
        </p>
      </div>

      <div className="h-96 rounded-lg border border-border/50 bg-card" />
    </div>
  );
}
