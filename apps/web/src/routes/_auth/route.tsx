import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { userQueryOptions } from "@/server/user";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.fetchQuery(userQueryOptions);

    if (user) {
      throw redirect({ to: "/dash" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-4">
      <Outlet />
    </div>
  );
}
