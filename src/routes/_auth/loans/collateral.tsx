import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, THead, Tr, Th, Td, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS } from "@/lib/loanMock";
import { TableCard } from "@/components/patterns";

export const Route = createFileRoute("/_auth/loans/collateral")({
  component: CollateralPage,
});

const COLLAT = [
  {
    asset: "3-bed house East Legon",
    type: "Property",
    valuation: 1850000,
    loan: "LN-20097",
    ltv: "16%",
    status: "Verified" as const,
  },
  {
    asset: "Toyota Hiace 2021",
    type: "Vehicle",
    valuation: 210000,
    loan: "LN-20288",
    ltv: "57%",
    status: "Verified" as const,
  },
  {
    asset: "Shop inventory",
    type: "Stock",
    valuation: 95000,
    loan: "LN-20451",
    ltv: "89%",
    status: "Pending valuation" as const,
  },
];

const GUAR = [
  {
    name: "Joseph Annan",
    relation: "Employer",
    amount: 12500,
    loan: "LN-20448",
    status: "Active" as const,
    avatar: "#3B5BDB",
  },
  {
    name: "Grace Mensah",
    relation: "Spouse",
    amount: 40000,
    loan: "LN-20451",
    status: "Active" as const,
    avatar: "#DC2626",
  },
  {
    name: "Samuel Koomson",
    relation: "Business partner",
    amount: 30000,
    loan: "LN-20450",
    status: "Verification" as const,
    avatar: "#7C3AED",
  },
];

function CollateralPage() {
  const [collateralPage, setCollateralPage] = useState(1);
  const [guarantorPage, setGuarantorPage] = useState(1);
  const collateralTotalPages = Math.max(1, Math.ceil(COLLAT.length / PAGE_SIZE));
  const collateralCurrentPage = Math.min(collateralPage, collateralTotalPages);
  const collateralRows = COLLAT.slice(
    (collateralCurrentPage - 1) * PAGE_SIZE,
    collateralCurrentPage * PAGE_SIZE,
  );
  const guarantorTotalPages = Math.max(1, Math.ceil(GUAR.length / PAGE_SIZE));
  const guarantorCurrentPage = Math.min(guarantorPage, guarantorTotalPages);
  const guarantorRows = GUAR.slice(
    (guarantorCurrentPage - 1) * PAGE_SIZE,
    guarantorCurrentPage * PAGE_SIZE,
  );

  return (
    <LoansShell>
      <TableCard
        title="Collateral Register"
        resultLabel={`${COLLAT.length} assets`}
        pagination={{
          page: collateralCurrentPage,
          totalPages: collateralTotalPages,
          totalItems: COLLAT.length,
          itemLabel: "assets",
          onPageChange: setCollateralPage,
        }}
      >
        <Table>
          <THead>
            <Th>Asset</Th>
            <Th>Type</Th>
            <Th>Valuation</Th>
            <Th>Linked Loan</Th>
            <Th>LTV</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {collateralRows.map((c) => (
              <Tr key={c.asset} hover>
                <Td style={{ fontWeight: 300 }}>{c.asset}</Td>
                <Td>{c.type}</Td>
                <Td>{fmtGHS(c.valuation)}</Td>
                <Td>
                  <span style={{ ...fontMono, fontWeight: 100, color: LOAN.navy }}>{c.loan}</span>
                </Td>
                <Td>{c.ltv}</Td>
                <Td>
                  <StagePill stage={c.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <div className="mt-4">
        <TableCard
          title="Guarantors"
          resultLabel={`${GUAR.length} guarantors`}
          pagination={{
            page: guarantorCurrentPage,
            totalPages: guarantorTotalPages,
            totalItems: GUAR.length,
            itemLabel: "guarantors",
            onPageChange: setGuarantorPage,
          }}
        >
          <Table>
            <THead>
              <Th>Guarantor</Th>
              <Th>Relationship</Th>
              <Th>Guaranteed</Th>
              <Th>For Loan</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {guarantorRows.map((g) => (
                <Tr key={g.name} hover>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={g.name} bg={g.avatar} size={28} />
                      <span style={{ fontWeight: 300 }}>{g.name}</span>
                    </div>
                  </Td>
                  <Td>{g.relation}</Td>
                  <Td>{fmtGHS(g.amount)}</Td>
                  <Td>
                    <span style={{ ...fontMono, fontWeight: 100, color: LOAN.navy }}>{g.loan}</span>
                  </Td>
                  <Td>
                    <StagePill stage={g.status} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      </div>
    </LoansShell>
  );
}

const PAGE_SIZE = 10;
