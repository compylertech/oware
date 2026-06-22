import { createFileRoute, Link } from "@tanstack/react-router";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, Ava, Th, Td, Chip, MiniBar, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { ACTIVE_LOANS, fmtGHS } from "@/lib/loanMock";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/_auth/loans/active")({
  component: ActiveLoansPage,
});

function ActiveLoansPage() {
  return (
    <LoansShell>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Chip label="Total Outstanding" value="GH₵18.4M" />
        <Chip label="On-time" value="1,192" meta="loans" metaColor={LOAN.green} />
        <Chip label="In Arrears" value="92" meta="loans" metaColor={LOAN.red} />
        <Chip label="Avg. Loan Size" value="GH₵14,300" />
      </div>

      <div className="flex gap-2 mb-3">
        {["Status: All", "All Products"].map((l) => (
          <button key={l} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            height: 34, padding: "0 12px", borderRadius: 10,
            border: `1px solid ${LOAN.border}`, background: "#fff",
            fontSize: 12, color: LOAN.ink, fontWeight: 600,
          }}>
            {l} <ChevronDown size={12} />
          </button>
        ))}
      </div>

      <Panel>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Loan</Th><Th>Client</Th><Th>Product</Th><Th>Outstanding</Th>
              <Th>Next Due</Th><Th>Repaid</Th><Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_LOANS.map((l) => (
              <tr key={l.id}>
                <Td>
                  <Link to="/loans/$loanId" params={{ loanId: l.id }} style={{ ...fontMono, fontWeight: 700, color: LOAN.navy }}>
                    {l.id}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Ava name={l.client} bg={l.avatar} size={28} />
                    <span style={{ fontWeight: 600 }}>{l.client}</span>
                  </div>
                </Td>
                <Td>{l.product}</Td>
                <Td style={{ fontWeight: 700 }}>{fmtGHS(l.outstanding)}</Td>
                <Td style={l.status === "In Arrears" ? { color: LOAN.red, fontWeight: 700 } : undefined}>
                  {l.nextDue}
                </Td>
                <Td><MiniBar pct={l.repaid} color={l.status === "In Arrears" ? LOAN.red : LOAN.green} /></Td>
                <Td><StagePill stage={l.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </LoansShell>
  );
}
