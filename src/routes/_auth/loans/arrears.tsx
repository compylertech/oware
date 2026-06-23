import { createFileRoute } from "@tanstack/react-router";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Chip, Th, Td, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS } from "@/lib/loanMock";

export const Route = createFileRoute("/_auth/loans/arrears")({
  component: ArrearsPage,
});

const OVERDUE = [
  { client: "Adwoa Mensa", outstanding: 4200, days: 14, bucket: "1–30" as const },
  { client: "Sena Ofori", outstanding: 9800, days: 42, bucket: "31–60" as const },
  { client: "Paa Anann", outstanding: 21500, days: 96, bucket: "90+" as const },
];

function ArrearsPage() {
  return (
    <LoansShell>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <Chip label="PAR>30" value="4.8%" metaColor={LOAN.amber} />
        <Chip label="PAR>90" value="1.4%" metaColor={LOAN.red} />
        <Chip label="Loans in Arrears" value="92" />
        <Chip label="Recovered (May)" value="GH₵188K" metaColor={LOAN.green} />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <Panel>
          <PanelHead title="Overdue Loans" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Client</Th>
                <Th>Outstanding</Th>
                <Th>Overdue</Th>
                <Th>Bucket</Th>
              </tr>
            </thead>
            <tbody>
              {OVERDUE.map((o) => (
                <tr key={o.client}>
                  <Td style={{ fontWeight: 600 }}>{o.client}</Td>
                  <Td>{fmtGHS(o.outstanding)}</Td>
                  <Td style={{ color: LOAN.red, fontWeight: 700 }}>{o.days} days</Td>
                  <Td>
                    <StagePill stage={o.bucket} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel>
          <PanelHead title="Aging Distribution" />
          <div className="p-5 space-y-3">
            <Aging label="1–30 days (38 loans)" amt="GH₵248K" pct={62} color={LOAN.amber} />
            <Aging label="31–60 days (24 loans)" amt="GH₵190K" pct={46} color="#E07B39" />
            <Aging label="61–90 days (18 loans)" amt="GH₵102K" pct={28} color={LOAN.red} />
            <Aging label="90+ days (12 loans)" amt="GH₵72K" pct={18} color="#9B1C1C" />
          </div>
        </Panel>
      </div>
    </LoansShell>
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
