import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/loans/")({
  component: () => <div className="p-6">Loans</div>,
});
