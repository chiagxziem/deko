import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_guest")({
  component: GuestLayout,
});

function GuestLayout() {
  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-4">
      <Outlet />
    </div>
  );
}
