import { Button } from "@/components/ui/button";

const DashPage = () => {
  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <h1 className="font-jetbrains font-semibold">LOGR DASHBOARD</h1>
      <p className="text-muted-foreground text-sm">
        This is the dashboard page for Logr. There will be pages for metrics,
        logs, alerts, and settings, for each project created. More coming soon!
      </p>

      <Button className={"px-0"} variant="link">
        Logout
      </Button>
    </main>
  );
};

export default DashPage;
