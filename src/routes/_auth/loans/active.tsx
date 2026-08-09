import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import {
  Panel,
  Ava,
  Table,
  THead,
  Tr,
  Th,
  Td,
  Chip,
  MiniBar,
  fontMono,
} from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { FilterDropdown, type FilterOption } from "@/components/loans/FilterDropdown";
import { fmtGHS, loanReportsApi } from "@/api/loans";
import { referencesApi } from "@/api/backend";
import { useBackendData } from "@/api/useBackendData";
import { TableCard, PAGE_SIZE_OPTIONS } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/loans/active")({
  component: ActiveLoansPage,
});

function ActiveLoansPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [productFilter, setProductFilter] = useState<string | null>(null);

  // The loan product filter is validated against the LOAN_PRODUCT reference
  // category's own code (e.g. "HOUSING_LOAN"), not the product catalogue's
  // short code ("HLN") - confirmed live, an unrecognized code 400s.
  const [productOptions, setProductOptions] = useState<FilterOption[]>([]);
  useEffect(() => {
    void referencesApi
      .list("LOAN_PRODUCT")
      .then((opts) => setProductOptions(opts.map((o) => ({ key: o.code, label: o.name }))));
  }, []);

  // Every row here is inherently active, so there's no "Status" to filter -
  // only Product, applied server-side via loanProductCode. Pagination is
  // client-side over a large fetched batch rather than true limit/offset
  // paging: confirmed live that `totalLoans` mirrors however many rows come
  // back in a given call (limit=2 → totalLoans=2, even with 4 loans total),
  // not a grand total across pages - so trusting it under a small `limit`
  // would show "Page 1 of 1" and hide the rest.
  const { data } = useBackendData(`loans:active:${productFilter ?? ""}`, () =>
    loanReportsApi.active({ loanProductCode: productFilter ?? undefined, limit: 500 }),
  );

  // Cached data (even stale) shows instantly with no skeleton - only a
  // genuinely first-ever load has nothing to show yet.
  if (!data) {
    return (
      <LoansShell>
        <ActiveLoansSkeleton />
      </LoansShell>
    );
  }

  const totalPages = Math.max(1, Math.ceil(data.loans.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = data.loans.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <LoansShell>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Chip label="Total Outstanding" value={fmtGHS(data.totalOutstanding)} />
        <Chip
          label="On-time"
          value={data.onTimeCount.toLocaleString("en-GH")}
          meta="loans"
          metaColor={LOAN.green}
        />
        <Chip
          label="In Arrears"
          value={data.inArrearsCount.toLocaleString("en-GH")}
          meta="loans"
          metaColor={LOAN.red}
        />
        <Chip label="Avg. Loan Size" value={fmtGHS(Math.round(data.avgLoanSize))} />
      </div>

      <TableCard
        title="Active Loans"
        filters={
          <FilterDropdown
            placeholder="All Products"
            options={productOptions}
            selectedKey={productFilter}
            onSelect={(key) => {
              setProductFilter(key);
              setPage(1);
            }}
          />
        }
        resultLabel={`${data.loans.length} loans`}
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: data.loans.length,
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
            <Th>Loan</Th>
            <Th>Client</Th>
            <Th>Product</Th>
            <Th>Outstanding</Th>
            <Th>Next Due</Th>
            <Th>Repaid</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {pageRows.map((l) => (
              <Tr key={l.id} hover>
                <Td>
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: l.id }}
                    search={{ from: "active" }}
                    style={{ ...fontMono, fontWeight: 100, color: LOAN.navy }}
                  >
                    {l.id}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Ava name={l.client} bg={l.avatar} size={28} />
                    <span style={{ fontWeight: 300 }}>{l.client}</span>
                  </div>
                </Td>
                <Td>{l.product}</Td>
                <Td style={{ fontWeight: 100 }}>{fmtGHS(l.outstanding)}</Td>
                <Td
                  style={
                    l.status === "In Arrears" ? { color: LOAN.red, fontWeight: 100 } : undefined
                  }
                >
                  {l.nextDue}
                </Td>
                <Td>
                  <MiniBar
                    pct={l.repaid}
                    color={l.status === "In Arrears" ? LOAN.red : LOAN.green}
                  />
                </Td>
                <Td>
                  <StagePill stage={l.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </LoansShell>
  );
}

/** Rough placeholder for Active Loans while the first-ever load is in
 * flight - never a fixture standing in for real numbers. */
function ActiveLoansSkeleton() {
  return (
    <>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i} style={{ padding: 16 }}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-20 mt-3" />
            <Skeleton className="h-3 w-14 mt-2" />
          </Panel>
        ))}
      </div>

      <TableCard title="Active Loans">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </TableCard>
    </>
  );
}
