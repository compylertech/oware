import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, RefreshCw, Landmark, Check, AlertTriangle } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import {
  Panel,
  PanelHead,
  Ava,
  Table,
  Td,
  Th,
  THead,
  Tr,
  fontDisplay,
  fontMono,
} from "@/components/loans/ui";
import {
  fmtGHS,
  loanAccountsApi,
  type LoanAccountDetail,
  type LoanRepaymentPreview,
} from "@/api/loans";
import { useClients } from "@/api/clients";
import { useAuthSession } from "@/api/auth";
import { apiErrorMessage } from "@/api/backend";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";
import { Button, TableCard, EmptyRow } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

const RECENT_COUNT = 5;

export const Route = createFileRoute("/_auth/loans/repayments")({
  component: RepaymentsPage,
});

const EMPTY_PREVIEW: LoanRepaymentPreview = {
  penalty: 0,
  interest: 0,
  fees: 0,
  principal: 0,
  totalApplied: 0,
};

function RepaymentsPage() {
  const clients = useClients();
  const session = useAuthSession();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loan, setLoan] = useState<LoanAccountDetail | null>(null);
  const client = clients.find((c) => c.id === loan?.clientId);

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setSearching(true);
    try {
      const detail = await loanAccountsApi.detail(q);
      if (!detail) {
        setLoan(null);
        setError(`No loan found for "${q}".`);
      } else {
        setLoan(detail);
      }
    } catch (err) {
      setLoan(null);
      setError(apiErrorMessage(err, "Something went wrong looking up this loan."));
    } finally {
      setSearching(false);
    }
  }

  const [method, setMethod] = useState<"MoMo" | "Bank" | "Cash">("MoMo");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [preview, setPreview] = useState<LoanRepaymentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Debounced live allocation preview - re-fetched from the server on every
  // amount change rather than computed locally, since allocation order
  // (penalty > interest > fees > principal) is business logic that lives
  // backend-side.
  useEffect(() => {
    if (!loan) {
      setPreview(null);
      return;
    }
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      loanAccountsApi
        .repaymentPreview(loan.accountNo, n)
        .then((p) => setPreview(p ?? null))
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [amount, loan]);

  const recentKey = loan ? `loan-repayments:${loan.accountNo}` : "";
  const fetchRecent = () =>
    loan
      ? loanAccountsApi.historyDetailed(loan.accountNo, { limit: 500, offset: 0 })
      : Promise.resolve([]);
  const { data: history } = useBackendData(recentKey, fetchRecent);
  const recentRows = (history ?? [])
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, RECENT_COUNT);

  async function handlePostRepayment() {
    if (!loan) return;
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      setPostError("Enter a valid amount greater than zero.");
      return;
    }
    setPostError(null);
    setPosting(true);
    try {
      const teller =
        [session?.user.firstName, session?.user.lastName].filter(Boolean).join(" ") ||
        session?.user.email ||
        "-";
      const isPartial = n < loan.totalOutstanding;
      const note = `${method.toUpperCase()} | ${date} | TELLER: ${teller} | ${isPartial ? "PARTIAL PAYMENT" : "FULL PAYMENT"}`;
      const result = await loanAccountsApi.repayment(loan.accountNo, {
        amount: n,
        transactionDate: date,
        note,
        approvalRequired: false,
      });
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Repayment of ${fmtGHS(n)} posted to ${loan.accountNo}.`);
      setAmount("");
      setPreview(null);
      await refreshBackendData(recentKey, fetchRecent);
      const updated = await loanAccountsApi.detail(loan.accountNo);
      if (updated) setLoan(updated);
    } catch (err) {
      setPostError(apiErrorMessage(err, "Something went wrong posting this repayment."));
    } finally {
      setPosting(false);
    }
  }

  const allocation = preview ?? EMPTY_PREVIEW;

  return (
    <LoansShell>
      <Panel style={{ padding: 18, marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 300,
            color: LOAN.muted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}
        >
          Search a loan account to record a repayment
        </div>
        <form onSubmit={(e) => void handleLookup(e)} className="flex items-stretch gap-2">
          <div
            className="flex items-center gap-2 flex-1"
            style={{
              background: "#F5F8FE",
              border: `1px solid ${LOAN.border}`,
              borderRadius: 10,
              padding: "0 12px",
              maxWidth: 420,
            }}
          >
            <Landmark size={16} color={LOAN.muted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter loan account number"
              className="flex-1 bg-transparent outline-none"
              style={{ ...fontMono, fontSize: 13, color: LOAN.ink, height: 40 }}
            />
          </div>
          <Button
            type="submit"
            disabled={searching || !query.trim()}
            icon={
              searching ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />
            }
          >
            {searching ? "Searching…" : "Look Up"}
          </Button>
        </form>
        {error && (
          <div
            style={{
              marginTop: 12,
              background: "#FEF3F2",
              border: "1px solid #FECDCA",
              color: "#B42318",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              maxWidth: 420,
            }}
          >
            {error}
          </div>
        )}
      </Panel>

      {!loan ? (
        <Panel style={{ padding: 48, textAlign: "center" }}>
          <Landmark size={32} color={LOAN.muted} className="mx-auto" />
          <div style={{ fontSize: 14, color: LOAN.muted, marginTop: 10 }}>
            Search a loan account above to record a repayment.
          </div>
        </Panel>
      ) : (
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
                <Ava name={client?.name ?? loan.accountNo} bg="#DC2626" size={36} />
                <div>
                  <div style={{ ...fontMono, fontSize: 12, fontWeight: 100, color: LOAN.navy }}>
                    {loan.accountNo}
                  </div>
                  <div style={{ fontSize: 12, color: LOAN.ink }}>
                    {client?.name ?? "-"} · {loan.productName}
                  </div>
                </div>
                <div className="ml-auto" style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: LOAN.muted }}>Outstanding</div>
                  <div style={{ fontSize: 13, fontWeight: 100, color: LOAN.ink }}>
                    {fmtGHS(loan.totalOutstanding)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    style={inputCss}
                  />
                </Field>
                <Field label="Value date">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={inputCss}
                  />
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
                    <Button
                      type="button"
                      key={m}
                      onClick={() => setMethod(m)}
                      variant={method === m ? "primary" : "outline"}
                      size="sm"
                      style={{
                        borderRadius: 0,
                      }}
                    >
                      {m}
                    </Button>
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
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 100,
                      color: LOAN.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Allocation preview
                  </div>
                  {previewLoading && (
                    <RefreshCw size={12} className="animate-spin" color={LOAN.muted} />
                  )}
                </div>
                {(
                  [
                    ["Penalty", allocation.penalty],
                    ["Interest", allocation.interest],
                    ["Fees", allocation.fees],
                    ["Principal", allocation.principal],
                  ] as const
                ).map(([l, v]) => (
                  <div
                    key={l}
                    className="flex justify-between"
                    style={{ fontSize: 12, padding: "4px 0", color: LOAN.ink }}
                  >
                    <span>{l}</span>
                    <span>{fmtGHS(v)}</span>
                  </div>
                ))}
                <div
                  style={{ borderTop: `1px dashed ${LOAN.border}`, marginTop: 6, paddingTop: 8 }}
                  className="flex justify-between"
                >
                  <span style={{ fontSize: 12, fontWeight: 100, color: LOAN.ink }}>Total</span>
                  <span style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
                    {fmtGHS(allocation.totalApplied)}
                  </span>
                </div>
              </div>

              {postError && (
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
                  {postError}
                </div>
              )}

              <Button
                variant="success"
                full
                disabled={posting}
                onClick={() => void handlePostRepayment()}
              >
                {posting ? "Posting…" : "Post Repayment"}
              </Button>
            </div>
          </Panel>

          <TableCard title="Recent Repayments" resultLabel={`Last ${recentRows.length}`}>
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th style={{ textAlign: "right" }}>Amount</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {recentRows.length === 0 ? (
                  <EmptyRow colSpan={4}>No transactions yet.</EmptyRow>
                ) : (
                  recentRows.map((r) => (
                    <Tr key={r.id} hover>
                      <Td>{r.date}</Td>
                      <Td>{r.type}</Td>
                      <Td style={{ textAlign: "right", fontWeight: 100 }}>{fmtGHS(r.amount)}</Td>
                      <Td>
                        <StatusPill
                          label={r.reversed ? "Reversed" : "Completed"}
                          tone={r.reversed ? "red" : "green"}
                          icon={r.reversed ? <AlertTriangle size={12} /> : <Check size={12} />}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
        </div>
      )}
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
          fontWeight: 300,
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
