import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/administration/")({
  component: () => <div className="p-6">Administration</div>,
});
