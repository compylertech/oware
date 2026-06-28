import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";
import { Check, CheckCircle, Clock, Send } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, Td, Th, THead, Tr, fontMono } from "@/components/loans/ui";
import { fmtGHS } from "@/api/loans";
import { Button, Tabs, TableCard } from "@/components/patterns";

type Row = {
  client: string;
  loanId: string;
  product: string;
  amount: number;
  approved: boolean;
  approver: string;
  avatar: string;
};

const ROWS: Row[] = [
  {
    client: "Fiifi Brown",
    loanId: "LN-20439",
    product: "Group Loan",
    amount: 18000,
    approved: true,
    approver: "V.Yeboah",
    avatar: "#B45309",
  },
  {
    client: "Abena Boateng",
    loanId: "LN-20448",
    product: "Salary Advance",
    amount: 12500,
    approved: false,
    approver: "Awaiting checker",
    avatar: "#059669",
  },
  {
    client: "Nana Addai",
    loanId: "LN-20450",
    product: "Asset Finance",
    amount: 64000,
    approved: false,
    approver: "Awaiting checker",
    avatar: "#7C3AED",
  },
];

export const Route = createFileRoute("/_auth/loans/disbursements")({
  component: DisbursementsPage,
});

function DisbursementsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pending" | "scheduled" | "disbursed">("pending");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(ROWS.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = ROWS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openLoanDetails(loanId: string) {
    navigate({ to: "/loans/$loanId", params: { loanId } });
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, loanId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openLoanDetails(loanId);
  }

  return (
    <LoansShell>
      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "pending", label: "Pending", badge: 5 },
          { key: "scheduled", label: "Scheduled", badge: 8 },
          { key: "disbursed", label: "Disbursed" },
        ]}
      />

      <TableCard
        title="Disbursement Queue"
        resultLabel={`${ROWS.length} disbursements`}
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: ROWS.length,
          itemLabel: "disbursements",
          onPageChange: setPage,
        }}
      >
        <Table>
          <THead>
            <Th>Client</Th>
            <Th>Loan</Th>
            <Th>Product</Th>
            <Th>Amount</Th>
            <Th>Approval</Th>
            <Th style={{ textAlign: "right" }}>Actions</Th>
          </THead>
          <tbody>
            {pageRows.map((r) => (
              <Tr
                key={r.loanId}
                hover
                role="link"
                tabIndex={0}
                aria-label={`View ${r.loanId} details`}
                onClick={() => openLoanDetails(r.loanId)}
                onKeyDown={(event) => onRowKeyDown(event, r.loanId)}
                style={{ cursor: "pointer" }}
              >
                <Td>
                  <div className="flex items-center gap-2">
                    <Ava name={r.client} bg={r.avatar} size={28} />
                    <span style={{ fontWeight: 300 }}>{r.client}</span>
                  </div>
                </Td>
                <Td>
                  <span style={{ ...fontMono, color: LOAN.navy }}>{r.loanId}</span>
                </Td>
                <Td>{r.product}</Td>
                <Td style={{ fontWeight: 100 }}>{fmtGHS(r.amount)}</Td>
                <Td>
                  <span
                    className="inline-flex items-center gap-1"
                    style={{
                      fontSize: 12,
                      color: r.approved ? LOAN.green : LOAN.amber,
                      fontWeight: 300,
                    }}
                  >
                    {r.approved ? <CheckCircle size={12} /> : <Clock size={12} />}
                    {r.approved ? `Approved by ${r.approver}` : r.approver}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    {r.approved ? (
                      <Button
                        variant="primaryOutline"
                        icon={<Send size={14} />}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Disburse
                      </Button>
                    ) : (
                      <Button
                        variant="successOutline"
                        icon={<Check size={14} />}
                        onClick={(event) => event.stopPropagation()}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
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
