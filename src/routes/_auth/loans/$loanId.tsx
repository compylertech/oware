import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, Ava, Table, THead, Tr, Th, Td, fontDisplay } from "@/components/loans/ui";
import { fmtGHS, loanAccountsApi } from "@/api/loans";
import { useClients } from "@/api/clients";
import { useBackendData } from "@/api/useBackendData";
import { Tabs, TableCard, EmptyRow, PAGE_SIZE_OPTIONS } from "@/components/patterns";
import { StatusPill, type Tone } from "@/components/common/StatusPill";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/loans/$loanId")({
  component: LoanDetail,
  validateSearch: (
    search: Record<string, unknown>,
  ): { from?: "active" | "disbursements" } => ({
    from:
      search.from === "disbursements"
        ? "disbursements"
        : search.from === "active"
          ? "active"
          : undefined,
  }),
});

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

function LoanDetail() {
  const { loanId } = Route.useParams();
  const { from } = Route.useSearch();
  // Where the "Back" link and highlighted tab in LoansShell point to is
  // whatever page the user actually came from, not a hardcoded default.
  const backTo = from === "disbursements" ? "/loans/disbursements" : "/loans/active";
  const backLabel = from === "disbursements" ? "Back to Disbursements" : "Back to Active Loans";

  const [tab, setTab] = useState<"schedule" | "transactions">("schedule");
  const clients = useClients();

  const { data: loan } = useBackendData(`loan-detail:${loanId}`, () =>
    loanAccountsApi.detail(loanId),
  );
  const client = clients.find((c) => c.id === loan?.clientId);

  const [schedulePage, setSchedulePage] = useState(1);
  const [schedulePageSize, setSchedulePageSize] = useState(10);
  // The backend doesn't actually honor limit/offset here (confirmed live —
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

  return (
    <LoansShell>
      <Link
        to={backTo}
        className="inline-flex items-center gap-2"
        style={{ color: LOAN.blue, fontSize: 12, fontWeight: 300, marginBottom: 14 }}
      >
        <ArrowLeft size={14} /> {backLabel}
      </Link>

      {!loan ? (
        <Skeleton className="h-20 w-full" style={{ marginBottom: 14, borderRadius: 14 }} />
      ) : (
        <Panel style={{ padding: 18, marginBottom: 14 }}>
          <div className="flex items-center gap-3">
            <Ava name={client?.name ?? loan.accountNo} size={48} />
            <div>
              <div style={{ ...fontDisplay, fontSize: 20, fontWeight: 200, color: LOAN.ink }}>
                Loan: {loan.accountNo}
              </div>
              <div style={{ fontSize: 12, color: LOAN.muted, marginTop: 2 }}>
                {client?.name ?? "—"} · {loan.productName}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: LOAN.muted }}>Outstanding</div>
                <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
                  {fmtGHS(loan.totalOutstanding)}
                </div>
              </div>
              <StatusPill label={loan.status} tone={loanStatusTone(loan.status)} />
            </div>
          </div>
        </Panel>
      )}

      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "schedule", label: "Repayment Schedule" },
          { key: "transactions", label: "Transactions" },
        ]}
      />

      {tab === "schedule" ? (
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
      ) : !txData ? (
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
      )}
    </LoansShell>
  );
}

/** Rough placeholder for a table's content while the first-ever load is in
 * flight — never a fixture standing in for real rows. */
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
