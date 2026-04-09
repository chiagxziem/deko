import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest/")({ component: GuestPage });

function GuestPage() {
  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <h1 className="font-jetbrains font-semibold text-primary-foreground">
        DEKO
      </h1>
      <p className="text-sm text-muted-foreground">
        Deko is an API logging and observability tool for developers. Capture
        structured API request metadata, performance metrics, and contextual
        logs in near real time.
      </p>
    </main>
  );
}
