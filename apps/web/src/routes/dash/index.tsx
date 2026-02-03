import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dash/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <div>
        <h1 className="font-jetbrains font-semibold">
          <Link
            className="text-primary underline-offset-4 transition-all duration-200 hover:underline"
            to={"/"}
          >
            DEKO
          </Link>{" "}
          DASHBOARD
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        This is the dashboard page for Deko. There will be pages for metrics, logs, alerts, and
        settings, for each project created. More coming soon!
      </p>

      <Button className="px-0" nativeButton={false} render={<Link to={"/"} />} variant="link">
        Go to Home
      </Button>
    </main>
  );
}
