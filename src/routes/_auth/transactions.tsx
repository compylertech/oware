import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Download, Search, ChevronDown, MoreVertical } from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";

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
  narration: string;
  status: Extract<StatusKind, "Completed" | "Pending">;
  date: string;
};

const ROWS: Row[] = [
  {
    acct: "ACC-00001",
    client: "Kwame Asante",
    type: "Credit",
    amount: 100000,
    narration: "Salary deposit",
    status: "Completed",
    date: "22 Jun 2026",
  },
  {
    acct: "ACC-00001",
    client: "Kwame Asante",
    type: "Debit",
    amount: 800,
    narration: "Utility payment",
    status: "Completed",
    date: "22 Jun 2026",
  },
  {
    acct: "ACC-00002",
    client: "Abena Mensah",
    type: "Debit",
    amount: 4000,
    narration: "Loan repayment",
    status: "Completed",
    date: "20 Jun 2026",
  },
  {
    acct: "ACC-00003",
    client: "Kofi Boateng",
    type: "Credit",
    amount: 12500,
    narration: "Business income",
    status: "Completed",
    date: "18 Jun 2026",
  },
  {
    acct: "ACC-00002",
    client: "Abena Mensah",
    type: "Debit",
    amount: 200,
    narration: "Mobile transfer",
    status: "Completed",
    date: "15 Jun 2026",
  },
  {
    acct: "ACC-00004",
    client: "Ama Darko",
    type: "Credit",
    amount: 39.8,
    narration: "Interest earned",
    status: "Completed",
    date: "12 Jun 2026",
  },
  {
    acct: "ACC-00005",
    client: "Yaw Owusu",
    type: "Credit",
    amount: 5000,
    narration: "Cash deposit",
    status: "Completed",
    date: "10 Jun 2026",
  },
  {
    acct: "ACC-00003",
    client: "Kofi Boateng",
    type: "Debit",
    amount: 1200,
    narration: "Insurance premium",
    status: "Completed",
    date: "08 Jun 2026",
  },
  {
    acct: "ACC-00006",
    client: "Efua Tetteh",
    type: "Credit",
    amount: 750,
    narration: "Refund",
    status: "Pending",
    date: "05 Jun 2026",
  },
  {
    acct: "ACC-00001",
    client: "Kwame Asante",
    type: "Debit",
    amount: 3500,
    narration: "Withdrawal",
    status: "Completed",
    date: "01 Jun 2026",
  },
];

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function showToast(msg: string) {
  if (typeof window === "undefined") return;
  const el = document.createElement("div");
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: "#16233F",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "DM Sans, sans-serif",
    zIndex: "9999",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

function TransactionsPage() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100%", padding: "24px 28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: INK,
              margin: 0,
            }}
          >
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Kpi label="TOTAL TRANSACTIONS" value="10" valueColor={INK} sub="Matching filters" />
        <Kpi
          label="TOTAL CREDITS"
          value={`GHS ${fmt(118289.8)}`}
          valueColor="#067647"
          sub="Completed credits"
        />
        <Kpi
          label="TOTAL DEBITS"
          value={`GHS ${fmt(9700)}`}
          valueColor="#D92D20"
          sub="Completed debits"
        />
        <Kpi label="PENDING" value="1" valueColor="#B45309" sub="Awaiting processing" />
      </div>

      <Card
        style={{ padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <Search size={16} color={MUTED} />
          <input
            placeholder="Search reference, client, account…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: INK,
              background: "transparent",
            }}
          />
        </div>
        <SelectPill label="Office: Head Office" />
        <SelectPill label="Type: All" />
        <SelectPill label="Status: All" />
        <SelectPill label="End of Month" />
        <span style={{ fontSize: 13, color: MUTED, marginLeft: 4 }}>10 results</span>
      </Card>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${NAVY}` }}>
              {["ACCOUNT NO.", "CLIENT", "TYPE", "AMOUNT", "NARRATION", "STATUS", "DATE", ""].map(
                (h) => (
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
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr
                key={i}
                style={{ borderBottom: i < ROWS.length - 1 ? `1px solid ${BORDER}` : "none" }}
              >
                <td style={td}>
                  <span style={{ fontFamily: "DM Mono, monospace", color: NAVY, fontSize: 13 }}>
                    {r.acct}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ fontSize: 13, color: INK }}>{r.client}</span>
                </td>
                <td style={td}>
                  <StatusPill status={r.type} />
                </td>
                <td
                  style={{
                    ...td,
                    fontWeight: 700,
                    color: r.type === "Credit" ? "#067647" : "#D92D20",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.type === "Credit" ? "+" : "-"}GHS {fmt(r.amount)}
                </td>
                <td style={{ ...td, color: INK }}>{r.narration}</td>
                <td style={td}>
                  <StatusPill status={r.status} />
                </td>
                <td style={{ ...td, color: INK }}>{r.date}</td>
                <td style={{ ...td, textAlign: "right", position: "relative" }}>
                  <button
                    type="button"
                    aria-label="Actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === i ? null : i);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: MUTED,
                      padding: 4,
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenu === i && (
                    <div
                      ref={menuRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 12,
                        zIndex: 30,
                        background: "#fff",
                        border: `1px solid ${BORDER}`,
                        borderRadius: 8,
                        padding: 4,
                        minWidth: 170,
                        textAlign: "left",
                      }}
                    >
                      <MenuItem
                        onClick={() => {
                          setOpenMenu(null);
                          setDetail(r);
                        }}
                      >
                        View details
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setOpenMenu(null);
                          showToast("Receipt downloaded");
                        }}
                      >
                        Download receipt
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setOpenMenu(null);
                          showToast("Transaction flagged for review");
                        }}
                      >
                        Flag transaction
                      </MenuItem>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            zIndex: 60,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 380,
              height: "100%",
              background: "#fff",
              padding: 24,
              overflow: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: INK,
                  margin: 0,
                }}
              >
                Transaction details
              </h3>
              <button
                onClick={() => setDetail(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: MUTED,
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>
            <DetailRow label="Account" value={detail.acct} mono />
            <DetailRow label="Client" value={detail.client} />
            <DetailRow label="Type" value={detail.type} />
            <DetailRow
              label="Amount"
              value={`${detail.type === "Credit" ? "+" : "-"}GHS ${fmt(detail.amount)}`}
            />
            <DetailRow label="Narration" value={detail.narration} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Date" value={detail.date} />
          </div>
        </div>
      )}
    </div>
  );
}

const td: React.CSSProperties = { padding: "16px 18px", fontSize: 13, color: INK };

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: `1px solid ${BORDER}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: MUTED }}>{label}</span>
      <span
        style={{
          color: INK,
          fontWeight: 600,
          fontFamily: mono ? "DM Mono, monospace" : "DM Sans, sans-serif",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        fontSize: 13,
        color: INK,
        fontFamily: "DM Sans, sans-serif",
        borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6FB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string;
  valueColor: string;
  sub: string;
}) {
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Sora, sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: valueColor,
          marginTop: 6,
          fontVariantNumeric: "tabular-nums",
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
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        color: INK,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.2,
        borderRadius: 8,
        padding: "8px 16px",
        height: 36,
        cursor: "pointer",
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
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: `1px solid ${BORDER}`,
        color: INK,
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.2,
        borderRadius: 8,
        padding: "8px 12px",
        height: 36,
        cursor: "pointer",
      }}
    >
      {label}
      <ChevronDown size={14} color={MUTED} />
    </button>
  );
}
