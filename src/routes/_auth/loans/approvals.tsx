import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, NavyBtn, OutlineBtn, TypePill, fontMono } from "@/components/loans/ui";
import { fmtGHS } from "@/lib/loanMock";

export const Route = createFileRoute("/_auth/loans/approvals")({
  component: ApprovalsPage,
});

type Row = {
  type: "Loan Approval" | "Disbursement" | "Reschedule" | "Write-off" | "Product Change";
  client: string;
  amount: string;
  detail: string;
  maker: string;
  when: string;
};

const ROWS: Row[] = [
  { type: "Loan Approval", client: "Kwame Mensah",  amount: fmtGHS(85000),  detail: "SME LN-20451",      maker: "A.Owusu",   when: "1h" },
  { type: "Disbursement",  client: "Abena Boateng", amount: fmtGHS(12500),  detail: "LN-20448",          maker: "K.Asante",  when: "3h" },
  { type: "Reschedule",    client: "Yaw Darko",     amount: "extend 6mo",   detail: "LN-20288",          maker: "V.Yeboah",  when: "5h" },
  { type: "Write-off",     client: "Paa Anann",     amount: fmtGHS(21500),  detail: "LN-19877 · 96d",    maker: "K.Asante",  when: "1d" },
  { type: "Product Change",client: "Salary Advance",amount: "rate 5%→5.5%", detail: "affects 538 loans", maker: "A.Owusu",   when: "1d" },
];

const TYPE_STYLE: Record<Row["type"], { c: string; bg: string }> = {
  "Loan Approval":  { c: LOAN.blue,   bg: LOAN.blueBg },
  Disbursement:     { c: LOAN.green,  bg: LOAN.greenBg },
  Reschedule:       { c: LOAN.amber,  bg: LOAN.amberBg },
  "Write-off":      { c: LOAN.red,    bg: LOAN.redBg },
  "Product Change": { c: LOAN.purple, bg: LOAN.purpleBg },
};

function ApprovalsPage() {
  const [tab, setTab] = useState<"my" | "all" | "history">("my");

  return (
    <LoansShell>
      <div style={{ display: "inline-flex", border: `1px solid ${LOAN.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
        {[
          { k: "my", l: "My queue (9)" },
          { k: "all", l: "All pending" },
          { k: "history", l: "History" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            style={{
              padding: "8px 16px",
              background: tab === t.k ? LOAN.navy : "#fff",
              color: tab === t.k ? "#fff" : LOAN.ink,
              border: "none", fontSize: 12, fontWeight: 600,
            }}
          >{t.l}</button>
        ))}
      </div>

      <Panel>
        {ROWS.map((r, i) => {
          const s = TYPE_STYLE[r.type];
          return (
            <div key={i} className="flex items-center gap-3" style={{ padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${LOAN.border}` }}>
              <TypePill label={r.type} color={s.c} bg={s.bg} />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 700, color: LOAN.ink }}>
                  {r.client} · <span style={{ color: LOAN.ink }}>{r.amount}</span>
                </div>
                <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2 }}>
                  <span style={fontMono}>{r.detail}</span> · maker: {r.maker} · {r.when} ago
                </div>
              </div>
              <div className="flex gap-2">
                <OutlineBtn>Reject</OutlineBtn>
                <NavyBtn>Approve</NavyBtn>
              </div>
            </div>
          );
        })}
      </Panel>
    </LoansShell>
  );
}
