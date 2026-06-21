import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/loans/$loanId")({
  component: LoanDetail,
});

function LoanDetail() {
  const { loanId } = Route.useParams();
  return <div className="p-6">Loan {loanId}</div>;
}
