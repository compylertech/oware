import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Ava, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { ACTIVE_LOANS, fmtGHS } from "@/api/loans";
import { Tabs } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/loans/$loanId")({
  component: LoanDetail,
});

function LoanDetail() {
  const { loanId } = Route.useParams();
  const loan = ACTIVE_LOANS.find((l) => l.id === loanId) ?? ACTIVE_LOANS[0];
  const [tab, setTab] = useState<"schedule" | "transactions" | "documents">("schedule");

  const schedule = Array.from({ length: 12 }).map((_, i) => {
    const status = i < 4 ? "Paid" : i === 4 ? "Due" : "Upcoming";
    return {
      no: i + 1,
      date: new Date(2025, 4 + i, 5).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      principal: 7200,
      interest: 2338,
      total: 9538,
      status,
    };
  });

  return (
    <LoansShell>
      <Link
        to="/loans/active"
        className="inline-flex items-center gap-2"
        style={{ color: LOAN.blue, fontSize: 12, fontWeight: 600, marginBottom: 14 }}
      >
        <ArrowLeft size={14} /> Back to Active Loans
      </Link>

      <Panel style={{ padding: 18, marginBottom: 14 }}>
        <div className="flex items-center gap-3">
          <Ava name={loan.client} bg={loan.avatar} size={48} />
          <div>
            <div style={{ ...fontDisplay, fontSize: 20, fontWeight: 800, color: LOAN.ink }}>
              {loan.client}
            </div>
            <div style={{ ...fontMono, fontSize: 12, color: LOAN.muted }}>
              {loan.id} · {loan.product}
            </div>
          </div>
          <div className="ml-auto">
            <StagePill stage={loan.status} />
          </div>
        </div>
      </Panel>

      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "schedule", label: "Repayment Schedule" },
          { key: "transactions", label: "Transactions" },
          { key: "documents", label: "Documents" },
        ]}
      />

      <Panel>
        <PanelHead
          title={
            tab === "schedule"
              ? "Repayment Schedule"
              : tab === "transactions"
                ? "Transactions"
                : "Documents"
          }
        />
        {tab === "schedule" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>No.</Th>
                <Th>Date</Th>
                <Th>Principal</Th>
                <Th>Interest</Th>
                <Th>Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((r) => (
                <tr key={r.no}>
                  <Td>{r.no}</Td>
                  <Td>{r.date}</Td>
                  <Td>{fmtGHS(r.principal)}</Td>
                  <Td>{fmtGHS(r.interest)}</Td>
                  <Td style={{ fontWeight: 700 }}>{fmtGHS(r.total)}</Td>
                  <Td>
                    <StatusPill
                      label={r.status}
                      tone={r.status === "Paid" ? "green" : r.status === "Due" ? "amber" : "gray"}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab !== "schedule" && (
          <div style={{ padding: 40, textAlign: "center", color: LOAN.muted, fontSize: 13 }}>
            No {tab} yet.
          </div>
        )}
      </Panel>
    </LoansShell>
  );
}
