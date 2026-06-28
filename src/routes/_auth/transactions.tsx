import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Download, Search, MoreVertical } from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import {
  Button,
  DateRangeFilter,
  EmptyRow,
  FilterSelect,
  Table,
  TableCard,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/patterns";
import { isDisplayDateInRange } from "@/lib/dateFilters";
import { FONTS } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/transactions")({
  component: TransactionsPage,
});

const NAVY = "#002663";
const BORDER = "#DDE4EF";
const MUTED = "#5B6A86";
const INK = "#16233F";
const BG = "#F4F6FB";
const PAGE_SIZE = 10;

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

const OFFICE_BY_ACCT: Record<string, string> = {
  "ACC-00001": "Head Office",
  "ACC-00002": "Kumasi",
  "ACC-00003": "Takoradi",
  "ACC-00004": "Accra Main",
  "ACC-00005": "Head Office",
  "ACC-00006": "Kumasi",
};

const OFFICE_OPTIONS = [
  { label: "All offices", value: "All" },
  { label: "Head Office", value: "Head Office" },
  { label: "Accra Main", value: "Accra Main" },
  { label: "Kumasi", value: "Kumasi" },
  { label: "Takoradi", value: "Takoradi" },
];
const TYPE_OPTIONS = [
  { label: "All types", value: "All" },
  { label: "Credit", value: "Credit" },
  { label: "Debit", value: "Debit" },
];
const STATUS_OPTIONS = [
  { label: "All statuses", value: "All" },
  { label: "Completed", value: "Completed" },
  { label: "Pending", value: "Pending" },
];

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
    fontFamily: FONTS.body,
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

  const [search, setSearch] = useState("");
  const [office, setOffice] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = ROWS.filter((r) => {
    if (office !== "All" && OFFICE_BY_ACCT[r.acct] !== office) return false;
    if (typeFilter !== "All" && r.type !== typeFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (!isDisplayDateInRange(r.date, dateFrom, dateTo)) return false;
    if (q && !`${r.acct} ${r.client} ${r.narration}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalCredits = filtered
    .filter((r) => r.type === "Credit" && r.status === "Completed")
    .reduce((s, r) => s + r.amount, 0);
  const totalDebits = filtered
    .filter((r) => r.type === "Debit" && r.status === "Completed")
    .reduce((s, r) => s + r.amount, 0);
  const pendingCount = filtered.filter((r) => r.status === "Pending").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateOffice(value: string) {
    setOffice(value);
    setPage(1);
  }

  function updateType(value: string) {
    setTypeFilter(value);
    setPage(1);
  }

  function updateStatus(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function updateDateFrom(value: string) {
    setDateFrom(value);
    setPage(1);
  }

  function updateDateTo(value: string) {
    setDateTo(value);
    setPage(1);
  }

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
              fontFamily: FONTS.body,
              fontSize: 26,
              fontWeight: 200,
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
          <Button variant="outline" icon={<RefreshCw size={14} />}>
            Refresh
          </Button>
          <Button variant="primary" icon={<Download size={14} />}>
            Export
          </Button>
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
        <Kpi
          label="TOTAL TRANSACTIONS"
          value={String(filtered.length)}
          valueColor={INK}
          sub="Matching filters"
        />
        <Kpi
          label="TOTAL CREDITS"
          value={`GH₵ ${fmt(totalCredits)}`}
          valueColor="#067647"
          sub="Completed credits"
        />
        <Kpi
          label="TOTAL DEBITS"
          value={`GH₵ ${fmt(totalDebits)}`}
          valueColor="#D92D20"
          sub="Completed debits"
        />
        <Kpi
          label="PENDING"
          value={String(pendingCount)}
          valueColor="#B45309"
          sub="Awaiting processing"
        />
      </div>

      <TableCard
        title="Transaction Register"
        filters={
          <>
            <div
              style={{
                width: 280,
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
                value={search}
                onChange={(e) => updateSearch(e.target.value)}
                placeholder="Search reference, client, account…"
                style={{
                  minWidth: 0,
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: INK,
                  background: "transparent",
                }}
              />
            </div>
            <FilterSelect
              label="Office"
              value={office}
              onChange={updateOffice}
              options={OFFICE_OPTIONS}
            />
            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={updateType}
              options={TYPE_OPTIONS}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={updateStatus}
              options={STATUS_OPTIONS}
            />
            <DateRangeFilter
              from={dateFrom}
              to={dateTo}
              onFromChange={updateDateFrom}
              onToChange={updateDateTo}
            />
          </>
        }
        resultLabel={`${filtered.length} results`}
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: filtered.length,
          itemLabel: "transactions",
          onPageChange: setPage,
        }}
      >
        <Table>
          <THead>
            {["ACCOUNT NO.", "CLIENT", "DEBIT", "CREDIT", "NARRATION", "STATUS", "DATE", ""].map(
              (h) => (
                <Th
                  key={h}
                  style={{
                    padding: "14px 18px",
                    fontSize: 12,
                    color: MUTED,
                    letterSpacing: "0.08em",
                  }}
                >
                  {h}
                </Th>
              ),
            )}
          </THead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={8}>No transactions match the current filters.</EmptyRow>
            )}
            {pageRows.map((r, i) => (
              <Tr
                key={`${r.acct}-${r.date}-${r.narration}`}
                hover
                style={{ borderBottom: i < pageRows.length - 1 ? `1px solid ${BORDER}` : "none" }}
              >
                <Td style={td}>
                  <span style={{ fontFamily: FONTS.mono, color: NAVY, fontSize: 13 }}>
                    {r.acct}
                  </span>
                </Td>
                <Td style={td}>
                  <span style={{ fontSize: 13, color: INK }}>{r.client}</span>
                </Td>
                <Td
                  style={{
                    ...td,
                    fontWeight: 100,
                    color: INK,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.type === "Debit" ? `GH₵ ${fmt(r.amount)}` : ""}
                </Td>
                <Td
                  style={{
                    ...td,
                    fontWeight: 100,
                    color: INK,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.type === "Credit" ? `GH₵ ${fmt(r.amount)}` : ""}
                </Td>
                <Td style={{ ...td, color: INK }}>{r.narration}</Td>
                <Td style={td}>
                  <StatusPill status={r.status} />
                </Td>
                <Td style={{ ...td, color: INK }}>{r.date}</Td>
                <Td style={{ ...td, textAlign: "right", position: "relative" }}>
                  <button
                    type="button"
                    aria-label="Actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      const menuKey = (currentPage - 1) * PAGE_SIZE + i;
                      setOpenMenu(openMenu === menuKey ? null : menuKey);
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
                  {openMenu === (currentPage - 1) * PAGE_SIZE + i && (
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
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

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
                  fontFamily: FONTS.body,
                  fontSize: 18,
                  fontWeight: 100,
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
              value={`${detail.type === "Credit" ? "+" : "-"}GH₵ ${fmt(detail.amount)}`}
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
          fontWeight: 300,
          fontFamily: mono ? FONTS.mono : FONTS.body,
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
        fontFamily: FONTS.body,
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
          fontWeight: 100,
          color: MUTED,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 28,
          fontWeight: 200,
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

