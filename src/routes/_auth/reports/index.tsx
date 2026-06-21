import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/reports/")({
  component: () => <div className="p-6">Reports</div>,
});
