import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, Ava, NavyBtn, OutlineBtn, fontMono } from "@/components/loans/ui";
import { fmtGHS } from "@/api/loans";
import { Tabs } from "@/components/patterns";

type Row = {
  client: string;
  loanId: string;
  product: string;
  amount: number;
  approved: boolean;
  approver: string;
  avatar: string;
};

const ROWS: Row[] = [
  {
    client: "Fiifi Brown",
    loanId: "LN-20439",
    product: "Group Loan",
    amount: 18000,
    approved: true,
    approver: "V.Yeboah",
    avatar: "#B45309",
  },
  {
    client: "Abena Boateng",
    loanId: "LN-20448",
    product: "Salary Advance",
    amount: 12500,
    approved: false,
    approver: "Awaiting checker",
    avatar: "#059669",
  },
  {
    client: "Nana Addai",
    loanId: "LN-20450",
    product: "Asset Finance",
    amount: 64000,
    approved: false,
    approver: "Awaiting checker",
    avatar: "#7C3AED",
  },
];

export const Route = createFileRoute("/_auth/loans/disbursements")({
  component: DisbursementsPage,
});

function DisbursementsPage() {
  const [tab, setTab] = useState<"pending" | "scheduled" | "disbursed">("pending");
  return (
    <LoansShell>
      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "pending", label: "Pending", badge: 5 },
          { key: "scheduled", label: "Scheduled", badge: 8 },
          { key: "disbursed", label: "Disbursed" },
        ]}
      />

      <Panel>
        {ROWS.map((r, i) => (
          <div
            key={r.loanId}
            className="flex items-center gap-3"
            style={{
              padding: "16px 18px",
              borderTop: i === 0 ? "none" : `1px solid ${LOAN.border}`,
            }}
          >
            <Ava name={r.client} bg={r.avatar} size={36} />
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 700, color: LOAN.ink }}>
                {r.client} · <span style={{ color: LOAN.ink }}>{fmtGHS(r.amount)}</span>
              </div>
              <div style={{ fontSize: 12, color: LOAN.muted, marginTop: 2 }}>
                {r.product} · <span style={fontMono}>{r.loanId}</span> · pending disbursement
              </div>
              <div
                className="flex items-center gap-1 mt-2"
                style={{
                  fontSize: 11,
                  color: r.approved ? LOAN.green : LOAN.amber,
                  fontWeight: 600,
                }}
              >
                {r.approved ? <CheckCircle size={12} /> : <Clock size={12} />}
                {r.approved ? `Approved by ${r.approver}` : r.approver}
              </div>
            </div>
            <div className="flex gap-2">
              <OutlineBtn>View</OutlineBtn>
              {r.approved ? (
                <button
                  style={{
                    background: LOAN.green,
                    color: "#fff",
                    border: "none",
                    height: 36,
                    padding: "0 16px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Disburse
                </button>
              ) : (
                <NavyBtn>Approve</NavyBtn>
              )}
            </div>
          </div>
        ))}
      </Panel>
    </LoansShell>
  );
}
