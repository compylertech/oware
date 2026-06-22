import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  ArrowLeftRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import { tokens } from "@/lib/tokens";
import { getClients } from "@/lib/mockStore";

function TxnStatusPill({ status }: { status: "Completed" | "Reversed" }) {
  const isOk = status === "Completed";
  const color = isOk ? "#067647" : "#475467";
  const bg = isOk ? "#ECFDF3" : "#F2F4F7";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full"
      style={{ color, background: bg, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {status}
    </span>
  );
}

export const Route = createFileRoute("/_auth/clients/account-lookup")({
  component: AccountLookupPage,
});

// ---------- Types & mock data ----------

type AccountStatus = "Active" | "Pending";

type AccountDetail = {
  accountNumber: string;
  productName: string;
  balance: number;
  status: AccountStatus;
  clientId: string;
  clientName: string;
  activationDate: string;
};

type TxnEntry = "Credit" | "Debit";
type TxnStatus = "Completed" | "Reversed";
type Txn = {
  id: string;
  date: string;
  type: string;
  entry: TxnEntry;
  amount: number;
  runningBalance: number;
  status: TxnStatus;
};

type WithdrawalNotice = {
  id: string;
  noticeDate: string;
  amount: number;
  maturityDate: string;
  status: "Pending" | "Active" | "Withdrawn";
};

const fmtGHS = (n: number) =>
  `GHS ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function buildMockAccount(): { account: AccountDetail; txns: Txn[]; notices: WithdrawalNotice[] } {
  const client = getClients()[0];
  const account: AccountDetail = {
    accountNumber: "0023 4501 7789",
    productName: "Premium Savings",
    balance: 12450.75,
    status: "Active",
    clientId: client?.clientNumber ?? "CLT-0001",
    clientName: client?.name ?? "Kwame Mensah",
    activationDate: client?.activationDate ?? "12 Jan 2024",
  };

  const raw: Array<[string, TxnEntry, number, TxnStatus]> = [
    ["Salary Deposit", "Credit", 3200, "Completed"],
    ["ATM Withdrawal", "Debit", 400, "Completed"],
    ["Mobile Money In", "Credit", 850, "Completed"],
    ["POS Purchase", "Debit", 215.5, "Completed"],
    ["Interest Earned", "Credit", 42.25, "Completed"],
    ["Standing Order", "Debit", 600, "Completed"],
    ["Transfer In", "Credit", 1500, "Completed"],
    ["Bill Payment", "Debit", 320, "Reversed"],
    ["Cash Deposit", "Credit", 2200, "Completed"],
    ["Transfer Out", "Debit", 750, "Completed"],
    ["Mobile Money Out", "Debit", 180, "Reversed"],
    ["Cheque Deposit", "Credit", 4800, "Completed"],
  ];

  // build txns in reverse so running balance ends at current balance for most recent
  let bal = account.balance;
  const txns: Txn[] = raw.map(([type, entry, amount, status], i) => {
    const date = fmtDate(new Date(2025, 5, 22 - i));
    return {
      id: `tx-${i + 1}`,
      date,
      type,
      entry,
      amount,
      runningBalance: 0,
      status,
    };
  });
  for (let i = 0; i < txns.length; i++) {
    const t = txns[i];
    t.runningBalance = bal;
    if (t.status === "Completed") {
      bal = t.entry === "Credit" ? bal - t.amount : bal + t.amount;
    }
  }

  const notices: WithdrawalNotice[] = [
    {
      id: "wn-1",
      noticeDate: "01 Jun 2025",
      amount: 2000,
      maturityDate: "01 Jul 2025",
      status: "Pending",
    },
    {
      id: "wn-2",
      noticeDate: "10 May 2025",
      amount: 500,
      maturityDate: "10 Jun 2025",
      status: "Active",
    },
  ];

  return { account, txns, notices };
}

// ---------- Small UI primitives ----------

function Card({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: "#fff",
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}


function LayerTag({ label, tone = "teal" }: { label: string; tone?: "teal" | "navy" }) {
  const c = tone === "teal"
    ? { color: tokens.teal, bg: tokens.tealBg, border: "rgba(15,110,86,0.25)" }
    : { color: tokens.navy, bg: "#EEF2F8", border: tokens.border };
  return (
    <span
      className="inline-flex items-center rounded-full uppercase"
      style={{
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        padding: "2px 8px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </span>
  );
}

// ---------- Page ----------

const PAGE_SIZE = 10;

function AccountLookupPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [notices, setNotices] = useState<WithdrawalNotice[]>([]);

  const [filter, setFilter] = useState<"All" | TxnEntry>("All");
  const [page, setPage] = useState(1);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "credit" | "debit" | "transfer">(null);

  function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setSearching(true);
    setActionsOpen(false);
    setTimeout(() => {
      // Any non-empty string except "000" returns the mock account.
      if (q.replace(/\s|-/g, "").toLowerCase() === "000") {
        setAccount(null);
        setTxns([]);
        setNotices([]);
        setError(`No account found for "${q}".`);
      } else {
        const built = buildMockAccount();
        setAccount(built.account);
        setTxns(built.txns);
        setNotices(built.notices);
        setFilter("All");
        setPage(1);
      }
      setSearching(false);
    }, 650);
  }

  const filteredTxns = useMemo(
    () => (filter === "All" ? txns : txns.filter((t) => t.entry === filter)),
    [txns, filter],
  );
  const totalPages = Math.max(1, Math.ceil(filteredTxns.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredTxns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalCredits = txns
    .filter((t) => t.entry === "Credit" && t.status === "Completed")
    .reduce((a, b) => a + b.amount, 0);
  const totalDebits = txns
    .filter((t) => t.entry === "Debit" && t.status === "Completed")
    .reduce((a, b) => a + b.amount, 0);

  // outside click closes Actions menu
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setActionsOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleApprove() {
    if (!account) return;
    setAccount({ ...account, status: "Active" });
  }

  function handleTxnSubmit(kind: "credit" | "debit", amount: number) {
    if (!account) return;
    const newBal = kind === "credit" ? account.balance + amount : account.balance - amount;
    setAccount({ ...account, balance: newBal });
    const newTxn: Txn = {
      id: `tx-new-${Date.now()}`,
      date: fmtDate(new Date()),
      type: kind === "credit" ? "Manual Credit" : "Manual Debit",
      entry: kind === "credit" ? "Credit" : "Debit",
      amount,
      runningBalance: newBal,
      status: "Completed",
    };
    setTxns([newTxn, ...txns]);
  }

  return (
    <div ref={rootRef} style={{ background: tokens.bg, minHeight: "100%", padding: 24 }}>
      <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* ===== Hero ===== */}
        <Card style={{ padding: 28, borderRadius: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: tokens.textMuted,
              textTransform: "uppercase",
            }}
          >
            Chelsea Bank
          </div>
          <h1
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              color: tokens.text,
              marginTop: 6,
            }}
          >
            Account Lookup
          </h1>
          <p style={{ fontSize: 13, color: tokens.textSub, marginTop: 4 }}>
            Search an account number to view details and transaction history.
          </p>

          <form
            onSubmit={handleLookup}
            className="flex items-stretch gap-2 mt-5"
            style={{ maxWidth: 580 }}
          >
            <div
              className="flex items-center gap-2 flex-1"
              style={{
                background: "#F5F8FE",
                border: `1px solid ${tokens.border}`,
                borderRadius: 10,
                padding: "0 12px",
              }}
            >
              <Wallet size={16} color={tokens.textMuted} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter account number"
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 13,
                  color: tokens.text,
                  height: 40,
                }}
                onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = tokens.navy)}
                onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = tokens.border)}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: tokens.navy,
                color: "#fff",
                borderRadius: 10,
                padding: "0 18px",
                fontSize: 13,
                fontWeight: 600,
                height: 42,
              }}
            >
              {searching ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search size={15} />
                  Look Up
                </>
              )}
            </button>
          </form>

          {error && (
            <div
              className="mt-3"
              style={{
                background: "#FEF3F2",
                border: "1px solid #FECDCA",
                color: "#B42318",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                maxWidth: 580,
              }}
            >
              {error}
            </div>
          )}
        </Card>

        {/* ===== Account result ===== */}
        {account && (
          <div
            style={{
              background:
                "linear-gradient(135deg, #001844 0%, #002663 55%, #1a4080 100%)",
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
              borderTop: "3px solid #4A90FF",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", padding: 28 }}>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.4,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 700,
                    }}
                  >
                    ACCOUNT NUMBER
                  </div>
                  <div
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fff",
                      marginTop: 6,
                      letterSpacing: 1,
                    }}
                  >
                    {account.accountNumber}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
                    {account.productName}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.4,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 700,
                    }}
                  >
                    CURRENT BALANCE
                  </div>
                  <div
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#fff",
                      marginTop: 4,
                    }}
                  >
                    {fmtGHS(account.balance)}
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <StatusPill status={account.status} variant="onDark" />
                    {account.status === "Pending" ? (
                      <button
                        onClick={handleApprove}
                        className="cursor-pointer"
                        style={{
                          background: "rgba(110,231,183,0.18)",
                          color: "#6EE7B7",
                          border: "1px solid rgba(110,231,183,0.4)",
                          borderRadius: 8,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => {}}
                        className="cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 8,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-7 pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
              >
                <MetaItem label="CLIENT ID" value={account.clientId} mono />
                <MetaItem label="CLIENT NAME" value={account.clientName} />
                <MetaItem label="ACTIVATION DATE" value={account.activationDate} />
              </div>
            </div>
          </div>
        )}

        {/* ===== Summary stats ===== */}
        {account && txns.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Activity size={18} />}
              iconBg="#EFF4FE"
              iconColor={tokens.accent}
              label="Transactions"
              value={String(txns.length)}
              valueColor={tokens.navy}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              iconBg="#ECFDF3"
              iconColor="#067647"
              label="Total Credits"
              value={fmtGHS(totalCredits)}
              valueColor="#067647"
            />
            <StatCard
              icon={<TrendingDown size={18} />}
              iconBg="#FEF3F2"
              iconColor="#D92D20"
              label="Total Debits"
              value={fmtGHS(totalDebits)}
              valueColor="#D92D20"
            />
            <StatCard
              icon={<Wallet size={18} />}
              iconBg="#F4EEFE"
              iconColor="#6938EF"
              label="Net"
              value={fmtGHS(totalCredits - totalDebits)}
              valueColor="#6938EF"
            />
          </div>
        )}

        {/* ===== Transactions ===== */}
        {account && (
          <Card>
            <div
              className="flex flex-wrap items-center justify-between gap-3"
              style={{ padding: "18px 22px", borderBottom: `1px solid ${tokens.border}` }}
            >
              <div className="flex items-center gap-3">
                <span style={{ width: 3, height: 18, background: tokens.navy, borderRadius: 2 }} />
                <span
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 12,
                    letterSpacing: 1.2,
                    fontWeight: 700,
                    color: tokens.text,
                    textTransform: "uppercase",
                  }}
                >
                  Transaction History
                </span>
              </div>

              <div className="flex items-center gap-2">
                {(["All", "Credit", "Debit"] as const).map((f) => {
                  const active = filter === f;
                  const c =
                    f === "Credit"
                      ? { bg: "#067647", text: "#fff", border: "#067647" }
                      : f === "Debit"
                        ? { bg: "#D92D20", text: "#fff", border: "#D92D20" }
                        : { bg: tokens.navy, text: "#fff", border: tokens.navy };
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        setFilter(f);
                        setPage(1);
                      }}
                      className="cursor-pointer"
                      style={{
                        background: active ? c.bg : "#fff",
                        color: active ? c.text : tokens.textSub,
                        border: `1px solid ${active ? c.border : tokens.border}`,
                        borderRadius: 999,
                        padding: "5px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {f === "All" ? "All" : f}
                    </button>
                  );
                })}
                <span style={{ fontSize: 12, color: tokens.textMuted, marginLeft: 6 }}>
                  {filteredTxns.length} results
                </span>

                {account.status === "Active" && (
                  <div className="relative ml-2">
                    <button
                      onClick={() => setActionsOpen((o) => !o)}
                      className="inline-flex items-center gap-1.5 cursor-pointer"
                      style={{
                        background: tokens.navy,
                        color: "#fff",
                        borderRadius: 8,
                        padding: "7px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      Actions
                      <ChevronDown size={14} />
                    </button>
                    {actionsOpen && (
                      <div
                        className="absolute right-0 mt-2 z-20"
                        style={{
                          background: "#fff",
                          border: `1px solid ${tokens.border}`,
                          borderRadius: 12,
                          width: 220,
                          padding: 6,
                        }}
                      >
                        <ActionItem
                          icon={<TrendingUp size={15} />}
                          iconBg="#ECFDF3"
                          iconColor="#067647"
                          label="Credit Account"
                          onClick={() => {
                            setActionsOpen(false);
                            setDialog("credit");
                          }}
                        />
                        <ActionItem
                          icon={<TrendingDown size={15} />}
                          iconBg="#FEF3F2"
                          iconColor="#D92D20"
                          label="Debit Account"
                          onClick={() => {
                            setActionsOpen(false);
                            setDialog("debit");
                          }}
                        />
                        <ActionItem
                          icon={<ArrowLeftRight size={15} />}
                          iconBg="#EFF4FE"
                          iconColor={tokens.accent}
                          label="Transfer Funds"
                          onClick={() => {
                            setActionsOpen(false);
                            setDialog("transfer");
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F5F8FE" }}>
                    {["Date", "Type", "Entry", "Amount", "Running Balance", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 18px",
                          fontSize: 10,
                          letterSpacing: 1,
                          fontWeight: 700,
                          color: tokens.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 36, textAlign: "center", color: tokens.textMuted, fontSize: 13 }}>
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-[#FAFBFF]"
                        style={{ borderTop: `1px solid ${tokens.border}` }}
                      >
                        <td style={{ padding: "12px 18px", fontSize: 13, color: tokens.textSub }}>
                          {t.date}
                        </td>
                        <td style={{ padding: "12px 18px", fontSize: 13, color: tokens.text }}>
                          {t.type}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <StatusPill status={t.entry} />
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 700,
                            fontSize: 13,
                            fontVariantNumeric: "tabular-nums",
                            color: t.entry === "Credit" ? "#067647" : "#D92D20",
                          }}
                        >
                          {t.entry === "Credit" ? "+" : "−"} {fmtGHS(t.amount)}
                        </td>
                        <td
                          style={{
                            padding: "12px 18px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 500,
                            fontSize: 13,
                            fontVariantNumeric: "tabular-nums",
                            color: tokens.text,
                          }}
                        >
                          {fmtGHS(t.runningBalance)}
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <TxnStatusPill status={t.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTxns.length > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3"
                style={{ padding: "14px 22px", borderTop: `1px solid ${tokens.border}` }}
              >
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Page {currentPage} of {totalPages} · {filteredTxns.length} transactions
                </div>
                <div className="flex items-center gap-1">
                  <PageBtn onClick={() => setPage(1)} disabled={currentPage === 1}>
                    <ChevronsLeft size={14} />
                  </PageBtn>
                  <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={14} />
                  </PageBtn>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: p === currentPage ? tokens.navy : "#fff",
                        color: p === currentPage ? "#fff" : tokens.textSub,
                        border: `1px solid ${p === currentPage ? tokens.navy : tokens.border}`,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <PageBtn
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={14} />
                  </PageBtn>
                  <PageBtn onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>
                    <ChevronsRight size={14} />
                  </PageBtn>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* ===== Withdrawal notices ===== */}
        {account?.clientId && (
          <Card>
            <div
              className="flex items-center justify-between gap-3"
              style={{
                padding: "16px 22px",
                borderBottom: `1px solid ${tokens.border}`,
                borderLeft: `3px solid ${tokens.teal}`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: tokens.text,
                  }}
                >
                  Account Withdrawal Notices
                </span>
                <LayerTag label="Cooperative" />
              </div>
              <button
                onClick={() =>
                  setNotices([
                    {
                      id: `wn-${Date.now()}`,
                      noticeDate: fmtDate(new Date()),
                      amount: 1000,
                      maturityDate: fmtDate(new Date(Date.now() + 30 * 86400000)),
                      status: "Pending",
                    },
                    ...notices,
                  ])
                }
                className="inline-flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: tokens.tealBg,
                  color: tokens.teal,
                  border: `1px solid rgba(15,110,86,0.25)`,
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Plus size={14} />
                Add notice
              </button>
            </div>
            {notices.length === 0 ? (
              <div style={{ padding: 28, textAlign: "center", color: tokens.textMuted, fontSize: 13 }}>
                No withdrawal notices.
              </div>
            ) : (
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F5F8FE" }}>
                    {["Notice date", "Amount", "Maturity / release", "Status"].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "10px 22px",
                          fontSize: 10,
                          letterSpacing: 1,
                          fontWeight: 700,
                          color: tokens.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.id} style={{ borderTop: `1px solid ${tokens.border}` }}>
                      <td style={{ padding: "12px 22px", fontSize: 13, color: tokens.textSub }}>
                        {n.noticeDate}
                      </td>
                      <td
                        style={{
                          padding: "12px 22px",
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: 13,
                          fontVariantNumeric: "tabular-nums",
                          color: tokens.text,
                        }}
                      >
                        {fmtGHS(n.amount)}
                      </td>
                      <td style={{ padding: "12px 22px", fontSize: 13, color: tokens.textSub }}>
                        {n.maturityDate}
                      </td>
                      <td style={{ padding: "12px 22px" }}>
                        <StatusPill status={n.status as StatusKind} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {!account && !error && !searching && (
          <Card style={{ padding: 48, textAlign: "center" }}>
            <Wallet size={32} color={tokens.textMuted} className="mx-auto" />
            <div style={{ fontSize: 14, color: tokens.textSub, marginTop: 10 }}>
              Search an account number above to view its details.
            </div>
          </Card>
        )}
      </div>

      {/* ===== Dialogs ===== */}
      {dialog === "credit" && account && (
        <TxnDialog
          kind="credit"
          accountNumber={account.accountNumber}
          onClose={() => setDialog(null)}
          onSubmit={(amount) => {
            handleTxnSubmit("credit", amount);
            setDialog(null);
          }}
        />
      )}
      {dialog === "debit" && account && (
        <TxnDialog
          kind="debit"
          accountNumber={account.accountNumber}
          onClose={() => setDialog(null)}
          onSubmit={(amount) => {
            handleTxnSubmit("debit", amount);
            setDialog(null);
          }}
        />
      )}
      {dialog === "transfer" && account && (
        <TransferDialog
          fromAccount={account.accountNumber}
          onClose={() => setDialog(null)}
          onSubmit={(amount) => {
            handleTxnSubmit("debit", amount);
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <Card style={{ padding: 18 }}>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center"
          style={{ width: 38, height: 38, borderRadius: 10, background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600 }}>{label}</div>
          <div
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              color: valueColor,
              marginTop: 2,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ActionItem({
  icon,
  iconBg,
  iconColor,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full text-left cursor-pointer hover:bg-[#F5F8FE]"
      style={{ padding: "8px 10px", borderRadius: 8 }}
    >
      <span
        className="flex items-center justify-center"
        style={{ width: 28, height: 28, borderRadius: 8, background: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: tokens.text }}>{label}</span>
    </button>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "#fff",
        border: `1px solid ${tokens.border}`,
        color: tokens.textSub,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

// ----- Dialog primitives -----

function DialogShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          border: `1px solid ${tokens.border}`,
          borderRadius: 14,
          width: "100%",
          maxWidth: 448,
        }}
      >
        <div
          className="flex items-start justify-between"
          style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: tokens.text,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: tokens.textMuted }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textSub, marginBottom: 6 }}>
        {label} {required && <span style={{ color: "#D92D20" }}>*</span>}
      </div>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#F5F8FE",
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  color: tokens.text,
  outline: "none",
};

function TxnDialog({
  kind,
  accountNumber,
  onClose,
  onSubmit,
}: {
  kind: "credit" | "debit";
  accountNumber: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [payType, setPayType] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const isCredit = kind === "credit";
  const color = isCredit ? "#059669" : "#DC2626";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      setErr("Enter a valid amount greater than zero.");
      return;
    }
    setErr(null);
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setDone(true);
      setTimeout(() => onSubmit(n), 900);
    }, 700);
  }

  return (
    <DialogShell
      title={isCredit ? "Credit Account" : "Debit Account"}
      subtitle={
        <>
          to account{" "}
          <span style={{ fontFamily: "'DM Mono', monospace", color: tokens.text }}>
            {accountNumber}
          </span>
        </>
      }
      onClose={onClose}
    >
      {done ? (
        <div style={{ padding: 32, textAlign: "center" }}>
          <div
            className="mx-auto flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: "#ECFDF5",
              color: "#059669",
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <div
            style={{
              marginTop: 12,
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              color: tokens.text,
            }}
          >
            {isCredit ? "Credit Posted" : "Debit Posted"}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>
            Transaction has been recorded.
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ padding: 20 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount" required>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                style={inputStyle}
              />
            </Field>
            <Field label="Payment Type">
              <select value={payType} onChange={(e) => setPayType(e.target.value)} style={inputStyle}>
                <option>Cash</option>
                <option>Mobile Money</option>
                <option>Cheque</option>
                <option>Transfer</option>
              </select>
            </Field>
          </div>
          <Field label="Transaction Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          {err && (
            <div
              style={{
                background: "#FEF3F2",
                border: "1px solid #FECDCA",
                color: "#B42318",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
              }}
            >
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="w-full cursor-pointer disabled:opacity-60"
            style={{
              background: color,
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {saving ? "Saving…" : isCredit ? "Credit" : "Debit"}
          </button>
        </form>
      )}
    </DialogShell>
  );
}

function TransferDialog({
  fromAccount,
  onClose,
  onSubmit,
}: {
  fromAccount: string;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [ref, setRef] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!to.trim()) return setErr("To account is required.");
    if (!n || n <= 0) return setErr("Enter a valid amount.");
    setErr(null);
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onSubmit(n);
    }, 700);
  }

  return (
    <DialogShell title="Transfer Funds" onClose={onClose}>
      <form onSubmit={submit} style={{ padding: 20 }} className="space-y-4">
        <Field label="From account">
          <input
            value={fromAccount}
            readOnly
            style={{ ...inputStyle, fontFamily: "'DM Mono', monospace", background: "#EEF2F8" }}
          />
        </Field>
        <Field label="To account" required>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Enter account number"
            style={{ ...inputStyle, fontFamily: "'DM Mono', monospace" }}
          />
        </Field>
        <Field label="Amount" required>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            style={inputStyle}
          />
        </Field>
        <Field label="Description">
          <input value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Reference">
          <input value={ref} onChange={(e) => setRef(e.target.value)} style={inputStyle} />
        </Field>
        {err && (
          <div
            style={{
              background: "#FEF3F2",
              border: "1px solid #FECDCA",
              color: "#B42318",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full cursor-pointer disabled:opacity-60"
          style={{
            background: tokens.navy,
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {saving ? "Saving…" : "Transfer"}
        </button>
      </form>
    </DialogShell>
  );
}
