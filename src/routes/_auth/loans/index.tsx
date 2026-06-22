import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, PanelHead, Ava, Chip, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { APPLICATIONS, fmtGHS } from "@/lib/loanMock";
import { StagePill } from "@/components/loans/StagePill";

export const Route = createFileRoute("/_auth/loans/")({
  component: LoansOverview,
});

function LoansOverview() {
  return (
    <LoansShell>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
        <KpiCard icon={<DollarSign size={16} />} iconBg="#EEF2FF" iconColor="#3B5BDB" label="Active Loans" value="1,284" meta="GH₵ 18.4M out" />
        <KpiCard icon={<Clock size={16} />} iconBg="#FFFBEB" iconColor="#B45309" label="Pending Disb." value="37" meta="GH₵ 2.1M" />
        <KpiCard icon={<AlertTriangle size={16} />} iconBg="#FEF2F2" iconColor="#DC2626" label="PAR (30+)" value="4.8%" meta="▲ 0.6%" metaColor={LOAN.red} />
        <KpiCard icon={<TrendingUp size={16} />} iconBg="#F5F3FF" iconColor="#7C3AED" label="Arrears" value="GH₵ 612K" meta="92 loans" />
        <KpiCard icon={<BarChart2 size={16} />} iconBg="#ECFDF5" iconColor="#059669" label="Collections" value="GH₵ 3.2M" meta="▲ 91%" metaColor={LOAN.green} />
      </div>

      <div className="mt-4">
        <Panel>
          <PanelHead title="Application Pipeline" action={<Link to="/loans/applications">View board →</Link>} />
          <div className="grid gap-3 p-5" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {[
              { dot: LOAN.muted, label: "Submitted", count: 24, amt: "GH₵1.9M" },
              { dot: LOAN.blue, label: "Under Review", count: 12, amt: "GH₵980K" },
              { dot: LOAN.amber, label: "Approved", count: 9, amt: "GH₵720K" },
              { dot: LOAN.green, label: "To Disburse", count: 5, amt: "GH₵410K" },
              { dot: LOAN.red, label: "Rejected", count: 3, amt: "GH₵240K" },
            ].map((c) => (
              <div key={c.label} style={{ border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 14 }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c.dot }} />
                  <span style={{ fontSize: 12, color: LOAN.muted, fontWeight: 600 }}>{c.label}</span>
                </div>
                <div style={{ ...fontDisplay, fontSize: 22, fontWeight: 800, color: LOAN.ink, marginTop: 6 }}>{c.count}</div>
                <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2 }}>{c.amt}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <Panel>
          <PanelHead title="Recent Applications" action={<Link to="/loans/applications">View all →</Link>} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Product</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.slice(0, 3).map((a) => (
                <tr key={a.id}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={a.client} bg={a.avatar} size={28} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.client}</div>
                        <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>{a.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{a.product}</Td>
                  <Td style={{ fontWeight: 700 }}>{fmtGHS(a.amount)}</Td>
                  <Td><StagePill stage={a.stage} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel>
          <PanelHead title="Arrears Aging" />
          <div className="p-5 space-y-3">
            <AgingBar label="1–30 days" amt="GH₵248K" pct={62} color={LOAN.amber} />
            <AgingBar label="31–60 days" amt="GH₵190K" pct={46} color="#E07B39" />
            <AgingBar label="61–90 days" amt="GH₵102K" pct={28} color={LOAN.red} />
            <AgingBar label="90+ days" amt="GH₵72K" pct={18} color="#9B1C1C" />
          </div>
        </Panel>
      </div>
    </LoansShell>
  );
}

function KpiCard({
  icon, iconBg, iconColor, label, value, meta, metaColor,
}: { icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: string; meta: string; metaColor?: string }) {
  return (
    <Panel style={{ padding: 16 }}>
      <div
        className="flex items-center justify-center"
        style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 12, color: LOAN.muted, fontWeight: 600, marginTop: 10 }}>{label}</div>
      <div style={{ ...fontDisplay, fontSize: 22, fontWeight: 800, color: LOAN.ink, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: metaColor ?? LOAN.muted, marginTop: 2, fontWeight: 600 }}>{meta}</div>
    </Panel>
  );
}

function AgingBar({ label, amt, pct, color }: { label: string; amt: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ fontSize: 12, color: LOAN.ink, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: LOAN.muted }}>{amt} · {pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#EEF1F6", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}
