import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type KeyboardEvent } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, Td, Th, THead, Tr, Chip, fontMono } from "@/components/loans/ui";
import { FilterDropdown, type FilterOption } from "@/components/loans/FilterDropdown";
import { fmtGHS, loanReportsApi } from "@/api/loans";
import { referencesApi } from "@/api/backend";
import { useBackendData } from "@/api/useBackendData";
import { Tabs, TableCard, DateRangeFilter, PAGE_SIZE_OPTIONS } from "@/components/patterns";

export const Route = createFileRoute("/_auth/loans/disbursements")({
  component: DisbursementsPage,
});

const PAGE_SIZE_DEFAULT = 10;

function DisbursementsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pending" | "disbursed">("pending");

  const [officeFilter, setOfficeFilter] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [officeOptions, setOfficeOptions] = useState<FilterOption[]>([]);
  useEffect(() => {
    void referencesApi
      .list("OFFICE")
      .then((opts) => setOfficeOptions(opts.map((o) => ({ key: o.code, label: o.name }))));
  }, []);

  const [productOptions, setProductOptions] = useState<FilterOption[]>([]);
  useEffect(() => {
    void referencesApi
      .list("LOAN_PRODUCT")
      .then((opts) => setProductOptions(opts.map((o) => ({ key: o.code, label: o.name }))));
  }, []);

  // officeCode is required for full=true to return anything (confirmed live:
  // full=true with no officeCode silently comes back empty) — so product/date
  // filters, which only apply under full=true, stay disabled until an office
  // is picked, rather than quietly doing nothing.
  const full = officeFilter != null;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const { data } = useBackendData(
    `loans:disbursements:${tab}:${officeFilter ?? ""}:${productFilter ?? ""}:${dateFrom}:${dateTo}`,
    () =>
      loanReportsApi.disbursements({
        status: tab,
        full,
        officeCode: officeFilter ?? undefined,
        loanProductCode: full ? (productFilter ?? undefined) : undefined,
        fromDate: full ? dateFrom || undefined : undefined,
        toDate: full ? dateTo || undefined : undefined,
        limit: 500,
      }),
  );

  const pendingRows = data?.pending ?? [];
  const disbursedRows = data?.recentlyDisbursed ?? [];
  const totalItems = tab === "pending" ? pendingRows.length : disbursedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pendingPageRows = pendingRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const disbursedPageRows = disbursedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function resetPage() {
    setPage(1);
  }

  function openLoanByAccountNo(accountNo: string) {
    navigate({ to: "/loans/$loanId", params: { loanId: accountNo } });
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, accountNo: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openLoanByAccountNo(accountNo);
  }

  return (
    <LoansShell>
      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={(v) => {
          setTab(v);
          resetPage();
        }}
        items={[
          { key: "pending", label: "Pending", badge: data ? pendingRows.length : undefined },
          { key: "disbursed", label: "Disbursed" },
        ]}
      />

      {tab === "pending" ? (
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          <Chip label="Awaiting Disbursal" value={String(data?.awaitingCount ?? 0)} />
          <Chip label="Awaiting Amount" value={fmtGHS(data?.awaitingAmount ?? 0)} />
        </div>
      ) : (
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          <Chip
            label="Disbursed This Week"
            value={String(data?.thisWeekCount ?? 0)}
            meta={fmtGHS(data?.thisWeekAmount ?? 0)}
          />
          <Chip
            label="Disbursed Today"
            value={String(data?.todayCount ?? 0)}
            meta={fmtGHS(data?.todayAmount ?? 0)}
          />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <FilterDropdown
          placeholder="All Branches"
          options={officeOptions}
          selectedKey={officeFilter}
          onSelect={(key) => {
            setOfficeFilter(key);
            // Product/date only apply once an office is picked; clear them
            // when going back to no office so they don't linger unused.
            if (!key) {
              setProductFilter(null);
              setDateFrom("");
              setDateTo("");
            }
            resetPage();
          }}
        />
        <div
          style={{ opacity: full ? 1 : 0.5, pointerEvents: full ? "auto" : "none" }}
          title={full ? undefined : "Select a branch first to filter by product or date"}
        >
          <FilterDropdown
            placeholder="All Products"
            options={productOptions}
            selectedKey={productFilter}
            onSelect={(key) => {
              setProductFilter(key);
              resetPage();
            }}
          />
        </div>
        <div
          style={{ opacity: full ? 1 : 0.5, pointerEvents: full ? "auto" : "none" }}
          title={
            full
              ? tab === "pending"
                ? "Date range only applies to Disbursed"
                : undefined
              : "Select a branch first to filter by product or date"
          }
        >
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={(v) => {
              setDateFrom(v);
              resetPage();
            }}
            onToChange={(v) => {
              setDateTo(v);
              resetPage();
            }}
          />
        </div>
      </div>

      {tab === "pending" ? (
        <TableCard
          title="Disbursement Queue"
          resultLabel={`${pendingRows.length} disbursements`}
          pagination={{
            page: currentPage,
            totalPages,
            totalItems: pendingRows.length,
            itemLabel: "disbursements",
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
              <Th>Client</Th>
              <Th>Loan</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Office</Th>
              <Th>Approved</Th>
              <Th>Waiting</Th>
            </THead>
            <tbody>
              {pendingPageRows.map((r) => (
                <Tr
                  key={r.accountNo}
                  hover
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${r.accountNo} details`}
                  onClick={() => openLoanByAccountNo(r.accountNo)}
                  onKeyDown={(event) => onRowKeyDown(event, r.accountNo)}
                  style={{ cursor: "pointer" }}
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={r.client} bg={LOAN.blue} size={28} />
                      <span style={{ fontWeight: 300 }}>{r.client}</span>
                    </div>
                  </Td>
                  <Td>
                    <span style={{ ...fontMono, color: LOAN.navy }}>{r.accountNo}</span>
                  </Td>
                  <Td>{r.product}</Td>
                  <Td style={{ fontWeight: 100 }}>{fmtGHS(r.amount)}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.officeName}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.approvedDate || "—"}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.daysSinceApproval} day{r.daysSinceApproval === 1 ? "" : "s"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      ) : (
        <TableCard
          title="Recently Disbursed"
          resultLabel={`${disbursedRows.length} disbursements`}
          pagination={{
            page: currentPage,
            totalPages,
            totalItems: disbursedRows.length,
            itemLabel: "disbursements",
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
              <Th>Client</Th>
              <Th>Loan</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Office</Th>
              <Th>Disbursed</Th>
              <Th>Days Ago</Th>
            </THead>
            <tbody>
              {disbursedPageRows.map((r) => (
                <Tr
                  key={r.accountNo}
                  hover
                  role="link"
                  tabIndex={0}
                  aria-label={`View ${r.accountNo} details`}
                  onClick={() => openLoanByAccountNo(r.accountNo)}
                  onKeyDown={(event) => onRowKeyDown(event, r.accountNo)}
                  style={{ cursor: "pointer" }}
                >
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={r.client} bg={LOAN.green} size={28} />
                      <span style={{ fontWeight: 300 }}>{r.client}</span>
                    </div>
                  </Td>
                  <Td>
                    <span style={{ ...fontMono, color: LOAN.navy }}>{r.accountNo}</span>
                  </Td>
                  <Td>{r.product}</Td>
                  <Td style={{ fontWeight: 100 }}>{fmtGHS(r.amount)}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.officeName}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.disbursedDate || "—"}</Td>
                  <Td style={{ color: LOAN.muted }}>{r.daysAgo ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      )}
    </LoansShell>
  );
}
