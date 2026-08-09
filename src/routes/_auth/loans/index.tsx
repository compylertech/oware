import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, Clock, AlertTriangle, TrendingUp, BarChart2 } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, THead, Tr, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { fmtGHS, loanReportsApi } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { StagePill } from "@/components/loans/StagePill";
import { StatCard, StatGrid, SectionCard, TableCard } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/loans/")({
  component: LoansOverview,
});

// Compact Ghana-cedi amount, e.g. GH₵ 18.4M / GH₵ 612K.
function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `GH₵ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `GH₵ ${Math.round(n / 1_000)}K`;
  return `GH₵ ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

// Stage order/labels/colors for the real pipeline keys the backend returns
// (submitted → approved → toDisburse → active, plus rejected).
const PIPELINE_STAGES: { key: string; label: string; dot: string }[] = [
  { key: "submitted", label: "Submitted", dot: LOAN.muted },
  { key: "approved", label: "Approved", dot: LOAN.amber },
  { key: "toDisburse", label: "To Disburse", dot: LOAN.green },
  { key: "active", label: "Active", dot: LOAN.blue },
  { key: "rejected", label: "Rejected", dot: LOAN.red },
];

const ARREARS_BUCKETS: { key: string; label: string; color: string }[] = [
  { key: "days1to30", label: "1–30 days", color: LOAN.amber },
  { key: "days31to60", label: "31–60 days", color: "#E07B39" },
  { key: "days61to90", label: "61–90 days", color: LOAN.red },
  { key: "days90plus", label: "90+ days", color: "#9B1C1C" },
];

function LoansOverview() {
  const { data: ov } = useBackendData("loans:overview", () => loanReportsApi.overview());
  const { data: recent } = useBackendData("loans:recent-applications", () =>
    loanReportsApi.applications({ limit: 5 }),
  );

  // Cached data (even stale) is shown instantly with no skeleton - only a
  // genuinely first-ever load has nothing to show yet.
  if (!ov || !recent) {
    return (
      <LoansShell>
        <LoansOverviewSkeleton />
      </LoansShell>
    );
  }

  return (
    <LoansShell>
      <StatGrid columns={5}>
        <StatCard
          orientation="vertical"
          icon={<DollarSign size={16} />}
          iconBg="#EEF2FF"
          iconColor="#3B5BDB"
          label="Active Loans"
          value={ov.activeCount.toLocaleString("en-GH")}
          meta={`${fmtCompact(ov.activeAmount)} out`}
        />
        <StatCard
          orientation="vertical"
          icon={<Clock size={16} />}
          iconBg="#FFFBEB"
          iconColor="#B45309"
          label="Pending Disb."
          value={ov.pendingDisbCount.toLocaleString("en-GH")}
          meta={fmtCompact(ov.pendingDisbAmount)}
        />
        <StatCard
          orientation="vertical"
          icon={<AlertTriangle size={16} />}
          iconBg="#FEF2F2"
          iconColor="#DC2626"
          label="PAR (30+)"
          value={`${ov.par30Rate.toFixed(1)}%`}
          meta="30+ days"
          metaColor={LOAN.red}
        />
        <StatCard
          orientation="vertical"
          icon={<TrendingUp size={16} />}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
          label="Arrears"
          value={fmtCompact(ov.arrearsAmount)}
          meta={`${ov.arrears} loans`}
        />
        <StatCard
          orientation="vertical"
          icon={<BarChart2 size={16} />}
          iconBg="#ECFDF5"
          iconColor="#059669"
          label="Collections"
          value={fmtCompact(ov.collections)}
          meta="this month"
          metaColor={LOAN.green}
        />
      </StatGrid>

      <div className="mt-4">
        <SectionCard
          title="Application Pipeline"
          action={<Link className="text-xs" to="/loans/applications">View board →</Link>}
        >
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {PIPELINE_STAGES.map((s) => {
              const stage = ov.pipeline[s.key];
              return (
                <div
                  key={s.key}
                  style={{ border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 14 }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }}
                    />
                    <span style={{ fontSize: 12, color: LOAN.muted, fontWeight: 300 }}>
                      {s.label}
                    </span>
                  </div>
                  <div
                    style={{
                      ...fontDisplay,
                      fontSize: 22,
                      fontWeight: 200,
                      color: LOAN.ink,
                      marginTop: 6,
                    }}
                  >
                    {stage?.count ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2 }}>
                    {fmtCompact(stage?.amount ?? 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <TableCard
          title="Recent Applications"
          actions={<Link className="text-xs" to="/loans/applications">View all →</Link>}
        >
          <Table>
            <THead>
              <Th>Applicant</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </THead>
            <tbody>
              {recent.slice(0, 3).map((a) => (
                <Tr key={a.id} hover>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={a.client} bg={a.avatar} size={28} />
                      <div>
                        <div style={{ fontWeight: 300 }}>{a.client}</div>
                        <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>{a.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{a.product}</Td>
                  <Td style={{ fontWeight: 100 }}>{fmtGHS(a.amount)}</Td>
                  <Td>
                    <StagePill stage={a.stage} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>

        <SectionCard title="Arrears Aging">
          <div className="space-y-3">
            {(() => {
              const maxAmount = Math.max(
                1,
                ...ARREARS_BUCKETS.map((b) => ov.arrearsAging[b.key]?.amount ?? 0),
              );
              return ARREARS_BUCKETS.map((b) => {
                const bucket = ov.arrearsAging[b.key];
                const amount = bucket?.amount ?? 0;
                return (
                  <AgingBar
                    key={b.key}
                    label={b.label}
                    amt={fmtCompact(amount)}
                    pct={Math.round((amount / maxAmount) * 100)}
                    color={b.color}
                  />
                );
              });
            })()}
          </div>
        </SectionCard>
      </div>
    </LoansShell>
  );
}

/** Rough placeholder for the overview while the first-ever load is in
 * flight - never a fixture standing in for real numbers. */
function LoansOverviewSkeleton() {
  const cardStyle = { border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 16 };
  return (
    <>
      <StatGrid columns={5}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={cardStyle}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-3 w-20 mt-4" />
            <Skeleton className="h-6 w-14 mt-2" />
            <Skeleton className="h-3 w-16 mt-2" />
          </div>
        ))}
      </StatGrid>

      <div className="mt-4">
        <SectionCard title="Application Pipeline">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ ...cardStyle, padding: 14 }}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-10 mt-3" />
                <Skeleton className="h-3 w-12 mt-2" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <TableCard title="Recent Applications">
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </TableCard>

        <SectionCard title="Arrears Aging">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}

function AgingBar({
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
        className="flex items-center justify-between"
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
