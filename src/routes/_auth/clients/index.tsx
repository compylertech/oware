import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/clients/")({
  component: () => <div className="p-6">Clients</div>,
});
