import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/cooperative/")({
  component: () => <div className="p-6">Cooperative</div>,
});
