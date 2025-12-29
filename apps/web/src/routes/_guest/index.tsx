import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_guest/")({ component: GuestPage });

function GuestPage() {
  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <h1 className="font-jetbrains font-semibold text-primary">LOGR</h1>
      <p className="text-muted-foreground text-sm">
        Logr is an API logging and observability tool for developers. Capture
        structured API request metadata, performance metrics, and contextual
        logs in near real time.
      </p>

      <Button
        className={"px-0"}
        nativeButton={false}
        render={<Link to={"/sign-in"} />}
        variant="link"
      >
        Sign in to continue
      </Button>
    </main>
  );
}
