import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, Ava, Table, THead, Tr, Th, Td, Chip, MiniBar, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS, loanReportsApi } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { ChevronDown } from "lucide-react";
import { Button, TableCard } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/loans/active")({
  component: ActiveLoansPage,
});

function ActiveLoansPage() {
  const { data } = useBackendData("loans:active", () => loanReportsApi.active());
  const [page, setPage] = useState(1);

  // Cached data (even stale) shows instantly with no skeleton — only a
  // genuinely first-ever load has nothing to show yet.
  if (!data) {
    return (
      <LoansShell>
        <ActiveLoansSkeleton />
      </LoansShell>
    );
  }

  const ACTIVE_LOANS = data.loans;
  const totalPages = Math.max(1, Math.ceil(ACTIVE_LOANS.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = ACTIVE_LOANS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
        filters={["Status: All", "All Products"].map((l) => (
          <Button
            type="button"
            key={l}
            variant="outline"
            size="sm"
            iconRight={<ChevronDown size={12} />}
          >
            {l}
          </Button>
        ))}
        resultLabel={`${ACTIVE_LOANS.length} loans`}
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: ACTIVE_LOANS.length,
          itemLabel: "loans",
          onPageChange: setPage,
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
 * flight — never a fixture standing in for real numbers. */
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

const PAGE_SIZE = 10;
