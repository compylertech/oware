import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Send, Plus } from "lucide-react";
import { LOAN, tokens } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import {
  Panel,
  PanelHead,
  Chip,
  Ava,
  Table,
  THead,
  Tr,
  Th,
  Td,
  fontDisplay,
  fontMono,
} from "@/components/loans/ui";
import { fmtGHS, loanAccountsApi, loanReportsApi } from "@/api/loans";
import { apiErrorMessage, clientsApi, referencesApi, type ReferenceValueDto } from "@/api/backend";
import { useClients, type Client } from "@/api/clients";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";
import { Tabs, Button, TableCard, EmptyRow, PAGE_SIZE_OPTIONS } from "@/components/patterns";
import { StatusPill, type Tone } from "@/components/common/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";

type FromTab = "active" | "disbursements" | "applications" | "approvals" | "arrears";
const FROM_TABS: FromTab[] = ["active", "disbursements", "applications", "approvals", "arrears"];

export const Route = createFileRoute("/_auth/loans/$loanId")({
  component: LoanDetail,
  validateSearch: (search: Record<string, unknown>): { from?: FromTab } => ({
    from: FROM_TABS.includes(search.from as FromTab) ? (search.from as FromTab) : undefined,
  }),
});

const BACK_TO: Record<FromTab, string> = {
  active: "/loans/active",
  disbursements: "/loans/disbursements",
  applications: "/loans/applications",
  approvals: "/loans/approvals",
  arrears: "/loans/arrears",
};
const BACK_LABEL: Record<FromTab, string> = {
  active: "Back to Active Loans",
  disbursements: "Back to Disbursements",
  applications: "Back to Applications",
  approvals: "Back to Approvals",
  arrears: "Back to Arrears & PAR",
};

const REPAYMENT_STATUS_TONE: Record<string, Tone> = {
  Paid: "green",
  Overdue: "red",
  Upcoming: "blue",
};

function loanStatusTone(status: string): Tone {
  const s = status.toUpperCase();
  if (s.includes("ACTIVE")) return "green";
  if (s.includes("OVERDUE") || s.includes("ARREAR") || s.includes("REJECT")) return "red";
  if (s.includes("APPROV") || s.includes("PENDING") || s.includes("SUBMIT")) return "amber";
  if (s.includes("CLOS") || s.includes("WITHDRAW")) return "gray";
  return "blue";
}

// The backend's own enum strings (status: "SUBMITTED_PENDING_APPROVAL",
// transactionProcessingStrategyCode: "mifos-standard-strategy") are internal
// codes, not display copy - "SUBMITTED_PENDING_APPROVAL" → "Submitted
// Pending Approval". Status/gating logic elsewhere still compares against
// the raw code; this is display-only.
function humanize(code: string): string {
  return code
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// transactionProcessingStrategyCode names a repayment-allocation order, not a
// product feature - "Mifos Standard Strategy" tells you nothing about what
// actually happens to a payment. Only "mifos-standard-strategy" has been seen
// live on this deployment; its order is Fineract's own documented default
// (penalties first, principal last - a payment doesn't touch principal until
// penalties/fees/interest owed are cleared). Anything else falls back to the
// humanized code rather than guessing at an order that hasn't been confirmed.
const REPAYMENT_STRATEGY_ORDER: Record<string, string> = {
  "mifos-standard-strategy": "Penalties → Fees → Interest → Principal",
};

function repaymentStrategyLabel(code: string): string {
  return REPAYMENT_STRATEGY_ORDER[code] ?? humanize(code);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const today = () => new Date().toISOString().slice(0, 10);

// A loan's four lifecycle dates are a real sequence (each only ever gets set
// after the one before it), so a connecting-line stepper reads that order at
// a glance - a flat table just lists the same four dates with no sense of
// where the loan actually is right now.
type LifecycleStep = { label: string; date: string | null; sub?: string };

function LifecycleTimeline({ steps }: { steps: LifecycleStep[] }) {
  return (
    <div className="flex items-start">
      {steps.map((s, i) => {
        const done = !!s.date;
        const isLast = i === steps.length - 1;
        return (
          <div
            key={s.label}
            className="flex items-start"
            style={{ flex: isLast ? "0 0 auto" : "1 1 0" }}
          >
            <div className="flex flex-col items-center" style={{ width: 100 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  flexShrink: 0,
                  background: done ? LOAN.green : "#fff",
                  border: `2px solid ${done ? LOAN.green : LOAN.border}`,
                  color: done ? "#fff" : LOAN.muted,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: done ? LOAN.ink : LOAN.muted,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2, textAlign: "center" }}>
                {s.date ? fmtDate(s.date) : (s.sub ?? "-")}
              </div>
            </div>
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginTop: 13,
                  background: done ? LOAN.green : LOAN.border,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "11px 18px", borderBottom: `1px solid ${LOAN.border}`, fontSize: 13 }}
    >
      <span style={{ color: LOAN.muted }}>{label}</span>
      <span style={{ color: LOAN.ink, fontWeight: 300, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function LoanDetail() {
  const { loanId } = Route.useParams();
  const { from } = Route.useSearch();
  // Where the "Back" link and highlighted tab in LoansShell point to is
  // whatever page the user actually came from, not a hardcoded default.
  const backTo = BACK_TO[from ?? "active"];
  const backLabel = BACK_LABEL[from ?? "active"];

  const [tab, setTab] = useState<"application" | "schedule" | "transactions" | "collateral">(
    "application",
  );
  const clients = useClients();

  const loanKey = `loan-detail:${loanId}`;
  const fetchLoan = () => loanAccountsApi.detail(loanId);
  const { data: loan } = useBackendData(loanKey, fetchLoan);
  const client = clients.find((c) => c.id === loan?.clientId);

  const [schedulePage, setSchedulePage] = useState(1);
  const [schedulePageSize, setSchedulePageSize] = useState(10);
  // The backend doesn't actually honor limit/offset here (confirmed live -
  // full result returned regardless), so we still send them per spec but
  // paginate the result client-side.
  const { data: schedule } = useBackendData(`loan-detail:${loanId}:schedule`, () =>
    loanAccountsApi.repaymentScheduleDetailed(loanId, { limit: 500, offset: 0 }),
  );
  const periods = schedule?.periods ?? [];
  const scheduleTotalPages = Math.max(1, Math.ceil(periods.length / schedulePageSize));
  const scheduleCurrentPage = Math.min(schedulePage, scheduleTotalPages);
  const schedulePageRows = periods.slice(
    (scheduleCurrentPage - 1) * schedulePageSize,
    scheduleCurrentPage * schedulePageSize,
  );

  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);
  const { data: txData } = useBackendData(`loan-detail:${loanId}:transactions`, () =>
    loanAccountsApi.historyDetailed(loanId, { limit: 500, offset: 0 }),
  );
  const transactions = txData ?? [];
  const txTotalPages = Math.max(1, Math.ceil(transactions.length / txPageSize));
  const txCurrentPage = Math.min(txPage, txTotalPages);
  const txPageRows = transactions.slice(
    (txCurrentPage - 1) * txPageSize,
    txCurrentPage * txPageSize,
  );

  // Collateral & Guarantors - attached to this one loan, so it lives as a
  // tab here rather than a separate page you'd have to look the loan up on
  // again (that page used to require re-entering the account number).
  const guarantorsKey = loan ? `loan-guarantors:${loan.accountNo}` : "";
  const fetchGuarantors = () =>
    loan ? loanAccountsApi.guarantors(loan.accountNo) : Promise.resolve([]);
  const { data: guarantors } = useBackendData(guarantorsKey, fetchGuarantors);

  const collateralsKey = loan ? `loan-collaterals:${loan.accountNo}` : "";
  const fetchCollaterals = () =>
    loan ? loanAccountsApi.collaterals(loan.accountNo) : Promise.resolve([]);
  const { data: collaterals } = useBackendData(collateralsKey, fetchCollaterals);

  const [collateralTypeOptions, setCollateralTypeOptions] = useState<ReferenceValueDto[]>([]);
  useEffect(() => {
    void referencesApi.list("COLLATERAL_TYPE").then(setCollateralTypeOptions);
  }, []);
  const collateralTypeName = (code: string) =>
    collateralTypeOptions.find((o) => o.code === code)?.name ?? code;

  const [addDialog, setAddDialog] = useState<null | "guarantor" | "collateral">(null);

  // Approve/Reject/Disburse - shown only when the loan is actually in that
  // stage, so this one view carries the loan through its whole lifecycle
  // instead of sending you to Approvals or Disbursements to act on it.
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | "disburse" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function onConfirmAction() {
    if (!confirmAction || !loan) return;
    setBusy(true);
    try {
      if (confirmAction === "approve") {
        await loanAccountsApi.approve(loan.accountNo, { actionDate: today() });
        toast.success("Loan approved.");
      } else if (confirmAction === "reject") {
        await loanAccountsApi.reject(loan.accountNo, { actionDate: today() });
        toast.success("Loan rejected.");
      } else {
        await loanAccountsApi.disburse(loan.accountNo, { actionDate: today() });
        toast.success("Loan disbursed.");
      }
      const refreshes: Promise<unknown>[] = [refreshBackendData(loanKey, fetchLoan)];
      if (confirmAction === "approve" || confirmAction === "reject") {
        refreshes.push(
          refreshBackendData("loans:approvals", () => loanReportsApi.approvals({ limit: 500 })),
          refreshBackendData("loans:applications-total", () => loanReportsApi.applicationsTotal()),
        );
      } else {
        refreshes.push(
          refreshBackendData("loans:disbursements:::", () =>
            loanReportsApi.disbursements({ limit: 500 }),
          ),
          refreshBackendData("loans:active:", () => loanReportsApi.active({ limit: 500 })),
        );
      }
      await Promise.all(refreshes);
      setConfirmAction(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const canApprove = loan?.status === "SUBMITTED_PENDING_APPROVAL";
  const canDisburse = loan?.status === "APPROVED";

  return (
    <LoansShell>
      <div className="flex items-center justify-between flex-wrap" style={{ marginBottom: 14 }}>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2"
          style={{ color: tokens.textSub, fontSize: 12, fontWeight: 300 }}
        >
          <ArrowLeft size={14} /> {backLabel}
        </Link>
        {loan && (
          <div className="flex items-center gap-2">
            <StatusPill label={humanize(loan.status)} tone={loanStatusTone(loan.status)} />
            {canApprove && (
              <>
                <Button
                  variant="dangerOutline"
                  size="sm"
                  icon={<X size={14} />}
                  onClick={() => setConfirmAction("reject")}
                >
                  Reject
                </Button>
                <Button
                  variant="successOutline"
                  size="sm"
                  icon={<Check size={14} />}
                  onClick={() => setConfirmAction("approve")}
                >
                  Approve
                </Button>
              </>
            )}
            {canDisburse && (
              <Button
                variant="success"
                size="sm"
                icon={<Send size={14} />}
                onClick={() => setConfirmAction("disburse")}
              >
                Disburse
              </Button>
            )}
          </div>
        )}
      </div>

      {!loan ? (
        <Skeleton className="h-20 w-full" style={{ marginBottom: 14, borderRadius: 14 }} />
      ) : (
        <Panel style={{ padding: 18, marginBottom: 14 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <Ava name={client?.name ?? loan.accountNo} size={48} />
            <div>
              <div style={{ ...fontDisplay, fontSize: 20, fontWeight: 200, color: LOAN.ink }}>
                Loan: {loan.accountNo}
              </div>
              <div style={{ fontSize: 12, color: LOAN.muted, marginTop: 2 }}>
                {client?.name ?? "-"} · {loan.productName}
              </div>
            </div>
            <div className="ml-auto" style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: LOAN.muted }}>Outstanding</div>
              <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
                {fmtGHS(loan.totalOutstanding)}
              </div>
            </div>
          </div>
        </Panel>
      )}

      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "application", label: "Application" },
          { key: "schedule", label: "Repayment Schedule" },
          { key: "transactions", label: "Transactions" },
          { key: "collateral", label: "Collateral & Guarantors" },
        ]}
      />

      {tab === "application" ? (
        !loan ? (
          <TableSkeleton title="Application" />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <Chip label="Principal" value={fmtGHS(loan.principal)} />
              <Chip
                label="Interest Rate"
                value={`${loan.interestRatePerPeriod}%`}
                meta={loan.interestRateFrequencyType}
              />
              <Chip
                label="Term"
                value={`${loan.loanTermFrequency} ${loan.loanTermFrequencyType}`}
              />
              <Chip
                label="Repayments"
                value={loan.numberOfRepayments}
                meta={`every ${loan.repaymentEvery} ${loan.repaymentFrequencyType}`}
              />
            </div>

            <Panel style={{ padding: "20px 24px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: LOAN.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: 18,
                }}
              >
                Lifecycle
              </div>
              <LifecycleTimeline
                steps={[
                  { label: "Submitted", date: loan.submittedOnDate },
                  { label: "Approved", date: loan.approvedOnDate },
                  {
                    label: "Disbursed",
                    date: loan.actualDisbursementDate,
                    sub: loan.expectedDisbursementDate
                      ? `Expected ${fmtDate(loan.expectedDisbursementDate)}`
                      : undefined,
                  },
                  { label: "Closed", date: loan.closedOnDate },
                ]}
              />
            </Panel>

            <Panel style={{ overflow: "hidden" }}>
              <PanelHead title="Loan Terms" />
              <DetailRow label="Loan Type" value={loan.loanType || "-"} />
              <DetailRow
                label="Approved Principal"
                value={loan.approvedPrincipal != null ? fmtGHS(loan.approvedPrincipal) : "-"}
              />
              <DetailRow
                label="Disbursed Principal"
                value={loan.disbursedPrincipal != null ? fmtGHS(loan.disbursedPrincipal) : "-"}
              />
              <DetailRow label="Amortization" value={loan.amortizationType || "-"} />
              <DetailRow label="Interest Method" value={loan.interestType || "-"} />
              <DetailRow
                label="Interest Calculation"
                value={loan.interestCalculationPeriodType || "-"}
              />
              <DetailRow
                label="Repayment Strategy"
                value={
                  loan.transactionProcessingStrategyCode
                    ? repaymentStrategyLabel(loan.transactionProcessingStrategyCode)
                    : "-"
                }
              />
              {loan.externalId && (
                <DetailRow
                  label="External ID"
                  value={<span style={fontMono}>{loan.externalId}</span>}
                />
              )}
            </Panel>
          </div>
        )
      ) : tab === "schedule" ? (
        !schedule ? (
          <TableSkeleton title="Repayment Schedule" />
        ) : (
          <TableCard
            title="Repayment Schedule"
            resultLabel={`${periods.length} periods`}
            pagination={{
              page: scheduleCurrentPage,
              totalPages: scheduleTotalPages,
              totalItems: periods.length,
              itemLabel: "periods",
              onPageChange: setSchedulePage,
              pageSize: schedulePageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageSizeChange: (size) => {
                setSchedulePageSize(size);
                setSchedulePage(1);
              },
            }}
          >
            <Table>
              <THead>
                <Th style={{ textAlign: "right" }}>No.</Th>
                <Th>Due Date</Th>
                <Th style={{ textAlign: "right" }}>Principal</Th>
                <Th style={{ textAlign: "right" }}>Interest</Th>
                <Th style={{ textAlign: "right" }}>Total Due</Th>
                <Th style={{ textAlign: "right" }}>Total Paid</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {schedulePageRows.length === 0 ? (
                  <EmptyRow colSpan={7}>No repayment schedule available.</EmptyRow>
                ) : (
                  schedulePageRows.map((p) => (
                    <Tr key={p.periodNumber} hover>
                      <Td style={{ textAlign: "right" }}>{p.periodNumber}</Td>
                      <Td>{p.dueDate}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(p.principal)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(p.interest)}</Td>
                      <Td style={{ textAlign: "right", fontWeight: 100 }}>{fmtGHS(p.total)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(p.totalPaid)}</Td>
                      <Td>
                        <StatusPill label={p.status} tone={REPAYMENT_STATUS_TONE[p.status]} />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
        )
      ) : tab === "transactions" ? (
        !txData ? (
          <TableSkeleton title="Transactions" />
        ) : (
          <TableCard
            title="Transactions"
            resultLabel={`${transactions.length} transactions`}
            pagination={{
              page: txCurrentPage,
              totalPages: txTotalPages,
              totalItems: transactions.length,
              itemLabel: "transactions",
              onPageChange: setTxPage,
              pageSize: txPageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageSizeChange: (size) => {
                setTxPageSize(size);
                setTxPage(1);
              },
            }}
          >
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th style={{ textAlign: "right" }}>Amount</Th>
                <Th style={{ textAlign: "right" }}>Principal</Th>
                <Th style={{ textAlign: "right" }}>Interest</Th>
                <Th style={{ textAlign: "right" }}>Fees</Th>
                <Th style={{ textAlign: "right" }}>Penalty</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {txPageRows.length === 0 ? (
                  <EmptyRow colSpan={8}>No transactions yet.</EmptyRow>
                ) : (
                  txPageRows.map((t) => (
                    <Tr key={t.id} hover>
                      <Td>{t.date}</Td>
                      <Td>{t.type}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(t.amount)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(t.principal)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(t.interest)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(t.fees)}</Td>
                      <Td style={{ textAlign: "right" }}>{fmtGHS(t.penalty)}</Td>
                      <Td>
                        <StatusPill
                          label={t.reversed ? "Reversed" : "Completed"}
                          tone={t.reversed ? "gray" : "green"}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
        )
      ) : (
        <>
          <TableCard
            title="Guarantors"
            resultLabel={`${guarantors?.length ?? 0} guarantors`}
            actions={
              <Button
                variant="success"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setAddDialog("guarantor")}
              >
                Add Guarantor
              </Button>
            }
          >
            <Table>
              <THead>
                <Th>Guarantor</Th>
                <Th>Type</Th>
                <Th>Relationship</Th>
                <Th>Office</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {!guarantors ? (
                  <EmptyRow colSpan={6}>Loading guarantors…</EmptyRow>
                ) : guarantors.length === 0 ? (
                  <EmptyRow colSpan={6}>No guarantors on this loan yet.</EmptyRow>
                ) : (
                  guarantors.map((g) => (
                    <Tr key={g.id} hover>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Ava name={g.name} size={28} />
                          <span style={{ fontWeight: 300 }}>{g.name}</span>
                        </div>
                      </Td>
                      <Td>{g.guarantorType}</Td>
                      <Td>{g.relationshipType}</Td>
                      <Td style={{ color: LOAN.muted }}>{g.officeName}</Td>
                      <Td style={{ color: LOAN.muted }}>{g.joinedDate || "-"}</Td>
                      <Td>
                        <StatusPill
                          label={g.active ? "Active" : "Inactive"}
                          tone={g.active ? "green" : "gray"}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>

          <div className="mt-4">
            <TableCard
              title="Collateral"
              resultLabel={`${collaterals?.length ?? 0} collateral items`}
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setAddDialog("collateral")}
                >
                  Add Collateral
                </Button>
              }
            >
              <Table>
                <THead>
                  <Th>Type</Th>
                  <Th>Value</Th>
                  <Th>Description</Th>
                </THead>
                <tbody>
                  {!collaterals ? (
                    <EmptyRow colSpan={3}>Loading collateral…</EmptyRow>
                  ) : collaterals.length === 0 ? (
                    <EmptyRow colSpan={3}>No collateral on this loan yet.</EmptyRow>
                  ) : (
                    collaterals.map((c) => (
                      <Tr key={c.collateralId} hover>
                        <Td style={{ fontWeight: 300 }}>
                          {collateralTypeName(c.collateralTypeCode)}
                        </Td>
                        <Td>{fmtGHS(c.value)}</Td>
                        <Td style={{ color: LOAN.muted }}>{c.description || "-"}</Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          </div>
        </>
      )}

      {confirmAction && loan && (
        <ActionConfirmDialog
          action={confirmAction}
          loan={loan}
          clientName={client?.name}
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void onConfirmAction()}
        />
      )}

      {addDialog === "guarantor" && loan && (
        <AddGuarantorDialog
          loanAccountNo={loan.accountNo}
          onClose={() => setAddDialog(null)}
          onAdded={() => {
            setAddDialog(null);
            void refreshBackendData(guarantorsKey, fetchGuarantors);
          }}
        />
      )}
      {addDialog === "collateral" && loan && (
        <AddCollateralDialog
          loanAccountNo={loan.accountNo}
          collateralTypeOptions={collateralTypeOptions}
          onClose={() => setAddDialog(null)}
          onAdded={() => {
            setAddDialog(null);
            void refreshBackendData(collateralsKey, fetchCollaterals);
          }}
        />
      )}
    </LoansShell>
  );
}

/** Rough placeholder for a table's content while the first-ever load is in
 * flight - never a fixture standing in for real rows. */
function TableSkeleton({ title }: { title: string }) {
  return (
    <TableCard title={title}>
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </TableCard>
  );
}

// ---------- Approve / Reject / Disburse confirmation ----------

const ACTION_COPY: Record<
  "approve" | "reject" | "disburse",
  { title: string; verb: string; button: string; variant: "success" | "danger" }
> = {
  approve: { title: "Approve loan?", verb: "approve", button: "Approve", variant: "success" },
  reject: { title: "Reject loan?", verb: "reject", button: "Reject", variant: "danger" },
  disburse: { title: "Disburse loan?", verb: "disburse", button: "Disburse", variant: "success" },
};

function ActionConfirmDialog({
  action,
  loan,
  clientName,
  busy,
  onCancel,
  onConfirm,
}: {
  action: "approve" | "reject" | "disburse";
  loan: { accountNo: string; productName?: string; principal?: number };
  clientName?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = ACTION_COPY[action];
  return (
    <div
      onClick={busy ? undefined : onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.45)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, padding: 24, width: 400, maxWidth: "100%" }}
      >
        <div style={{ fontSize: 17, fontWeight: 200, color: LOAN.ink }}>{copy.title}</div>
        <p style={{ fontSize: 13, color: LOAN.muted, marginTop: 8, lineHeight: 1.5 }}>
          This will {copy.verb} {clientName ?? "this client"}&rsquo;s {loan.productName ?? "loan"}{" "}
          application, account <span style={fontMono}>{loan.accountNo}</span>.
        </p>
        <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={copy.variant}
            icon={action === "reject" ? <X size={14} /> : <Check size={14} />}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Saving…" : copy.button}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Add Guarantor / Add Collateral (moved from the old standalone
// Collateral & Guarantors page - the loan is already known here, so there's
// no need to search a loan account number to attach either one to) ----------

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
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
          border: `1px solid ${LOAN.border}`,
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: `1px solid ${LOAN.border}` }}
        >
          <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
            {title}
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: LOAN.muted }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 300, color: LOAN.muted, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputCss: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid ${LOAN.border}`,
  borderRadius: 8,
  fontSize: 13,
  background: "#F5F8FE",
};

function AddGuarantorDialog({
  loanAccountNo,
  onClose,
  onAdded,
}: {
  loanAccountNo: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [guarantorTypeOptions, setGuarantorTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<ReferenceValueDto[]>([]);
  useEffect(() => {
    void referencesApi.list("GUARANTOR_TYPE").then(setGuarantorTypeOptions);
    void referencesApi.list("CLIENT_RELATIONSHIP_TYPE").then(setRelationshipOptions);
  }, []);

  const [guarantorTypeCode, setGuarantorTypeCode] = useState("CUSTOMER");
  const [clientRelationshipTypeCode, setClientRelationshipTypeCode] = useState("");
  const [amount, setAmount] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // "CUSTOMER" guarantors are an existing client of the bank - resolve
  // entityId via the same fineractClientId used elsewhere in the app, rather
  // than asking for a raw numeric id no one would actually know.
  const isCustomer = guarantorTypeCode === "CUSTOMER";
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [pickedClient, setPickedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!isCustomer) {
      setClientResults([]);
      return;
    }
    const q = clientQuery.trim();
    if (!q || pickedClient) {
      setClientResults([]);
      return;
    }
    setSearchingClients(true);
    const timer = setTimeout(() => {
      clientsApi
        .search({ keyword: q, size: 8 })
        .then(setClientResults)
        .finally(() => setSearchingClients(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [clientQuery, isCustomer, pickedClient]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedEntityId = isCustomer
      ? pickedClient?.fineractClientId
      : parseInt(entityId, 10) || undefined;
    if (!resolvedEntityId) {
      setErr(isCustomer ? "Search and select a client." : "Enter a valid entity id.");
      return;
    }
    if (!clientRelationshipTypeCode) {
      setErr("Select a relationship type.");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const result = await loanAccountsApi.addGuarantor(loanAccountNo, {
        guarantorTypeCode,
        clientRelationshipTypeCode,
        entityId: resolvedEntityId,
        amount: amount ? parseFloat(amount) : undefined,
      });
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success("Guarantor added.");
      onAdded();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong adding this guarantor."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Add Guarantor" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} style={{ padding: 20 }} className="space-y-4">
        <Field label="Guarantor Type">
          <select
            value={guarantorTypeCode}
            onChange={(e) => {
              setGuarantorTypeCode(e.target.value);
              setPickedClient(null);
              setEntityId("");
            }}
            style={inputCss}
          >
            {guarantorTypeOptions.length === 0 && <option value="CUSTOMER">Customer</option>}
            {guarantorTypeOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        {isCustomer ? (
          <Field label="Guarantor (existing client)">
            {pickedClient ? (
              <div
                className="flex items-center justify-between"
                style={{ ...inputCss, height: "auto", padding: "8px 12px" }}
              >
                <span>{pickedClient.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPickedClient(null);
                    setClientQuery("");
                  }}
                  style={{ color: LOAN.blue, fontSize: 12 }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Search clients…"
                  style={inputCss}
                />
                {clientQuery.trim() && (
                  <div
                    className="absolute z-10 bg-white"
                    style={{
                      top: 40,
                      left: 0,
                      right: 0,
                      border: `1px solid ${LOAN.border}`,
                      borderRadius: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {searchingClients ? (
                      <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>Searching…</div>
                    ) : clientResults.length === 0 ? (
                      <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>
                        No clients found.
                      </div>
                    ) : (
                      clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setPickedClient(c);
                            setClientQuery("");
                          }}
                          className="block w-full text-left"
                          style={{ padding: 8, borderBottom: `1px solid ${LOAN.border}` }}
                        >
                          <div style={{ fontSize: 13 }}>{c.name}</div>
                          <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>
                            {c.clientNumber}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>
        ) : (
          <Field label="Entity ID">
            <input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={
                guarantorTypeCode === "STAFF" ? "Staff numeric id" : "External entity id"
              }
              style={inputCss}
            />
          </Field>
        )}

        <Field label="Relationship">
          <select
            value={clientRelationshipTypeCode}
            onChange={(e) => setClientRelationshipTypeCode(e.target.value)}
            style={inputCss}
          >
            <option value="">Select…</option>
            {relationshipOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amount guaranteed (optional)">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            style={inputCss}
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

        <Button type="submit" disabled={saving} full variant="success">
          {saving ? "Saving…" : "Add Guarantor"}
        </Button>
      </form>
    </DialogShell>
  );
}

function AddCollateralDialog({
  loanAccountNo,
  collateralTypeOptions,
  onClose,
  onAdded,
}: {
  loanAccountNo: string;
  collateralTypeOptions: ReferenceValueDto[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [collateralTypeCode, setCollateralTypeCode] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!collateralTypeCode && collateralTypeOptions.length > 0) {
      setCollateralTypeCode(collateralTypeOptions[0].code);
    }
  }, [collateralTypeOptions, collateralTypeCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(value);
    if (!collateralTypeCode) {
      setErr("Select a collateral type.");
      return;
    }
    if (!n || n <= 0) {
      setErr("Enter a valid value greater than zero.");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const result = await loanAccountsApi.addCollateral(loanAccountNo, {
        collateralTypeCode,
        value: n,
        description: description.trim() || undefined,
      });
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success("Collateral added.");
      onAdded();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong adding this collateral."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Add Collateral" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} style={{ padding: 20 }} className="space-y-4">
        <Field label="Collateral Type">
          <select
            value={collateralTypeCode}
            onChange={(e) => setCollateralTypeCode(e.target.value)}
            style={inputCss}
          >
            {collateralTypeOptions.length === 0 && <option value="">Loading…</option>}
            {collateralTypeOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Value">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            style={inputCss}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional"
            style={{ ...inputCss, height: "auto", padding: 10, resize: "vertical" }}
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

        <Button type="submit" disabled={saving} full variant="success">
          {saving ? "Saving…" : "Add Collateral"}
        </Button>
      </form>
    </DialogShell>
  );
}
