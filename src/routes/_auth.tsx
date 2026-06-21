import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_auth")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
