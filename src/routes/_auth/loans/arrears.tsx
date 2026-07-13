import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import {
  Panel,
  PanelHead,
  Chip,
  Table,
  THead,
  Tr,
  Th,
  Td,
  fontDisplay,
} from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { FilterDropdown, type FilterOption } from "@/components/loans/FilterDropdown";
import { fmtGHS, loanReportsApi, type ArrearsBucketKey } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { TableCard, EmptyRow, PAGE_SIZE_OPTIONS } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/loans/arrears")({
  component: ArrearsPage,
});

const PREVIEW_COUNT = 5;

const BUCKET_LABEL: Record<ArrearsBucketKey, "1–30" | "31–60" | "61–90" | "90+"> = {
  "1to30": "1–30",
  "31to60": "31–60",
  "61to90": "61–90",
  "90plus": "90+",
};

const BUCKET_OPTIONS: FilterOption[] = [
  { key: "1to30", label: "1–30 days" },
  { key: "31to60", label: "31–60 days" },
  { key: "61to90", label: "61–90 days" },
  { key: "90plus", label: "90+ days" },
];

function ArrearsPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const { data } = useBackendData("loans:arrears:preview", () =>
    loanReportsApi.arrears({ limit: PREVIEW_COUNT }),
  );

  const parAmount = data?.parAmount ?? 0;
  const bucketPct = (amount: number) =>
    parAmount > 0 ? Math.round((amount / parAmount) * 100) : 0;

  return (
    <LoansShell>
      {!data ? (
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
          <Chip label="PAR" value={`${data.parPercent.toFixed(2)}%`} metaColor={LOAN.amber} />
          <Chip label="PAR Amount" value={fmtGHS(data.parAmount)} metaColor={LOAN.red} />
          <Chip label="Loans in Arrears" value={String(data.loansInArrears)} />
          <Chip label="Avg Days Overdue" value={`${data.avgDaysOverdue.toFixed(0)}d`} />
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {!data ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <TableCard
            title="Overdue Loans"
            resultLabel={`${data.loansInArrears} loans`}
            actions={
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-xs cursor-pointer"
                style={{ color: LOAN.blue }}
              >
                View all →
              </button>
            }
          >
            <Table>
              <THead>
                <Th>Client</Th>
                <Th>Outstanding</Th>
                <Th>Overdue</Th>
                <Th>Bucket</Th>
              </THead>
              <tbody>
                {data.rows.length === 0 ? (
                  <EmptyRow colSpan={4}>No loans in arrears.</EmptyRow>
                ) : (
                  data.rows.map((o) => (
                    <Tr key={o.loanId} hover>
                      <Td style={{ fontWeight: 300 }}>{o.client}</Td>
                      <Td>{fmtGHS(o.principalOutstanding + o.interestOutstanding)}</Td>
                      <Td style={{ color: LOAN.red, fontWeight: 100 }}>{o.daysOverdue} days</Td>
                      <Td>
                        <StagePill stage={BUCKET_LABEL[o.bucket]} />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>
        )}

        {!data ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <Panel>
            <PanelHead title="Aging Distribution" />
            <div className="p-5 space-y-3">
              <Aging
                label={`1–30 days (${data.buckets["1to30"].count} loans)`}
                amt={fmtGHS(data.buckets["1to30"].amount)}
                pct={bucketPct(data.buckets["1to30"].amount)}
                color={LOAN.amber}
              />
              <Aging
                label={`31–60 days (${data.buckets["31to60"].count} loans)`}
                amt={fmtGHS(data.buckets["31to60"].amount)}
                pct={bucketPct(data.buckets["31to60"].amount)}
                color="#E07B39"
              />
              <Aging
                label={`61–90 days (${data.buckets["61to90"].count} loans)`}
                amt={fmtGHS(data.buckets["61to90"].amount)}
                pct={bucketPct(data.buckets["61to90"].amount)}
                color={LOAN.red}
              />
              <Aging
                label={`90+ days (${data.buckets["90plus"].count} loans)`}
                amt={fmtGHS(data.buckets["90plus"].amount)}
                pct={bucketPct(data.buckets["90plus"].amount)}
                color="#9B1C1C"
              />
            </div>
          </Panel>
        )}
      </div>

      {modalOpen && <ArrearsModal onClose={() => setModalOpen(false)} />}
    </LoansShell>
  );
}

function ArrearsModal({ onClose }: { onClose: () => void }) {
  const [bucket, setBucket] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cacheKey = `loans:arrears:modal:${bucket ?? ""}:${page}:${pageSize}`;
  const { data } = useBackendData(cacheKey, () =>
    loanReportsApi.arrears({
      bucket: (bucket as ArrearsBucketKey) ?? undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
  );

  const totalItems = data?.filteredCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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
          maxWidth: 980,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: `1px solid ${LOAN.border}` }}
        >
          <div style={{ ...fontDisplay, fontSize: 17, fontWeight: 200, color: LOAN.ink }}>
            All Overdue Loans
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: LOAN.muted }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto" }}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <FilterDropdown
              placeholder="All Buckets"
              options={BUCKET_OPTIONS}
              selectedKey={bucket}
              onSelect={(key) => {
                setBucket(key);
                setPage(1);
              }}
            />
          </div>

          {!data ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <TableCard
              resultLabel={`${totalItems} loans`}
              pagination={{
                page,
                totalPages,
                totalItems,
                itemLabel: "loans",
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
                  <Th>Loan No.</Th>
                  <Th>Outstanding</Th>
                  <Th>Overdue Amount</Th>
                  <Th>Overdue Since</Th>
                  <Th>Days</Th>
                  <Th>Bucket</Th>
                </THead>
                <tbody>
                  {data.rows.length === 0 ? (
                    <EmptyRow colSpan={8}>No loans found for this filter.</EmptyRow>
                  ) : (
                    data.rows.map((o) => (
                      <Tr key={o.loanId} hover>
                        <Td style={{ fontWeight: 300 }}>{o.client}</Td>
                        <Td>{o.product}</Td>
                        <Td style={{ color: LOAN.muted }}>{o.accountNo}</Td>
                        <Td>{fmtGHS(o.principalOutstanding + o.interestOutstanding)}</Td>
                        <Td style={{ fontWeight: 100 }}>{fmtGHS(o.totalOverdue)}</Td>
                        <Td>{o.overdueSince}</Td>
                        <Td style={{ color: LOAN.red, fontWeight: 100 }}>{o.daysOverdue}</Td>
                        <Td>
                          <StagePill stage={BUCKET_LABEL[o.bucket]} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Aging({
  label,
  amt,
  pct,
  color,
}: {
  label: string;
  amt: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div
        className="flex justify-between"
        style={{ fontSize: 12, color: LOAN.ink, marginBottom: 4 }}
      >
        <span>{label}</span>
        <span style={{ color: LOAN.muted }}>
          {amt} · {pct}%
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#EEF1F6", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}
