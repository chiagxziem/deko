import {
  createFileRoute,
  getRouteApi,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelToastEl } from "@/components/ui/toaster";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dash/")({
  component: DashboardPage,
});

function DashboardPage() {
  const dashRoute = getRouteApi("/dash");
  const { user } = dashRoute.useLoaderData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully", cancelToastEl);
            navigate({ to: "/sign-in" });
          },
          onError: (ctx) => {
            toast.error(ctx.error.message, cancelToastEl);
          },
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
    }
  };

  return (
    <main className="flex flex-col items-start gap-4 py-32">
      <div>
        <h1 className="font-jetbrains font-semibold">
          <Link
            className="text-primary underline-offset-4 transition-all duration-200 hover:underline"
            to={"/"}
          >
            LOGR
          </Link>{" "}
          DASHBOARD
        </h1>
        <p className="text-muted-foreground text-xs">{user.name}</p>
      </div>

      <p className="text-muted-foreground text-sm">
        This is the dashboard page for Logr. There will be pages for metrics,
        logs, alerts, and settings, for each project created. More coming soon!
      </p>

      <Button className="px-0" onClick={handleSignOut} variant="link">
        Sign out
      </Button>
    </main>
  );
}
