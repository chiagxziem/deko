import {
  AlertCircleIcon,
  ArrowRight01Icon,
  Note01Icon,
  Plug01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { servicesQueryOptions } from "@/server/services";
import { useDialogStore } from "@/stores/dialog-store";

export const Route = createFileRoute("/_onboarding/get-started")({
  beforeLoad: async ({ context }) => {
    const services = await context.queryClient.fetchQuery(
      servicesQueryOptions(),
    );

    if (services && services.length > 0) {
      throw redirect({ to: "/" });
    }
  },
  component: GetStartedPage,
});

const features = [
  {
    icon: Note01Icon,
    title: "Logs",
    description: "Search and inspect every API request in real time.",
  },
  {
    icon: AlertCircleIcon,
    title: "Errors",
    description: "Surface recurring failures grouped by fingerprint.",
  },
  {
    icon: Plug01Icon,
    title: "Endpoints",
    description: "Track response times and traffic per route.",
  },
];

function GetStartedPage() {
  const openDialog = useDialogStore((s) => s.openDialog);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <div className="mb-8 flex size-14 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <span className="text-xl font-bold">D</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Set up your first service
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Deko needs at least one service to start collecting logs, errors, and
          endpoint metrics from your API.
        </p>

        <div className="mt-10 grid w-full gap-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-card px-4 py-3 text-left"
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/50">
                <HugeiconsIcon
                  icon={feature.icon}
                  size={16}
                  className="text-muted-foreground"
                />
              </div>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button onClick={() => openDialog({ type: "create-service" })}>
            Create service
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
