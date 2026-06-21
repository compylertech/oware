import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/clients/add")({
  component: () => <div className="p-6">Add Client</div>,
});
