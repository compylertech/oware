import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Ava, NavyBtn, fontDisplay, fontMono } from "@/components/loans/ui";
import { fmtGHS } from "@/lib/loanMock";

const RECENT = [
  { name: "Kwame Mensah", method: "MoMo", date: "25 May", amount: 3400, avatar: "#3B5BDB" },
  { name: "Kojo Baah", method: "Bank", date: "25 May", amount: 1150, avatar: "#7C3AED" },
  { name: "Ama Owusu", method: "Bank", date: "24 May", amount: 5900, avatar: "#1565C0" },
  { name: "Yaw Darko", method: "Cash", date: "24 May", amount: 2000, avatar: "#059669" },
];

export const Route = createFileRoute("/_auth/loans/repayments")({
  component: RepaymentsPage,
});

function RepaymentsPage() {
  const [method, setMethod] = useState<"MoMo" | "Bank" | "Cash">("MoMo");

  return (
    <LoansShell>
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Panel>
          <PanelHead title="Record a Repayment" />
          <div className="p-5 space-y-4">
            <div
              className="flex items-center gap-3"
              style={{
                padding: 12,
                background: "#F4F6FB",
                borderRadius: 10,
                border: `1px solid ${LOAN.border}`,
              }}
            >
              <Ava name="Adwoa Mensa" bg="#DC2626" size={36} />
              <div>
                <div style={{ ...fontMono, fontSize: 12, fontWeight: 700, color: LOAN.navy }}>
                  LN-20142
                </div>
                <div style={{ fontSize: 12, color: LOAN.ink }}>Adwoa Mensa · Group Loan</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount">
                <input defaultValue="1200" style={inputCss} />
              </Field>
              <Field label="Value date">
                <input type="date" defaultValue="2025-05-25" style={inputCss} />
              </Field>
            </div>

            <Field label="Payment method">
              <div
                style={{
                  display: "inline-flex",
                  border: `1px solid ${LOAN.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {(["MoMo", "Bank", "Cash"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    style={{
                      padding: "8px 18px",
                      background: method === m ? "#F4F6FB" : "#fff",
                      border: method === m ? `1px solid ${LOAN.navy}` : "none",
                      color: LOAN.ink,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Field>

            <div
              style={{
                background: "#F8FAFD",
                borderRadius: 10,
                padding: 14,
                border: `1px solid ${LOAN.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: LOAN.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                Allocation preview
              </div>
              {[
                ["Penalty", 80],
                ["Interest", 210],
                ["Fees", 35],
                ["Principal", 875],
              ].map(([l, v]) => (
                <div
                  key={l as string}
                  className="flex justify-between"
                  style={{ fontSize: 12, padding: "4px 0", color: LOAN.ink }}
                >
                  <span>{l}</span>
                  <span>{fmtGHS(v as number)}</span>
                </div>
              ))}
              <div
                style={{ borderTop: `1px dashed ${LOAN.border}`, marginTop: 6, paddingTop: 8 }}
                className="flex justify-between"
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: LOAN.ink }}>Total</span>
                <span style={{ ...fontDisplay, fontSize: 16, fontWeight: 800, color: LOAN.ink }}>
                  {fmtGHS(1200)}
                </span>
              </div>
            </div>

            <NavyBtn full>Post Repayment</NavyBtn>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Recent Repayments" />
          <div>
            {RECENT.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{
                  padding: "12px 16px",
                  borderTop: i === 0 ? "none" : `1px solid ${LOAN.border}`,
                }}
              >
                <Ava name={r.name} bg={r.avatar} size={32} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 600, color: LOAN.ink }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: LOAN.muted }}>
                    {r.method} · {r.date}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: LOAN.ink }}>
                  {fmtGHS(r.amount)}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </LoansShell>
  );
}

const inputCss: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid ${LOAN.border}`,
  borderRadius: 10,
  fontSize: 13,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: LOAN.muted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
