import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/cooperative/governance")({
  component: () => <div className="p-6">Governance</div>,
});
