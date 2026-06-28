import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, THead, Tr, Th, Td, Chip, MiniBar, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { ACTIVE_LOANS, fmtGHS } from "@/lib/loanMock";
import { ChevronDown } from "lucide-react";
import { Button, TableCard } from "@/components/patterns";

export const Route = createFileRoute("/_auth/loans/active")({
  component: ActiveLoansPage,
});

function ActiveLoansPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(ACTIVE_LOANS.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = ACTIVE_LOANS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <LoansShell>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Chip label="Total Outstanding" value="GH₵18.4M" />
        <Chip label="On-time" value="1,192" meta="loans" metaColor={LOAN.green} />
        <Chip label="In Arrears" value="92" meta="loans" metaColor={LOAN.red} />
        <Chip label="Avg. Loan Size" value="GH₵14,300" />
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

const PAGE_SIZE = 10;
