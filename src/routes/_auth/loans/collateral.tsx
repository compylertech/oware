import { createFileRoute } from "@tanstack/react-router";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Ava, Th, Td, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS } from "@/lib/loanMock";

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
  return (
    <LoansShell>
      <Panel>
        <PanelHead title="Collateral Register" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Asset</Th>
              <Th>Type</Th>
              <Th>Valuation</Th>
              <Th>Linked Loan</Th>
              <Th>LTV</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {COLLAT.map((c) => (
              <tr key={c.asset}>
                <Td style={{ fontWeight: 600 }}>{c.asset}</Td>
                <Td>{c.type}</Td>
                <Td>{fmtGHS(c.valuation)}</Td>
                <Td>
                  <span style={{ ...fontMono, fontWeight: 700, color: LOAN.navy }}>{c.loan}</span>
                </Td>
                <Td>{c.ltv}</Td>
                <Td>
                  <StagePill stage={c.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4">
        <Panel>
          <PanelHead title="Guarantors" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Guarantor</Th>
                <Th>Relationship</Th>
                <Th>Guaranteed</Th>
                <Th>For Loan</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {GUAR.map((g) => (
                <tr key={g.name}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={g.name} bg={g.avatar} size={28} />
                      <span style={{ fontWeight: 600 }}>{g.name}</span>
                    </div>
                  </Td>
                  <Td>{g.relation}</Td>
                  <Td>{fmtGHS(g.amount)}</Td>
                  <Td>
                    <span style={{ ...fontMono, fontWeight: 700, color: LOAN.navy }}>{g.loan}</span>
                  </Td>
                  <Td>
                    <StagePill stage={g.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </LoansShell>
  );
}
