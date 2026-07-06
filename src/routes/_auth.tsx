import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthSession } from "@/api/auth";

export const Route = createFileRoute("/_auth")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  const navigate = useNavigate();
  const session = useAuthSession();

  // Client-side guard: this app hydrates everything post-mount (no SSR data
  // loaders), so there's nothing meaningful to check during the server render
  // — an unauthenticated visitor briefly sees the shell, then gets bounced.
  useEffect(() => {
    if (typeof window !== "undefined" && !session) {
      navigate({ to: "/signin", replace: true });
    }
  }, [session, navigate]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
