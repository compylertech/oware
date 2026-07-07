import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wallet,
  Search,
  RefreshCw,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Plus,
  ArrowLeftRight,
  X,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import {
  Button,
  DateRangeFilter,
  EmptyRow,
  Pill,
  Table,
  TableCard,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/patterns";
import { FONTS, tokens } from "@/lib/tokens";
import {
  ApiError,
  apiErrorMessage,
  referencesApi,
  savingsAccountsApi,
  transactionOperationsApi,
  type AccountDto,
  type MoneyTransactionResultDto,
  type ReferenceValueDto,
  type TransactionDto,
  type TransactionOperationDto,
} from "@/api/backend";

export const Route = createFileRoute("/_auth/clients/account-lookup")({
  component: AccountLookupPage,
});

// ---------- Types & mock data ----------

type AccountStatus = "Active" | "Pending";

type AccountDetail = {
  id: string;
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
  narration: string;
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
  status: StatusKind;
};

const fmtGHS = (n: number) =>
  `GH₵ ${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function accountStatusFrom(value?: string): AccountStatus {
  return (value ?? "").toUpperCase().includes("PENDING") ? "Pending" : "Active";
}

function mapAccountDetail(dto: AccountDto, fallbackAccountNumber: string): AccountDetail {
  return {
    id: dto.id,
    accountNumber: dto.accountNo ?? fallbackAccountNumber,
    productName: dto.productName ?? "—",
    balance: dto.availableBalance ?? dto.accountBalance ?? 0,
    status: accountStatusFrom(dto.status),
    clientId: dto.clientId ?? "—",
    clientName: dto.clientName ?? "—",
    activationDate: dto.activatedOnDate ? fmtDate(new Date(dto.activatedOnDate)) : "—",
  };
}

// A "withdrawal notice" on this backend is a SAVINGS_WITHDRAWAL transaction
// operation sitting in the async review workflow — statuses map onto the
// same StatusPill tones used elsewhere rather than a bespoke 3-state enum.
const NOTICE_STATUS: Record<string, StatusKind> = {
  RECEIVED: "Pending",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Scheduled",
  PROCESSING: "Scheduled",
  POSTED: "Completed",
  FAILED: "Failed",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
  UNKNOWN: "Pending",
};

const NOTICE_RELEASE_DAYS = 3;

function mapWithdrawalNotice(dto: TransactionOperationDto): WithdrawalNotice {
  const transactionDate = new Date(dto.transactionDate);
  const releaseDate = new Date(transactionDate);
  releaseDate.setDate(releaseDate.getDate() + NOTICE_RELEASE_DAYS);
  return {
    id: dto.id,
    noticeDate: fmtDate(transactionDate),
    amount: dto.amount,
    maturityDate: fmtDate(releaseDate),
    status: NOTICE_STATUS[dto.status] ?? "Pending",
  };
}

// The transactions endpoint reports amount as an unsigned magnitude and
// encodes direction in transactionTypeCode (e.g.
// "savingsAccountTransactionType.withdrawal") — classify by keyword since
// deposits/interest/dividends are the credit side and withdrawals/fees/
// charges are the debit side.
const DEBIT_TRANSACTION_KEYWORDS = ["withdrawal", "fee", "charge", "penalty"];
function entryFromTransactionType(code?: string): TxnEntry {
  const c = (code ?? "").toLowerCase();
  return DEBIT_TRANSACTION_KEYWORDS.some((k) => c.includes(k)) ? "Debit" : "Credit";
}

function mapTransaction(dto: TransactionDto): Txn {
  const dateValue = dto.transactionDate ?? dto.date;
  return {
    id: String(dto.id),
    date: dateValue ? fmtDate(new Date(dateValue)) : "—",
    narration: dto.note?.trim() || dto.transactionTypeValue || dto.type || "Transaction",
    entry: entryFromTransactionType(dto.transactionTypeCode),
    amount: dto.amount ?? 0,
    runningBalance: dto.runningBalance ?? 0,
    status: dto.reversed ? "Reversed" : "Completed",
  };
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
  const c =
    tone === "teal"
      ? { color: tokens.teal, bg: tokens.tealBg, border: "rgba(15,110,86,0.25)" }
      : { color: tokens.navy, bg: "#EEF2F8", border: tokens.border };
  return (
    <Pill color={c.color} bg={c.bg} border={c.border} uppercase>
      {label}
    </Pill>
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [noticesPage, setNoticesPage] = useState(1);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [accountActionsOpen, setAccountActionsOpen] = useState(false);
  const [dialog, setDialog] = useState<null | "credit" | "debit" | "transfer" | "notice">(null);

  const [txLoading, setTxLoading] = useState(false);
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    void referencesApi.list("PAYMENT_TYPE").then(setPaymentTypeOptions);
  }, []);

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setSearching(true);
    setActionsOpen(false);
    setAccountActionsOpen(false);
    try {
      const [detail, rows] = await Promise.all([
        savingsAccountsApi.get(q),
        savingsAccountsApi.transactions(q),
      ]);
      if (!detail) {
        throw new Error("Backend is not reachable right now.");
      }
      const noticeOps = await transactionOperationsApi.search({
        operationType: "SAVINGS_WITHDRAWAL",
        accountType: "SAVINGS",
        localAccountId: detail.id,
      });
      setAccount(mapAccountDetail(detail, q));
      setNotices(noticeOps.map(mapWithdrawalNotice));
      setTxns(rows.map(mapTransaction));
      setFilter("All");
      setDateFrom("");
      setDateTo("");
      setPage(1);
      setNoticesPage(1);
    } catch (err) {
      setAccount(null);
      setTxns([]);
      setNotices([]);
      setError(
        err instanceof ApiError && err.status === 404
          ? `No account found for "${q}".`
          : apiErrorMessage(err, "Something went wrong looking up this account."),
      );
    } finally {
      setSearching(false);
    }
  }

  /** Re-runs the transactions fetch with a date range — the API filters
   * server-side, so this replaces the current rows rather than re-filtering
   * client-side. */
  async function refetchTransactions(fromDate: string, toDate: string) {
    if (!account) return;
    setTxLoading(true);
    try {
      const rows = await savingsAccountsApi.transactions(account.accountNumber, {
        fromSubmittedDate: fromDate || undefined,
        toSubmittedDate: toDate || undefined,
      });
      setTxns(rows.map(mapTransaction));
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load transactions for this date range."));
    } finally {
      setTxLoading(false);
    }
  }

  const filteredTxns = useMemo(
    () => txns.filter((t) => filter === "All" || t.entry === filter),
    [txns, filter],
  );
  const totalPages = Math.max(1, Math.ceil(filteredTxns.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredTxns.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const noticesTotalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE));
  const noticesCurrentPage = Math.min(noticesPage, noticesTotalPages);
  const noticesPageRows = notices.slice(
    (noticesCurrentPage - 1) * PAGE_SIZE,
    noticesCurrentPage * PAGE_SIZE,
  );

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
      if (!rootRef.current?.contains(e.target as Node)) {
        setActionsOpen(false);
        setAccountActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleApprove() {
    if (!account) return;
    setAccount({ ...account, status: "Active" });
    setAccountActionsOpen(false);
  }

  /** Credit/Debit dialogs post to the real deposit/withdrawal endpoints and
   * hand back the resulting transaction — apply it directly rather than
   * guessing at a new balance. */
  function applyTxnResult(tx: TransactionDto) {
    setAccount((prev) => (prev ? { ...prev, balance: tx.runningBalance ?? prev.balance } : prev));
    setTxns((prev) => [mapTransaction(tx), ...prev]);
  }

  /** A withdrawal notice is a SAVINGS_WITHDRAWAL sent with approvalRequired:
   * true — the backend parks it awaiting approval instead of posting it, so
   * runningBalance/transaction.id come back null and there's nothing to add
   * to the transactions table; it becomes a new notice row instead. */
  function applyNoticeResult(result: MoneyTransactionResultDto) {
    setNotices((prev) => [
      mapWithdrawalNotice({
        id: result.operationId ?? `notice-${Date.now()}`,
        operationType: "SAVINGS_WITHDRAWAL",
        accountType: "SAVINGS",
        amount: result.transaction.amount ?? 0,
        transactionDate: result.transaction.transactionDate ?? new Date().toISOString().slice(0, 10),
        status: result.status ?? "PENDING_APPROVAL",
      }),
      ...prev,
    ]);
    setNoticesPage(1);
  }

  // Transfer Funds has no backend endpoint yet, so it stays a local-only mock.
  function handleMockTransfer(amount: number) {
    if (!account) return;
    const newBal = account.balance - amount;
    setAccount({ ...account, balance: newBal });
    const newTxn: Txn = {
      id: `tx-new-${Date.now()}`,
      date: fmtDate(new Date()),
      narration: "Manual Debit",
      entry: "Debit",
      amount,
      runningBalance: newBal,
      status: "Completed",
    };
    setTxns([newTxn, ...txns]);
  }

  const transactionFilters = (
    <>
      {(["All", "Credit", "Debit"] as const).map((f) => {
        const active = filter === f;
        return (
          <Button
            type="button"
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            variant={
              active
                ? f === "Credit"
                  ? "success"
                  : f === "Debit"
                    ? "danger"
                    : "primary"
                : "outline"
            }
            size="sm"
            style={{ borderRadius: 999 }}
          >
            {f === "All" ? "All" : f}
          </Button>
        );
      })}
      <DateRangeFilter
        from={dateFrom}
        to={dateTo}
        onFromChange={(value) => {
          setDateFrom(value);
          setPage(1);
          void refetchTransactions(value, dateTo);
        }}
        onToChange={(value) => {
          setDateTo(value);
          setPage(1);
          void refetchTransactions(dateFrom, value);
        }}
      />
    </>
  );

  const transactionActions =
    account?.status === "Active" ? (
      <div className="relative ml-2">
        <Button
          type="button"
          onClick={() => {
            setAccountActionsOpen(false);
            setActionsOpen((o) => !o);
          }}
          variant="primary"
          size="sm"
          iconRight={<ChevronDown size={14} />}
        >
          Actions
        </Button>
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
    ) : null;

  return (
    <div ref={rootRef} style={{ background: tokens.bg, minHeight: "100%", padding: 24 }}>
      <div className="space-y-5" style={{ fontFamily: FONTS.body }}>
        {/* ===== Hero ===== */}
        <Card style={{ padding: 28, borderRadius: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 100,
              letterSpacing: 1.2,
              color: tokens.textMuted,
              textTransform: "uppercase",
            }}
          >
            Oware
          </div>
          <h1
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              fontWeight: 200,
              color: tokens.text,
              marginTop: 6,
            }}
          >
            Accounts
          </h1>
          <p style={{ fontSize: 13, color: tokens.textSub, marginTop: 4 }}>
            Search an account number to view details and transaction history.
          </p>

          <form
            onSubmit={(e) => void handleLookup(e)}
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
                  fontFamily: FONTS.mono,
                  fontSize: 13,
                  color: tokens.text,
                  height: 40,
                }}
                onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = tokens.navy)}
                onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = tokens.border)}
              />
            </div>
            <Button
              type="submit"
              disabled={searching || !query.trim()}
              size="lg"
              icon={
                searching ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />
              }
            >
              {searching ? "Searching…" : "Look Up"}
            </Button>
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
              position: "relative",
              borderRadius: 16,
              borderTop: "3px solid #4A90FF",
            }}
          >
            {/* Background + dotted pattern live in their own clipped layer so the
                rounded corners don't force `overflow: hidden` onto the content
                below, which would cut off the account-actions dropdown. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 16,
                overflow: "hidden",
                background: "linear-gradient(135deg, #001844 0%, #002663 55%, #1a4080 100%)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
            </div>
            <div style={{ position: "relative", padding: 28 }}>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 1.4,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 100,
                    }}
                  >
                    ACCOUNT NUMBER
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 26,
                      fontWeight: 100,
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
                      fontWeight: 100,
                    }}
                  >
                    AVAILABLE BALANCE
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 32,
                      fontWeight: 200,
                      color: "#fff",
                      marginTop: 4,
                    }}
                  >
                    {fmtGHS(account.balance)}
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <StatusPill status={account.status} variant="onDark" />
                    <div className="relative">
                      <button
                        type="button"
                        aria-label="Account actions"
                        aria-expanded={accountActionsOpen}
                        onClick={() => {
                          setActionsOpen(false);
                          setAccountActionsOpen((v) => !v);
                        }}
                        style={{
                          background: "rgba(255,255,255,0.1)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 8,
                          padding: 6,
                          color: "white",
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {accountActionsOpen && (
                        <div
                          className="absolute z-20 bg-white"
                          style={{
                            top: 36,
                            right: 0,
                            border: `1px solid ${tokens.border}`,
                            borderRadius: 8,
                            minWidth: 190,
                            padding: 4,
                          }}
                        >
                          {account.status === "Pending" ? (
                            <>
                              <AccountActionItem label="Approve Account" onClick={handleApprove} />
                              <AccountActionItem
                                label="Reject Account"
                                color="#D92D20"
                                onClick={() => setAccountActionsOpen(false)}
                              />
                            </>
                          ) : (
                            <AccountActionItem
                              label="Close Account"
                              color="#D92D20"
                              onClick={() => setAccountActionsOpen(false)}
                            />
                          )}
                        </div>
                      )}
                    </div>
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
              iconBg="#F2F4F7"
              iconColor="#475467"
              label="Net"
              value={fmtGHS(totalCredits - totalDebits)}
              valueColor={tokens.text}
            />
          </div>
        )}

        {/* ===== Transactions ===== */}
        {account && (
          <TableCard
            title="Transaction History"
            filters={transactionFilters}
            resultLabel={`${filteredTxns.length} results`}
            actions={transactionActions}
            pagination={{
              page: currentPage,
              totalPages,
              totalItems: filteredTxns.length,
              itemLabel: "transactions",
              onPageChange: setPage,
            }}
          >
            <Table>
              <THead>
                {["Date", "Narration", "Debit", "Credit", "Running Balance", "Status"].map((h) => (
                  <Th key={h}>{h}</Th>
                ))}
              </THead>
              <tbody>
                {txLoading ? (
                  <EmptyRow colSpan={6}>Loading transactions…</EmptyRow>
                ) : pageRows.length === 0 ? (
                  <EmptyRow colSpan={6}>No transactions found</EmptyRow>
                ) : (
                  pageRows.map((t) => (
                    <Tr key={t.id} hover>
                      <Td muted>{t.date}</Td>
                      <Td>{t.narration}</Td>
                      <Td numeric style={{ fontWeight: 100 }}>
                        {t.entry === "Debit" ? fmtGHS(t.amount) : ""}
                      </Td>
                      <Td numeric style={{ fontWeight: 100 }}>
                        {t.entry === "Credit" ? fmtGHS(t.amount) : ""}
                      </Td>
                      <Td numeric style={{ fontWeight: 100 }}>
                        {fmtGHS(t.runningBalance)}
                      </Td>
                      <Td>
                        <StatusPill status={t.status} />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
        )}

        {/* ===== Withdrawal notices ===== */}
        {account?.clientId && (
          <TableCard
            title={
              <span className="inline-flex items-center gap-3">
                <span>Account Withdrawal Notices</span>
                <LayerTag label="Cooperative" />
              </span>
            }
            actions={
              <Button
                onClick={() => setDialog("notice")}
                variant="success"
                icon={<Plus size={14} />}
              >
                Add notice
              </Button>
            }
            resultLabel={`${notices.length} results`}
            pagination={{
              page: noticesCurrentPage,
              totalPages: noticesTotalPages,
              totalItems: notices.length,
              itemLabel: "notices",
              onPageChange: setNoticesPage,
            }}
          >
            <Table>
              <THead>
                {["Notice date", "Amount", "Release Date", "Status"].map((h) => (
                  <Th key={h} style={{ paddingInline: 22 }}>
                    {h}
                  </Th>
                ))}
              </THead>
              <tbody>
                {noticesPageRows.length === 0 ? (
                  <EmptyRow colSpan={4}>No withdrawal notices.</EmptyRow>
                ) : (
                  noticesPageRows.map((n) => (
                    <Tr key={n.id} hover>
                      <Td muted style={{ paddingInline: 22 }}>
                        {n.noticeDate}
                      </Td>
                      <Td numeric style={{ paddingInline: 22, fontWeight: 100 }}>
                        {fmtGHS(n.amount)}
                      </Td>
                      <Td muted style={{ paddingInline: 22 }}>
                        {n.maturityDate}
                      </Td>
                      <Td style={{ paddingInline: 22 }}>
                        <StatusPill status={n.status} />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
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
          paymentTypeOptions={paymentTypeOptions}
          onClose={() => setDialog(null)}
          onSubmit={(result) => {
            applyTxnResult(result.transaction);
            setDialog(null);
          }}
        />
      )}
      {dialog === "debit" && account && (
        <TxnDialog
          kind="debit"
          accountNumber={account.accountNumber}
          paymentTypeOptions={paymentTypeOptions}
          onClose={() => setDialog(null)}
          onSubmit={(result) => {
            applyTxnResult(result.transaction);
            setDialog(null);
          }}
        />
      )}
      {dialog === "notice" && account && (
        <TxnDialog
          kind="notice"
          accountNumber={account.accountNumber}
          paymentTypeOptions={paymentTypeOptions}
          onClose={() => setDialog(null)}
          onSubmit={(result) => {
            applyNoticeResult(result);
            setDialog(null);
          }}
        />
      )}
      {dialog === "transfer" && account && (
        <TransferDialog
          fromAccount={account.accountNumber}
          onClose={() => setDialog(null)}
          onSubmit={(amount) => {
            handleMockTransfer(amount);
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
      <div
        style={{
          fontSize: 10,
          letterSpacing: 1.2,
          color: "rgba(255,255,255,0.55)",
          fontWeight: 100,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          color: "#fff",
          fontSize: 14,
          fontWeight: 300,
          fontFamily: mono ? FONTS.mono : FONTS.body,
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
          <div style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 300 }}>{label}</div>
          <div
            style={{
              fontFamily: FONTS.body,
              fontWeight: 200,
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

function AccountActionItem({
  label,
  color = tokens.text,
  onClick,
}: {
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left hover:bg-slate-50"
      style={{ padding: "8px 10px", borderRadius: 6, fontSize: 13, color }}
    >
      {label}
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
                fontFamily: FONTS.body,
                fontWeight: 100,
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
      <div style={{ fontSize: 11, fontWeight: 300, color: tokens.textSub, marginBottom: 6 }}>
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
  paymentTypeOptions,
  onClose,
  onSubmit,
}: {
  kind: "credit" | "debit" | "notice";
  accountNumber: string;
  paymentTypeOptions: ReferenceValueDto[];
  onClose: () => void;
  onSubmit: (result: MoneyTransactionResultDto) => void;
}) {
  const [amount, setAmount] = useState("");
  const [payType, setPayType] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [posted, setPosted] = useState<TransactionDto | null>(null);

  const isCredit = kind === "credit";
  const isNotice = kind === "notice";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      setErr("Enter a valid amount greater than zero.");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const body = {
        amount: n,
        paymentTypeCode: payType || undefined,
        note: note.trim() || undefined,
        transactionDate: date,
        approvalRequired: isNotice,
      };
      const result = isCredit
        ? await savingsAccountsApi.deposit(accountNumber, body)
        : await savingsAccountsApi.withdrawal(accountNumber, body);
      if (!result) throw new Error("Backend is not reachable right now.");
      setPosted(result.transaction);
      setDone(true);
      setTimeout(() => onSubmit(result), 900);
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong recording this transaction."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell
      title={isNotice ? "Withdrawal Notice" : isCredit ? "Credit Account" : "Debit Account"}
      subtitle={
        <>
          to account{" "}
          <span style={{ fontFamily: FONTS.mono, color: tokens.text }}>{accountNumber}</span>
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
              fontFamily: FONTS.body,
              fontWeight: 100,
              color: tokens.text,
            }}
          >
            {isNotice ? "Notice Submitted" : isCredit ? "Credit Posted" : "Debit Posted"}
          </div>
          <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 4 }}>
            {isNotice
              ? "Awaiting approval before it's released."
              : posted?.runningBalance !== undefined
                ? `New balance: ${fmtGHS(posted.runningBalance)}`
                : "Transaction has been recorded."}
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} style={{ padding: 20 }} className="space-y-4">
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
              <select
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select…</option>
                {paymentTypeOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Transaction Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
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
          <Button
            type="submit"
            disabled={saving}
            full
            variant={isNotice ? "success" : isCredit ? "success" : "danger"}
          >
            {saving ? "Saving…" : isNotice ? "Add Notice" : isCredit ? "Credit" : "Debit"}
          </Button>
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
            style={{ ...inputStyle, fontFamily: FONTS.mono, background: "#EEF2F8" }}
          />
        </Field>
        <Field label="To account" required>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Enter account number"
            style={{ ...inputStyle, fontFamily: FONTS.mono }}
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
        <Button type="submit" disabled={saving} full variant="primary">
          {saving ? "Saving…" : "Transfer"}
        </Button>
      </form>
    </DialogShell>
  );
}
