import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Ava, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { ACTIVE_LOANS, fmtGHS } from "@/lib/loanMock";

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
      date: new Date(2025, 4 + i, 5).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      principal: 7200,
      interest: 2338,
      total: 9538,
      status,
    };
  });

  return (
    <LoansShell>
      <Link to="/loans/active" className="inline-flex items-center gap-2" style={{ color: LOAN.blue, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
        <ArrowLeft size={14} /> Back to Active Loans
      </Link>

      <Panel style={{ padding: 18, marginBottom: 14 }}>
        <div className="flex items-center gap-3">
          <Ava name={loan.client} bg={loan.avatar} size={48} />
          <div>
            <div style={{ ...fontDisplay, fontSize: 20, fontWeight: 800, color: LOAN.ink }}>{loan.client}</div>
            <div style={{ ...fontMono, fontSize: 12, color: LOAN.muted }}>{loan.id} · {loan.product}</div>
          </div>
          <div className="ml-auto"><StagePill stage={loan.status} /></div>
        </div>
      </Panel>

      <div className="flex gap-1 mb-3" style={{ borderBottom: `1px solid ${LOAN.border}` }}>
        {(["schedule", "transactions", "documents"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t ? LOAN.navy : "transparent"}`,
              color: tab === t ? LOAN.navy : LOAN.muted,
              fontWeight: tab === t ? 700 : 500,
              fontSize: 13,
              textTransform: "capitalize",
            }}
          >
            {t === "schedule" ? "Repayment Schedule" : t}
          </button>
        ))}
      </div>

      <Panel>
        <PanelHead title={tab === "schedule" ? "Repayment Schedule" : tab === "transactions" ? "Transactions" : "Documents"} />
        {tab === "schedule" && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr><Th>No.</Th><Th>Date</Th><Th>Principal</Th><Th>Interest</Th><Th>Total</Th><Th>Status</Th></tr>
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
                    {r.status === "Paid" && <Pill c={LOAN.green} bg={LOAN.greenBg}>Paid</Pill>}
                    {r.status === "Due" && <Pill c={LOAN.amber} bg={LOAN.amberBg}>Due</Pill>}
                    {r.status === "Upcoming" && <Pill c={LOAN.muted} bg="#EEF1F6">Upcoming</Pill>}
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

function Pill({ c, bg, children }: { c: string; bg: string; children: React.ReactNode }) {
  return (
    <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: c, background: bg }}>
      {children}
    </span>
  );
}
