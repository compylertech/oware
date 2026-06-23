import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CheckSquare,
  Users,
  Wallet,
  Landmark,
  Building2,
  FileBarChart,
  Package,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to?: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Main Menu",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Transactions", to: "/transactions", icon: ArrowLeftRight },
      { label: "Tasks", icon: CheckSquare, disabled: true },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Clients", to: "/clients", icon: Users },
      { label: "Accounts", to: "/clients/account-lookup", icon: Wallet },
      { label: "Loan Management", to: "/loans", icon: Landmark },
      { label: "Cooperative", to: "/cooperative", icon: Building2 },
      { label: "Reports", to: "/reports", icon: FileBarChart },
      { label: "Products", to: "/products", icon: Package },
      { label: "Accounting", icon: Calculator, disabled: true },
    ],
  },
  {
    label: "System",
    items: [{ label: "Administration", to: "/administration", icon: Settings }],
  },
];

const DOT_GRID = "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Longest-match wins so /clients/account-lookup never activates /clients.
  const allPaths = SECTIONS.flatMap((s) =>
    s.items.filter((i) => i.to).map((i) => i.to as string),
  ).sort((a, b) => b.length - a.length);
  const activePath =
    allPaths.find((p) => pathname === p) ??
    allPaths.find((p) => pathname.startsWith(p + "/")) ??
    null;

  return (
    <aside
      className="relative flex h-screen flex-col overflow-hidden text-white"
      style={{
        width: collapsed ? 64 : 220,
        transition: "width 0.25s ease",
        background: "linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)",
      }}
    >
      {/* Dot grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: DOT_GRID,
          backgroundSize: "20px 20px",
          opacity: 0.04,
        }}
      />

      {/* Logo row */}
      <div
        className="relative flex items-center gap-2.5 px-3"
        style={{
          height: 60,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <Shield className="h-4 w-4 text-white" strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span
              className="text-white"
              style={{ fontFamily: "Sora, 'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}
            >
              Oware
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Head Office</span>
          </div>
        )}
      </div>

      {/* Sections */}
      <nav className="relative flex-1 overflow-y-auto px-2 py-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <div
                className="mb-2 px-3"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  <NavRow
                    item={item}
                    active={!!item.to && item.to === activePath}
                    collapsed={collapsed}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="relative flex items-center justify-center gap-2 text-white/70 hover:text-white"
        style={{
          height: 48,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}

function NavRow({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const baseClasses =
    "group relative flex w-full items-center gap-2.5 rounded-lg transition-colors";
  const sizing = "px-3 py-[9px]";

  const content = (
    <>
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
          style={{ width: 3, height: 18, backgroundColor: "#fff" }}
        />
      )}
      <Icon className="shrink-0" style={{ width: 15, height: 15 }} strokeWidth={2} />
      {!collapsed && (
        <span className="truncate" style={{ fontSize: 13 }}>
          {item.label}
        </span>
      )}
    </>
  );

  if (item.disabled || !item.to) {
    return (
      <div
        className={cn(baseClasses, sizing, "cursor-not-allowed")}
        style={{ color: "rgba(255,255,255,0.2)" }}
        aria-disabled
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      className={cn(baseClasses, sizing, "hover:bg-white/10")}
      style={{
        color: active ? "#fff" : "rgba(255,255,255,0.55)",
        backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
        fontWeight: active ? 600 : 500,
      }}
    >
      {content}
    </Link>
  );
}
