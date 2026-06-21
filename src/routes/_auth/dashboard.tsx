import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
  component: () => <div className="p-6">Dashboard</div>,
});
