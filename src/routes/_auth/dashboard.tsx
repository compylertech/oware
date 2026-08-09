import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  UserCircle2,
  Package,
  BarChart3,
  Building2,
  UserCog,
  BookOpen,
} from "lucide-react";
import {
  Area,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  CashTransactionDrawer,
  type CashTxType,
} from "@/components/dashboard/CashTransactionDrawer";
import { StatCard, StatGrid } from "@/components/patterns";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/api/backend";
import { useBackendData } from "@/api/useBackendData";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Trailing N calendar months (inclusive of the current month) - gives both
 * charts a known, gap-fillable window instead of relying on the endpoints'
 * own "trailing 7 months" default, which we can't see the boundaries of. */
function trailingMonths(count: number): { year: number; month: number }[] {
  const now = new Date();
  const out: { year: number; month: number }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

function monthRangeDates(months: { year: number; month: number }[]): {
  fromDate: string;
  toDate: string;
} {
  const first = months[0];
  const last = months[months.length - 1];
  const fromDate = `${first.year}-${String(first.month).padStart(2, "0")}-01`;
  const lastDay = new Date(last.year, last.month, 0).getDate();
  const toDate = `${last.year}-${String(last.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { fromDate, toDate };
}

function fmtCompactGHS(n: number): string {
  if (n >= 1_000_000) return `GH₵ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `GH₵ ${Math.round(n / 1_000)}K`;
  return `GH₵ ${n.toLocaleString("en-GH", { maximumFractionDigits: 0 })}`;
}

function DashboardPage() {
  const [cashTxType, setCashTxType] = useState<CashTxType | null>(null);

  // Trailing 7 calendar months (inclusive of the current month) - sent
  // explicitly so both charts share exactly one known window, rather than
  // trusting each endpoint's own default and reverse-engineering the range
  // from whatever (possibly sparse) months come back.
  const months = useMemo(() => trailingMonths(7), []);
  const { fromDate, toDate } = useMemo(() => monthRangeDates(months), [months]);

  const { data: summary } = useBackendData("dashboard:summary", () => dashboardApi.summary());
  const { data: growthRaw } = useBackendData(`dashboard:growth:${fromDate}:${toDate}`, () =>
    dashboardApi.clientGrowth({ fromDate, toDate }),
  );
  const { data: volumeRaw } = useBackendData(`dashboard:volume:${fromDate}:${toDate}`, () =>
    dashboardApi.transactionVolume({ fromDate, toDate }),
  );

  // Sparse months (zero activity) are simply absent from the API response -
  // fill every month in the window to zero so the chart always shows a
  // continuous 7-bar axis instead of silently compressing/skipping gaps.
  const growthData = months.map(({ year, month }) => {
    const found = growthRaw?.find((p) => p.year === year && p.month === month);
    return { month: MONTH_SHORT[month - 1], clients: found?.newClientsCount ?? 0 };
  });
  const volumeData = months.map(({ year, month }) => {
    const found = volumeRaw?.find((p) => p.year === year && p.month === month);
    return {
      month: `${MONTH_SHORT[month - 1]} ${year}`,
      total: found?.transactionCount ?? 0,
      net: Math.round(found?.netVolume ?? 0),
      variance: Math.round(found?.variance ?? 0),
    };
  });

  // "+X% vs <prev month>" badge isn't returned by the API - computed
  // client-side from the raw (un-padded) response per the integration doc.
  // Hidden if there's fewer than 2 real data points yet, or the baseline
  // month is zero (would be a divide-by-zero / infinite percentage).
  const growthDelta = useMemo(() => {
    if (!growthRaw || growthRaw.length < 2) return null;
    const last = growthRaw[growthRaw.length - 1];
    const prev = growthRaw[growthRaw.length - 2];
    if (!prev.newClientsCount) return null;
    const pct = ((last.newClientsCount - prev.newClientsCount) / prev.newClientsCount) * 100;
    return { pct, label: MONTH_SHORT[prev.month - 1] };
  }, [growthRaw]);

  const currentMonthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F4F6FB" }}>
      <div className="p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-[#101828] leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Welcome back - here's what's happening today.
            </p>
          </div>
          {/* <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-500 border border-blue-100 text-xs font-medium opacity-50 pointer-events-none select-none">
            Teller Account
          </span> */}
        </div>

        {/* KPI Strip */}
        {!summary ? (
          <StatGrid columns={4} style={{ marginBottom: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px] w-full rounded-2xl" />
            ))}
          </StatGrid>
        ) : (
          <StatGrid columns={4} style={{ marginBottom: 16 }}>
            <StatCard
              label="Total Clients"
              value={summary.totalClients.toLocaleString("en-GH")}
              icon={<Users size={18} />}
              iconBg="#EFF6FF"
              iconColor="#2563EB"
            />
            <StatCard
              label="Active Accounts"
              value={summary.activeAccounts.toLocaleString("en-GH")}
              icon={<CreditCard size={18} />}
              iconBg="#F5F3FF"
              iconColor="#7C3AED"
            />
            <StatCard
              label={`Deposits (${currentMonthName})`}
              value={fmtCompactGHS(summary.depositsThisMonth)}
              icon={<TrendingUp size={18} />}
              iconBg="#ECFDF5"
              iconColor="#059669"
            />
            <StatCard
              label="Pending KYC"
              value={summary.pendingKycCount.toLocaleString("en-GH")}
              icon={<Clock size={18} />}
              iconBg="#FFF7ED"
              iconColor="#EA580C"
            />
          </StatGrid>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* A - Quick Action */}
          <Panel className="col-span-1">
            <PanelTitle title="Quick Action" />
            <QuickActions onCashTx={setCashTxType} />
          </Panel>

          {/* B - Transaction Volume */}
          <Panel className="col-span-2 flex flex-col" style={{ paddingBottom: 16 }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[15px] font-bold text-[#101828]">Transaction Volume</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Transaction count vs net volume · last 7 months
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <LegendItem color="#2F7CF6" label="Transactions" />
                <LegendItem color="#219873" label="Net Volume" />
                <LegendItem color="#8B6CF6" label="Variance" />
              </div>
            </div>
            {!volumeRaw ? (
              <Skeleton className="w-full" style={{ flex: 1, minHeight: 420 }} />
            ) : (
              <VolumeChart data={volumeData} />
            )}
          </Panel>

          {/* C - Client Growth */}
          <Panel className="col-span-1 flex flex-col">
            <div className="mb-4">
              <div className="text-[15px] font-bold text-[#101828]">Client Growth</div>
              <div className="text-xs text-gray-400 mt-0.5">New registrations · 7 months</div>
            </div>
            {!growthRaw ? (
              <Skeleton className="w-full" style={{ flex: 1, minHeight: 300 }} />
            ) : (
              <GrowthChart data={growthData} delta={growthDelta} />
            )}
          </Panel>

          {/* D - Recent Activity - no backend endpoint documented yet
              (dashboard-api-integration.md covers only the two charts and
              the summary cards), so this stays an honest placeholder rather
              than fabricated names/events. */}
          <Panel className="col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[15px] font-bold text-[#101828]">Recent Activity</div>
                <div className="text-xs text-gray-400 mt-0.5">Latest client & account events</div>
              </div>
            </div>
            <div className="py-6 text-center text-xs text-gray-400">
              No activity feed endpoint yet.
            </div>
          </Panel>
        </div>
      </div>

      <CashTransactionDrawer type={cashTxType} onClose={() => setCashTxType(null)} />
    </div>
  );
}

function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-[#DDE4EF] p-5 ${className}`} style={style}>
      {children}
    </div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <div className="text-[15px] font-bold text-[#101828] mb-4">{title}</div>;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function QuickActions({ onCashTx }: { onCashTx: (t: CashTxType) => void }) {
  const navigate = useNavigate();
  const tiles: Array<{
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    onClick?: () => void;
    disabled?: boolean;
  }> = [
    {
      label: "Transactions",
      Icon: ArrowLeftRight,
      onClick: () => navigate({ to: "/transactions" }),
    },
    { label: "Cash Deposits", Icon: ArrowDownCircle, onClick: () => onCashTx("deposit") },
    { label: "Cash Withdrawal", Icon: ArrowUpCircle, onClick: () => onCashTx("withdraw") },
    { label: "Clients", Icon: UserCircle2, onClick: () => navigate({ to: "/clients" }) },
    { label: "Products", Icon: Package, onClick: () => navigate({ to: "/products" }) },
    { label: "Reports", Icon: BarChart3, onClick: () => navigate({ to: "/reports" }) },
    { label: "Offices", Icon: Building2, disabled: true },
    { label: "User Management", Icon: UserCog, disabled: true },
    { label: "Chart Of Accounts", Icon: BookOpen, disabled: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-[10px]">
      {tiles.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={t.onClick}
          disabled={t.disabled}
          className={`aspect-square rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 transition-colors ${
            t.disabled ? "opacity-[0.35] cursor-not-allowed" : "hover:bg-gray-100 cursor-pointer"
          }`}
          style={{ padding: 16 }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "transparent",
            }}
          >
            <t.Icon className={`h-5 w-5 ${t.disabled ? "text-gray-300" : "text-[#002663]"}`} />
          </div>
          <span
            className={`text-[12px] font-medium text-center leading-tight ${t.disabled ? "text-gray-400" : "text-[#101828]"}`}
          >
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  valueSuffix?: string;
  currency?: boolean;
};

function ChartTooltip({ active, payload, valueSuffix, currency }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-100  px-3 py-2 text-xs">
      {payload.map((p: TooltipEntry) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-[#101828]">
            {currency ? `GH₵ ${p.value}K` : `${p.value}${valueSuffix ?? ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}

type VolumeDatum = { month: string; total: number; net: number; variance: number };

function VolumeChart({ data }: { data: VolumeDatum[] }) {
  // Real data scale varies a lot month to month (netVolume can jump from
  // hundreds to tens of thousands) - domains are derived from the actual
  // data with headroom, not the fixed dummy-scaled ticks this used to have.
  const leftMax = Math.max(1, ...data.map((d) => d.total));
  const rightValues = data.flatMap((d) => [d.net, d.variance]);
  const rightMax = Math.max(1, ...rightValues);
  const rightMin = Math.min(0, ...rightValues);
  const leftDomain: [number, number] = [0, Math.ceil(leftMax * 1.2)];
  const rightDomain: [number, number] = [Math.floor(rightMin * 1.2), Math.ceil(rightMax * 1.2)];
  return (
    <div style={{ position: "relative", flex: 1, minHeight: 420 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#71809F",
        }}
      >
        Volume (Transactions)
      </div>
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#71809F",
        }}
      >
        Net Volume
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 38, right: 34, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotalVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F7CF6" stopOpacity={0.26} />
              <stop offset="85%" stopColor="#2F7CF6" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="gradNetVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1F9A75" stopOpacity={0.2} />
              <stop offset="90%" stopColor="#1F9A75" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gradVarianceBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B6CF6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#8B6CF6" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#DCE4F1" strokeDasharray="4 5" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            dy={12}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <YAxis
            yAxisId="left"
            domain={leftDomain}
            allowDecimals={false}
            axisLine={{ stroke: "#DCE4F1" }}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={rightDomain}
            allowDecimals={false}
            axisLine={{ stroke: "#DCE4F1" }}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#DCE4F1" }} />
          <Bar
            yAxisId="right"
            dataKey="variance"
            name="Variance"
            fill="url(#gradVarianceBar)"
            stroke="#B8A8FF"
            strokeWidth={1}
            barSize={36}
            radius={[4, 4, 0, 0]}
          >
            <LabelList
              dataKey="variance"
              position="top"
              offset={10}
              fill="#6D55D8"
              fontSize={11}
              fontWeight={700}
            />
          </Bar>
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="total"
            name="Transactions"
            stroke="#2F7CF6"
            strokeWidth={2.5}
            fill="url(#gradTotalVolume)"
            dot={{ r: 5, fill: "#2F7CF6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          >
            <LabelList
              dataKey="total"
              position="top"
              offset={12}
              fill="#2F7CF6"
              fontSize={11}
              fontWeight={700}
            />
          </Area>
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="net"
            name="Net Volume"
            stroke="#219873"
            strokeWidth={2.25}
            fill="url(#gradNetVolume)"
            dot={{ r: 5, fill: "#219873", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
          >
            <LabelList
              dataKey="net"
              position="bottom"
              offset={12}
              fill="#219873"
              fontSize={11}
              fontWeight={700}
            />
          </Area>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

type GrowthDatum = { month: string; clients: number };
type GrowthDelta = { pct: number; label: string } | null;

function GrowthChart({ data, delta }: { data: GrowthDatum[]; delta: GrowthDelta }) {
  const maxClients = Math.max(1, ...data.map((d) => d.clients));
  const domainMax = Math.ceil((maxClients * 1.2) / 5) * 5;
  return (
    <div style={{ position: "relative", flex: 1, minHeight: 300 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#71809F",
        }}
      >
        New Registrations
      </div>
      {delta && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            border: `1px solid ${delta.pct >= 0 ? "#BBF7D0" : "#FECDCA"}`,
            borderRadius: 8,
            background: delta.pct >= 0 ? "#F0FDF4" : "#FEF3F2",
            color: delta.pct >= 0 ? "#16A34A" : "#D92D20",
            padding: "7px 10px",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.2,
            boxShadow: "0 8px 18px rgba(22, 163, 74, 0.08)",
          }}
        >
          {delta.pct >= 0 ? "+" : ""}
          {delta.pct.toFixed(1)}%
          <div style={{ marginTop: 3, color: "#5B6A86", fontSize: 10, fontWeight: 700 }}>
            vs {delta.label}
          </div>
          <span
            style={{
              position: "absolute",
              left: 28,
              bottom: -7,
              width: 12,
              height: 12,
              background: delta.pct >= 0 ? "#F0FDF4" : "#FEF3F2",
              borderRight: `1px solid ${delta.pct >= 0 ? "#BBF7D0" : "#FECDCA"}`,
              borderBottom: `1px solid ${delta.pct >= 0 ? "#BBF7D0" : "#FECDCA"}`,
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 40, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gradClientGrowth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F5DFF" stopOpacity={0.86} />
              <stop offset="100%" stopColor="#AFC2FF" stopOpacity={0.76} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#DCE4F1" strokeDasharray="4 5" vertical={false} />
          <XAxis
            dataKey="month"
            axisLine={{ stroke: "#DCE4F1" }}
            tickLine={false}
            dy={10}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <YAxis
            domain={[0, domainMax]}
            allowDecimals={false}
            axisLine={{ stroke: "#DCE4F1" }}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(47, 93, 255, 0.05)" }}
            content={({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-xs">
                  <span className="font-semibold text-[#101828]">{payload[0].value} clients</span>
                </div>
              );
            }}
          />
          <Bar
            dataKey="clients"
            fill="url(#gradClientGrowth)"
            stroke="#7F98FF"
            strokeWidth={1}
            barSize={28}
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="clients"
            stroke="#2F5DFF"
            strokeWidth={2.25}
            dot={{ r: 4, fill: "#2F5DFF", stroke: "#fff", strokeWidth: 1.5 }}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
          >
            <LabelList
              dataKey="clients"
              position="top"
              offset={10}
              fill="#2F5DFF"
              fontSize={12}
              fontWeight={800}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
