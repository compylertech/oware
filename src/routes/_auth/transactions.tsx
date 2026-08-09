import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Search, Eye } from "lucide-react";
import { StatusPill } from "@/components/common/StatusPill";
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
  PAGE_SIZE_OPTIONS,
} from "@/components/patterns";
import { ledgerApi, referencesApi, apiErrorMessage, type LedgerEntry } from "@/api/backend";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";
import { FONTS } from "@/lib/tokens";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/transactions")({
  component: TransactionsPage,
});

const NAVY = "#002663";
const BORDER = "#DDE4EF";
const MUTED = "#5B6A86";
const INK = "#16233F";
const BG = "#F4F6FB";
const PAGE_SIZE_DEFAULT = 10;
// Bulk-fetch pattern used elsewhere in this app (e.g. Active Loans): the
// ledger endpoint's pagination is server-reliable, but Type/Status/search
// aren't server-side filters here, so a large batch is fetched once (office/
// date narrow it server-side) and Type/Status/search/pagination are applied
// client-side over that batch.
const BULK_SIZE = 500;

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE_OPTIONS = [
  { label: "All types", value: "All" },
  { label: "Credit", value: "Credit" },
  { label: "Debit", value: "Debit" },
];
const STATUS_OPTIONS = [
  { label: "All statuses", value: "All" },
  { label: "Completed", value: "Completed" },
  { label: "Reversed", value: "Reversed" },
];

function TransactionsPage() {
  const [detail, setDetail] = useState<LedgerEntry | null>(null);

  const [search, setSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const [officeOptions, setOfficeOptions] = useState<{ label: string; value: string }[]>([
    { label: "All offices", value: "All" },
  ]);
  useEffect(() => {
    void referencesApi
      .list("OFFICE")
      .then((opts) =>
        setOfficeOptions([
          { label: "All offices", value: "All" },
          ...opts.map((o) => ({ label: o.name, value: o.code })),
        ]),
      );
  }, []);

  const cacheKey = `ledger:${officeFilter}:${dateFrom}:${dateTo}`;
  const fetchEntries = () =>
    ledgerApi.entries({
      officeCode: officeFilter === "All" ? undefined : officeFilter,
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
      size: BULK_SIZE,
    });
  const { data, loading } = useBackendData(cacheKey, fetchEntries);
  const rows = data?.content ?? [];

  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshBackendData(cacheKey, fetchEntries);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not refresh transactions."));
    } finally {
      setRefreshing(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (typeFilter === "Credit" && r.credit == null) return false;
    if (typeFilter === "Debit" && r.debit == null) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (q) {
      const haystack = `${r.accountNo ?? ""} ${r.clientName ?? ""} ${r.narration}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const totalCredits = filtered
    .filter((r) => r.credit != null && r.status === "Completed")
    .reduce((s, r) => s + (r.credit ?? 0), 0);
  const totalDebits = filtered
    .filter((r) => r.debit != null && r.status === "Completed")
    .reduce((s, r) => s + (r.debit ?? 0), 0);
  const reversedCount = filtered.filter((r) => r.status === "Reversed").length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() {
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    resetPage();
  }
  function updateOffice(value: string) {
    setOfficeFilter(value);
    resetPage();
  }
  function updateType(value: string) {
    setTypeFilter(value);
    resetPage();
  }
  function updateStatus(value: string) {
    setStatusFilter(value);
    resetPage();
  }
  function updateDateFrom(value: string) {
    setDateFrom(value);
    resetPage();
  }
  function updateDateTo(value: string) {
    setDateTo(value);
    resetPage();
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
          <Button
            variant="outline"
            icon={<RefreshCw size={14} className={refreshing ? "animate-spin" : undefined} />}
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {!data ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <Kpi
            label="TOTAL ENTRIES"
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
            label="REVERSED"
            value={String(reversedCount)}
            valueColor="#B45309"
            sub="Reversed entries"
          />
        </div>
      )}

      <TableCard
        title="Transaction Ledger"
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
                placeholder="Search account, client, narration…"
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
              value={officeFilter}
              onChange={updateOffice}
              options={officeOptions}
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
          itemLabel: "entries",
          onPageChange: setPage,
          pageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageSizeChange: (size) => {
            setPageSize(size);
            resetPage();
          },
        }}
      >
        <Table>
          <THead>
            {[
              "ACCOUNT NO.",
              "CLIENT",
              "DEBIT",
              "CREDIT",
              "NARRATION",
              "STATUS",
              "DATE",
              "OFFICE",
              "",
            ].map((h) => (
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
            ))}
          </THead>
          <tbody>
            {loading && !data ? (
              <EmptyRow colSpan={9}>Loading transactions…</EmptyRow>
            ) : pageRows.length === 0 ? (
              <EmptyRow colSpan={9}>No transactions match the current filters.</EmptyRow>
            ) : (
              pageRows.map((r, i) => (
                <Tr
                  key={`${r.accountNo ?? "gl"}-${r.date}-${r.narration}-${i}`}
                  hover
                  style={{ borderBottom: i < pageRows.length - 1 ? `1px solid ${BORDER}` : "none" }}
                >
                  <Td style={td}>
                    <span style={{ fontFamily: FONTS.mono, color: NAVY, fontSize: 13 }}>
                      {r.accountNo ?? "-"}
                    </span>
                  </Td>
                  <Td style={td}>
                    <span style={{ fontSize: 13, color: INK }}>{r.clientName ?? "-"}</span>
                  </Td>
                  <Td
                    style={{
                      ...td,
                      fontWeight: 100,
                      color: INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.debit != null ? `GH₵ ${fmt(r.debit)}` : ""}
                  </Td>
                  <Td
                    style={{
                      ...td,
                      fontWeight: 100,
                      color: INK,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.credit != null ? `GH₵ ${fmt(r.credit)}` : ""}
                  </Td>
                  <Td style={{ ...td, color: INK }}>{r.narration}</Td>
                  <Td style={td}>
                    <StatusPill status={r.status === "Reversed" ? "Reversed" : "Completed"} />
                  </Td>
                  <Td style={{ ...td, color: INK }}>{fmtDate(r.date)}</Td>
                  <Td style={{ ...td, color: MUTED }}>{r.officeName}</Td>
                  <Td style={{ ...td, textAlign: "right" }}>
                    <button
                      type="button"
                      aria-label="View details"
                      onClick={() => setDetail(r)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: MUTED,
                        padding: 4,
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </Td>
                </Tr>
              ))
            )}
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
            <DetailRow label="Account" value={detail.accountNo ?? "-"} mono />
            <DetailRow label="Client" value={detail.clientName ?? "-"} />
            <DetailRow label="Type" value={detail.credit != null ? "Credit" : "Debit"} />
            <DetailRow
              label="Amount"
              value={`${detail.credit != null ? "+" : "-"}GH₵ ${fmt((detail.credit ?? detail.debit ?? 0) as number)}`}
            />
            <DetailRow label="Narration" value={detail.narration} />
            <DetailRow label="Status" value={detail.status} />
            <DetailRow label="Date" value={fmtDate(detail.date)} />
            <DetailRow label="Office" value={detail.officeName} />
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
