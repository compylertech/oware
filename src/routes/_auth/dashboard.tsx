import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CashTransactionDrawer, type CashTxType } from "@/components/dashboard/CashTransactionDrawer";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardPage,
});

const volumeData = [
  { month: "Nov", deposits: 420, withdrawals: 310 },
  { month: "Dec", deposits: 580, withdrawals: 390 },
  { month: "Jan", deposits: 490, withdrawals: 340 },
  { month: "Feb", deposits: 620, withdrawals: 410 },
  { month: "Mar", deposits: 710, withdrawals: 480 },
  { month: "Apr", deposits: 660, withdrawals: 430 },
  { month: "May", deposits: 830, withdrawals: 560 },
];

const growthData = [
  { month: "Nov", clients: 180 },
  { month: "Dec", clients: 210 },
  { month: "Jan", clients: 245 },
  { month: "Feb", clients: 280 },
  { month: "Mar", clients: 320 },
  { month: "Apr", clients: 355 },
  { month: "May", clients: 398 },
];

const activity = [
  { name: "Pearl Adzoko", action: "Account activated", time: "2 min ago", dot: "bg-emerald-500" },
  { name: "Kwame Mensah", action: "KYC documents submitted", time: "18 min ago", dot: "bg-blue-500" },
  { name: "Ama Boateng", action: "Deposit · GHS 4,500", time: "1 hr ago", dot: "bg-emerald-500" },
  { name: "Kofi Asare", action: "Loan application pending", time: "2 hr ago", dot: "bg-orange-500" },
];

function DashboardPage() {
  const [cashTxType, setCashTxType] = useState<CashTxType | null>(null);

  return (
    <div className="min-h-full" style={{ backgroundColor: "#F4F6FB" }}>
      <div className="p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-extrabold text-[#101828] leading-tight">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-1">Welcome back — here's what's happening today.</p>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-500 border border-blue-100 text-xs font-medium opacity-50 pointer-events-none select-none">
            Teller Account
          </span>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard label="Total Clients" value="398" delta={12.4} up tileBg="bg-blue-50" iconColor="text-blue-600" Icon={Users} />
          <KpiCard label="Active Accounts" value="214" delta={8.1} up tileBg="bg-violet-50" iconColor="text-violet-600" Icon={CreditCard} />
          <KpiCard label="Deposits (May)" value="GHS 830K" delta={25.8} up tileBg="bg-emerald-50" iconColor="text-emerald-600" Icon={TrendingUp} />
          <KpiCard label="Pending KYC" value="23" delta={-4.2} up={false} tileBg="bg-orange-50" iconColor="text-orange-500" Icon={Clock} />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* A - Quick Action */}
          <Panel className="col-span-1">
            <PanelTitle title="Quick Action" />
            <QuickActions onCashTx={setCashTxType} />
          </Panel>

          {/* B - Transaction Volume */}
          <Panel className="col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[15px] font-bold text-[#101828]">Transaction Volume</div>
                <div className="text-xs text-gray-400 mt-0.5">Deposits vs withdrawals · last 7 months</div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <LegendItem color="#002663" label="Deposits" />
                <LegendItem color="#93c5fd" label="Withdrawals" />
              </div>
            </div>
            <VolumeChart />
          </Panel>

          {/* D - Recent Activity (col-span-2) — placed before C visually in spec but spec says C then D. Keep order C then D */}
          {/* C - Client Growth */}
          <Panel className="col-span-1">
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
              <button className="text-xs font-semibold text-[#002663] hover:underline">View all</button>
            </div>
            <ul>
              {activity.map((a, i) => (
                <li
                  key={i}
                  className={`flex items-center gap-3 py-3 ${i !== activity.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <div className="h-8 w-8 rounded-full bg-[#002663] text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {a.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#101828] truncate">{a.name}</div>
                    <div className="text-xs text-gray-500 truncate">{a.action}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
                    <span className="text-xs text-gray-400">{a.time}</span>
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

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#DDE4EF] p-5 ${className}`}>{children}</div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return <div className="text-[15px] font-bold text-[#101828] mb-4">{title}</div>;
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  up,
  tileBg,
  iconColor,
  Icon,
}: {
  label: string;
  value: string;
  delta: number;
  up: boolean;
  tileBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const color = up ? "#10b981" : "#f87171";
  return (
    <div className="bg-white rounded-2xl border border-[#DDE4EF] p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl ${tileBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">{label}</div>
        <div className="text-[20px] font-extrabold text-[#101828] leading-tight mt-0.5">{value}</div>
        <div className="flex items-center gap-1 mt-0.5 text-xs">
          <Arrow className="h-3.5 w-3.5" style={{ color }} />
          <span style={{ color }} className="font-semibold">{Math.abs(delta)}%</span>
          <span className="text-gray-400">vs last month</span>
        </div>
      </div>
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
    { label: "Transactions", Icon: ArrowLeftRight, onClick: () => navigate({ to: "/transactions" }) },
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
            t.disabled ? "opacity-[0.35] cursor-not-allowed" : "hover:bg-gray-100"
          }`}
        >
          <t.Icon className={`h-5 w-5 ${t.disabled ? "text-gray-300" : "text-[#002663]"}`} />
          <span className={`text-[12px] font-medium text-center px-1 leading-tight ${t.disabled ? "text-gray-400" : "text-[#101828]"}`}>
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, valueSuffix, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-100  px-3 py-2 text-xs">
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-[#101828]">
            {currency ? `GHS ${p.value}K` : `${p.value}${valueSuffix ?? ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function VolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradDep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002663" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#002663" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradWit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip content={<ChartTooltip currency />} cursor={{ stroke: "#e5e7eb" }} />
        <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#002663" strokeWidth={2.5} fill="url(#gradDep)" dot={false} activeDot={false} />
        <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#93c5fd" strokeWidth={2} fill="url(#gradWit)" dot={false} activeDot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function GrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip
          cursor={{ fill: "rgba(0,38,99,0.04)" }}
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white rounded-lg border border-gray-100  px-3 py-2 text-xs">
                <span className="font-semibold text-[#101828]">{payload[0].value} clients</span>
              </div>
            );
          }}
        />
        <Bar dataKey="clients" fill="#002663" barSize={14} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
