import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

const volumeData = [
  { month: "Nov 2024", total: 450, net: 280, variance: 170 },
  { month: "Dec 2024", total: 620, net: 360, variance: 260 },
  { month: "Jan 2025", total: 510, net: 300, variance: 210 },
  { month: "Feb 2025", total: 650, net: 380, variance: 270 },
  { month: "Mar 2025", total: 720, net: 450, variance: 270 },
  { month: "Apr 2025", total: 680, net: 410, variance: 270 },
  { month: "May 2025", total: 845, net: 632, variance: 213 },
];

const growthData = [
  { month: "Nov", clients: 175 },
  { month: "Dec", clients: 208 },
  { month: "Jan", clients: 245 },
  { month: "Feb", clients: 278 },
  { month: "Mar", clients: 318 },
  { month: "Apr", clients: 356 },
  { month: "May", clients: 415 },
];

const activity = [
  { name: "Pearl Adzoko", action: "Account activated", time: "2 min ago" },
  { name: "Kwame Mensah", action: "KYC documents submitted", time: "18 min ago" },
  { name: "Ama Boateng", action: "Deposit · GH₵ 4,500", time: "1 hr ago" },
  { name: "Kofi Asare", action: "Loan application pending", time: "2 hr ago" },
];

function DashboardPage() {
  const [cashTxType, setCashTxType] = useState<CashTxType | null>(null);

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F4F6FB" }}>
      <div className="p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-semibold text-[#101828] leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">
              Welcome back — here's what's happening today.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-500 border border-blue-100 text-xs font-medium opacity-50 pointer-events-none select-none">
            Teller Account
          </span>
        </div>

        {/* KPI Strip */}
        <StatGrid columns={4} style={{ marginBottom: 16 }}>
          <StatCard
            label="Total Clients"
            value="398"
            delta={12.4}
            up
            icon={<Users size={18} />}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
          />
          <StatCard
            label="Active Accounts"
            value="214"
            delta={8.1}
            up
            icon={<CreditCard size={18} />}
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
          />
          <StatCard
            label="Deposits (May)"
            value="GH₵ 830K"
            delta={25.8}
            up
            icon={<TrendingUp size={18} />}
            iconBg="#ECFDF5"
            iconColor="#059669"
          />
          <StatCard
            label="Pending KYC"
            value="23"
            delta={-4.2}
            icon={<Clock size={18} />}
            iconBg="#FFF7ED"
            iconColor="#EA580C"
          />
        </StatGrid>

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
            <VolumeChart />
          </Panel>

          {/* D - Recent Activity (col-span-2) — placed before C visually in spec but spec says C then D. Keep order C then D */}
          {/* C - Client Growth */}
          <Panel className="col-span-1 flex flex-col">
            <div className="mb-4">
              <div className="text-[15px] font-bold text-[#101828]">Client Growth</div>
              <div className="text-xs text-gray-400 mt-0.5">New registrations · 7 months</div>
            </div>
            <GrowthChart />
          </Panel>

          {/* D - Recent Activity */}
          <Panel className="col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[15px] font-bold text-[#101828]">Recent Activity</div>
                <div className="text-xs text-gray-400 mt-0.5">Latest client & account events</div>
              </div>
              <button className="text-xs font-semibold text-[#002663] hover:underline">
                View all
              </button>
            </div>
            <ul>
              {activity.map((a, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 py-3 ${i !== activity.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className="h-8 w-8 rounded-full bg-[#002663] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {a.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#101828] truncate">{a.name}</div>
                    <div className="text-xs text-gray-500 truncate">{a.action}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: "#5B6A86" }}>
                      {a.time}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
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

function VolumeChart() {
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
        <ComposedChart data={volumeData} margin={{ top: 38, right: 34, left: 4, bottom: 0 }}>
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
            domain={[0, 1250]}
            ticks={[0, 250, 500, 750, 1000, 1250]}
            axisLine={{ stroke: "#DCE4F1" }}
            tickLine={false}
            tickFormatter={(value) => value.toLocaleString()}
            tick={{ fontSize: 11, fill: "#71809F", fontWeight: 600 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[-250, 1000]}
            ticks={[-250, 0, 250, 500, 750, 1000]}
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

function GrowthChart() {
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
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          border: "1px solid #BBF7D0",
          borderRadius: 8,
          background: "#F0FDF4",
          color: "#16A34A",
          padding: "7px 10px",
          textAlign: "center",
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1.2,
          boxShadow: "0 8px 18px rgba(22, 163, 74, 0.08)",
        }}
      >
        +16.6%
        <div style={{ marginTop: 3, color: "#5B6A86", fontSize: 10, fontWeight: 700 }}>vs Apr</div>
        <span
          style={{
            position: "absolute",
            left: 28,
            bottom: -7,
            width: 12,
            height: 12,
            background: "#F0FDF4",
            borderRight: "1px solid #BBF7D0",
            borderBottom: "1px solid #BBF7D0",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={growthData} margin={{ top: 40, right: 8, left: -18, bottom: 0 }}>
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
            domain={[0, 500]}
            ticks={[0, 100, 200, 300, 400, 500]}
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
