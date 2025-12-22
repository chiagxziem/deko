import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/dash")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(userQueryOptions);

    if (!user) {
      throw redirect({ to: "/sign-in" });
    }

    return { user };
  },
  loader: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(userQueryOptions);

    if (!user) {
      throw redirect({ to: "/sign-in" });
    }

    return { user };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-4">
      <Outlet />
    </div>
  );
}
