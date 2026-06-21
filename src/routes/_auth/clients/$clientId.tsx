import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/clients/$clientId")({
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = Route.useParams();
  return <div className="p-6">Client {clientId}</div>;
}
