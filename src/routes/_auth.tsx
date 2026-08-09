import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthSession, getSession } from "@/api/auth";
import { SessionExpiryGuard } from "@/components/auth/SessionExpiryGuard";

export const Route = createFileRoute("/_auth")({
  component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
  const navigate = useNavigate();
  const session = useAuthSession();

  // Client-side guard: this app hydrates everything post-mount (no SSR data
  // loaders), so there's nothing meaningful to check during the server render
  // - an unauthenticated visitor briefly sees the shell, then gets bounced.
  //
  // `session` (from useAuthSession) is intentionally null on the very first
  // client render - it uses React's hydration-safe server snapshot, which is
  // always null since there's no session on the server. Deciding whether to
  // redirect from that value would bounce an *already signed-in* user to
  // /signin on every hard refresh (and from there straight on to /dashboard,
  // losing whatever page they refreshed), even though a valid session is
  // sitting in localStorage the whole time. getSession() reads that
  // module-level store directly - it's correct from the very first tick - so
  // use it for the redirect decision instead.
  useEffect(() => {
    if (typeof window !== "undefined" && !getSession()) {
      navigate({ to: "/signin", replace: true });
    }
  }, [session, navigate]);

  return (
    <AppShell>
      <Outlet />
      {session && <SessionExpiryGuard />}
    </AppShell>
  );
}
