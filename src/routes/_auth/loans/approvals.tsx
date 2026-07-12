import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Table, Td, Th, THead, Tr, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS, loanAccountsApi, loanReportsApi, type ApprovalRow } from "@/api/loans";
import { apiErrorMessage } from "@/api/backend";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";
import { Tabs, Button, TableCard, EmptyRow, PAGE_SIZE_OPTIONS } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_auth/loans/approvals")({
  component: ApprovalsPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function ApprovalsPage() {
  const [tab, setTab] = useState<"my" | "history">("my");
  const [confirm, setConfirm] = useState<{ row: ApprovalRow; action: "approve" | "reject" } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data } = useBackendData("loans:approvals", () => loanReportsApi.approvals({ limit: 500 }));
  const rows = data?.rows ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const { data: historyData } = useBackendData("loans:approvals-history", () =>
    loanReportsApi.applications({ stage: "approved", limit: 500 }),
  );
  const history = historyData ?? [];
  const historyTotalPages = Math.max(1, Math.ceil(history.length / historyPageSize));
  const historyCurrentPage = Math.min(historyPage, historyTotalPages);
  const historyPageRows = history.slice(
    (historyCurrentPage - 1) * historyPageSize,
    historyCurrentPage * historyPageSize,
  );

  async function onConfirmAction() {
    if (!confirm) return;
    const { row, action } = confirm;
    setBusy(true);
    try {
      if (action === "approve") {
        await loanAccountsApi.approve(row.accountNo, { actionDate: today() });
        toast.success(`Approved ${row.client}'s ${row.product} loan.`);
      } else {
        await loanAccountsApi.reject(row.accountNo, { actionDate: today() });
        toast.success(`Rejected ${row.client}'s ${row.product} loan.`);
      }
      // Re-fetch rather than just filtering the row out locally, so every
      // reader of these keys (this page's queue/history tabs, and the
      // sidebar's "My queue" badge) reflects the real post-action state —
      // not just this one component's optimism.
      const refreshes: Promise<unknown>[] = [
        refreshBackendData("loans:approvals", () => loanReportsApi.approvals({ limit: 500 })),
      ];
      if (action === "approve") {
        refreshes.push(
          refreshBackendData("loans:approvals-history", () =>
            loanReportsApi.applications({ stage: "approved", limit: 500 }),
          ),
        );
      }
      await Promise.all(refreshes);
      setConfirm(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoansShell>
      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "my", label: `My queue (${rows.length})` },
          { key: "history", label: "History" },
        ]}
      />

      {tab === "my" ? (
        !data ? (
          <TableSkeleton title="Approval Queue" />
        ) : (
        <TableCard
          title="Approval Queue"
          resultLabel={`${rows.length} approvals`}
          pagination={{
            page: currentPage,
            totalPages,
            totalItems: rows.length,
            itemLabel: "approvals",
            onPageChange: setPage,
            pageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        >
          <Table>
            <THead>
              <Th>Client</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Loan No.</Th>
              <Th>Officer</Th>
              <Th>Waiting</Th>
              <Th style={{ textAlign: "right" }}>Actions</Th>
            </THead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyRow colSpan={7}>No loans awaiting approval.</EmptyRow>
              ) : (
                pageRows.map((r) => (
                  <Tr key={r.loanId} hover>
                    <Td style={{ fontWeight: 300 }}>{r.client}</Td>
                    <Td>{r.product}</Td>
                    <Td style={{ fontWeight: 100 }}>{fmtGHS(r.amount)}</Td>
                    <Td>
                      <span style={{ ...fontMono, color: LOAN.muted }}>{r.accountNo}</span>
                    </Td>
                    <Td>{r.officer}</Td>
                    <Td>
                      {r.daysWaiting} day{r.daysWaiting === 1 ? "" : "s"}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          icon={<X size={14} />}
                          onClick={() => setConfirm({ row: r, action: "reject" })}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="successOutline"
                          size="sm"
                          icon={<Check size={14} />}
                          onClick={() => setConfirm({ row: r, action: "approve" })}
                        >
                          Approve
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableCard>
        )
      ) : !historyData ? (
        <TableSkeleton title="Approval History" />
      ) : (
        <TableCard
          title="Approval History"
          resultLabel={`${history.length} approved`}
          pagination={{
            page: historyCurrentPage,
            totalPages: historyTotalPages,
            totalItems: history.length,
            itemLabel: "approved",
            onPageChange: setHistoryPage,
            pageSize: historyPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageSizeChange: (size) => {
              setHistoryPageSize(size);
              setHistoryPage(1);
            },
          }}
        >
          <Table>
            <THead>
              <Th>Client</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Loan No.</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {historyPageRows.length === 0 ? (
                <EmptyRow colSpan={6}>No approved loans found.</EmptyRow>
              ) : (
                historyPageRows.map((a) => (
                  <Tr key={a.id} hover>
                    <Td style={{ fontWeight: 300 }}>{a.client}</Td>
                    <Td>{a.product}</Td>
                    <Td style={{ fontWeight: 100 }}>{fmtGHS(a.amount)}</Td>
                    <Td>
                      <span style={{ ...fontMono, color: LOAN.muted }}>{a.id}</span>
                    </Td>
                    <Td>{a.submitted}</Td>
                    <Td>
                      <StagePill stage={a.stage} />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableCard>
      )}

      {confirm && (
        <ConfirmDialog
          row={confirm.row}
          action={confirm.action}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void onConfirmAction()}
        />
      )}
    </LoansShell>
  );
}

function ConfirmDialog({
  row,
  action,
  busy,
  onCancel,
  onConfirm,
}: {
  row: ApprovalRow;
  action: "approve" | "reject";
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isReject = action === "reject";
  const title = isReject ? "Reject loan application?" : "Approve loan application?";
  const body = `This will ${isReject ? "reject" : "approve"} ${row.client}'s ${row.product} application for ${fmtGHS(row.amount)}.`;
  return (
    <div
      onClick={busy ? undefined : onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,27,62,0.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, padding: 24, width: 400, maxWidth: "100%" }}
      >
        <div style={{ fontSize: 17, fontWeight: 200, color: LOAN.ink }}>{title}</div>
        <p style={{ fontSize: 13, color: LOAN.muted, marginTop: 8, lineHeight: 1.5 }}>{body}</p>
        <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "danger" : "success"}
            icon={isReject ? <X size={14} /> : <Check size={14} />}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Saving…" : isReject ? "Reject" : "Approve"}
          </Button>
        </div>
      </div>
    </div>
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
