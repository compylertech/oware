import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/cooperative/membership")({
  component: () => <div className="p-6">Membership</div>,
});
