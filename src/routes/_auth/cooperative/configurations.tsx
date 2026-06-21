import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/cooperative/configurations")({
  component: () => <div className="p-6">Configurations</div>,
});
