import { useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Search } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/clients": "Clients",
  "/clients/add": "Add Client",
  "/loans": "Loan Management",
  "/products": "Products",
  "/cooperative": "Cooperative",
  "/cooperative/membership": "Membership",
  "/cooperative/governance": "Governance",
  "/cooperative/configurations": "Configurations",
  "/reports": "Reports",
  "/administration": "Administration",
};

function titleFromPath(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  // dynamic segments — fall back to last segment, prettified
  const segs = pathname.split("/").filter(Boolean);
  const last = segs[segs.length - 1] ?? "";
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titleFromPath(pathname);

  return (
    <header
      className="flex shrink-0 items-center justify-between bg-white"
      style={{
        height: 60,
        padding: "0 24px",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-gray-400 hover:bg-gray-50"
          style={{ fontSize: 13 }}
        >
          <Search className="h-4 w-4" />
          <span>Search…</span>
        </button>

        <button
          type="button"
          className="relative rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell style={{ width: 18, height: 18 }} />
          <span
            aria-hidden
            className="absolute right-1 top-1 rounded-full"
            style={{ width: 6, height: 6, backgroundColor: "#002663" }}
          />
        </button>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg hover:bg-gray-50"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: "#002663", fontSize: 12, fontWeight: 700 }}
          >
            DQ
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
