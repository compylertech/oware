import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, Download, Search, ChevronDown, ArrowDownLeft, ArrowUpRight, MoreVertical } from "lucide-react";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/transactions")({
  component: TransactionsPage,
});

const NAVY = "#002663";
const BORDER = "#DDE4EF";
const MUTED = "#7A879F";
const INK = "#16233F";
const BG = "#F4F6FB";

type Row = {
  acct: string;
  client: string;
  type: "Credit" | "Debit";
  amount: number;
  date: string;
};

const ROWS: Row[] = [
  { acct: "000000001", client: "—", type: "Credit", amount: 100000, date: "26 May 2026" },
  { acct: "000000001", client: "—", type: "Debit", amount: 800, date: "26 May 2026" },
  { acct: "000000001", client: "—", type: "Debit", amount: 4000, date: "12 May 2026" },
  { acct: "000000001", client: "—", type: "Debit", amount: 200, date: "12 May 2026" },
  { acct: "000000001", client: "—", type: "Credit", amount: 20.63, date: "01 May 2026" },
  { acct: "000000004", client: "—", type: "Credit", amount: 39.80, date: "01 May 2026" },
];

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TransactionsPage() {
  return (
    <div style={{ background: BG, minHeight: "100%", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: 26, fontWeight: 800, color: INK, margin: 0 }}>
            Transactions
          </h1>
          <p style={{ fontSize: 13, color: MUTED, margin: "6px 0 0" }}>
            Monitor all account transactions across branches
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <OutlineBtn icon={<RefreshCw size={14} />}>Refresh</OutlineBtn>
          <OutlineBtn icon={<Download size={14} />}>Export</OutlineBtn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        <Kpi label="TOTAL TRANSACTIONS" value="49" valueColor={INK} sub="Matching filters" />
        <Kpi label="TOTAL CREDITS" value={`GHS ${fmt(1129751.67)}`} valueColor="#067647" sub="Completed credits" />
        <Kpi label="TOTAL DEBITS" value={`GHS ${fmt(1018284)}`} valueColor="#D92D20" sub="Completed debits" />
        <Kpi label="PENDING" value="0" valueColor="#B45309" sub="Awaiting processing" />
      </div>

      {/* Filter bar */}
      <Card style={{ padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            border: `1px solid ${BORDER}`, borderRadius: 10, padding: "8px 12px",
          }}
        >
          <Search size={16} color={MUTED} />
          <input
            placeholder="Search reference, client, account…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: INK, background: "transparent" }}
          />
        </div>
        <SelectPill label="Office: Head Office" />
        <SelectPill label="Type: All" />
        <SelectPill label="Status: All" />
        <SelectPill label="End of Month" />
        <span style={{ fontSize: 13, color: MUTED, marginLeft: 4 }}>49 results</span>
      </Card>

      {/* Table */}
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${NAVY}` }}>
              {["ACCOUNT NO.", "CLIENT", "TYPE", "AMOUNT", "NARRATION", "STATUS", "DATE", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "14px 18px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: MUTED,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < ROWS.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <td style={td}>
                  <span style={{ fontFamily: "DM Mono, monospace", color: NAVY, fontSize: 13 }}>
                    {r.acct}
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 24, height: 24, borderRadius: 999, background: NAVY, color: "#fff",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700,
                      }}
                    >
                      —
                    </span>
                    <span style={{ fontSize: 13, color: INK }}>{r.client}</span>
                  </div>
                </td>
                <td style={td}>
                  <TypePill type={r.type} />
                </td>
                <td style={{ ...td, fontWeight: 700, color: r.type === "Credit" ? "#067647" : "#D92D20", fontVariantNumeric: "tabular-nums" }}>
                  {r.type === "Credit" ? "+" : "-"}GHS {fmt(r.amount)}
                </td>
                <td style={{ ...td, color: MUTED }}>—</td>
                <td style={td}>
                  <StatusPill status="Completed" />
                </td>
                <td style={{ ...td, color: INK }}>{r.date}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button
                    type="button"
                    aria-label="Actions"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}
                  >
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const td: React.CSSProperties = { padding: "16px 18px", fontSize: 13, color: INK };

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Kpi({ label, value, valueColor, sub }: { label: string; value: string; valueColor: string; sub: string }) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div
        style={{
          fontSize: 11, fontWeight: 700, color: MUTED,
          textTransform: "uppercase", letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Sora, sans-serif", fontSize: 28, fontWeight: 800,
          color: valueColor, marginTop: 6, fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{sub}</div>
    </Card>
  );
}

function OutlineBtn({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "#fff", border: `1px solid ${BORDER}`,
        color: INK, fontSize: 13, fontWeight: 600,
        borderRadius: 10, padding: "8px 14px", cursor: "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function SelectPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "#fff", border: `1px solid ${BORDER}`,
        color: INK, fontSize: 13, fontWeight: 600,
        borderRadius: 10, padding: "8px 12px", cursor: "pointer",
      }}
    >
      {label}
      <ChevronDown size={14} color={MUTED} />
    </button>
  );
}

function TypePill({ type }: { type: "Credit" | "Debit" }) {
  const isCredit = type === "Credit";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: isCredit ? "#ECFDF3" : "#FEF3F2",
        color: isCredit ? "#067647" : "#D92D20",
        border: `1px solid ${isCredit ? "#ABEFC6" : "#FECDCA"}`,
        borderRadius: 999, padding: "3px 10px",
        fontSize: 12, fontWeight: 600,
      }}
    >
      {isCredit ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
      {type}
    </span>
  );
}
