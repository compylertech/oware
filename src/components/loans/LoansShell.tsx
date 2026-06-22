import { Link, useRouterState } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LOAN } from "@/lib/tokens";
import { fontDisplay, NavyBtn, OutlineBtn } from "./ui";
import { NewApplicationDrawer } from "./NewApplicationDrawer";

type Tab = { label: string; to: string; badge?: number };

const TABS: Tab[] = [
  { label: "Overview", to: "/loans" },
  { label: "Applications", to: "/loans/applications", badge: 36 },
  { label: "Active Loans", to: "/loans/active", badge: 1300 },
  { label: "Disbursements", to: "/loans/disbursements", badge: 5 },
  { label: "Repayments", to: "/loans/repayments" },
  { label: "Arrears & PAR", to: "/loans/arrears", badge: 92 },
  { label: "Loan Products", to: "/loans/products" },
  { label: "Approvals", to: "/loans/approvals", badge: 9 },
  { label: "Collateral & Guarantors", to: "/loans/collateral" },
];

const fmtBadge = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

export function LoansShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openWizard, setOpenWizard] = useState(false);

  // Exact match for tab activation
  const activeTab =
    TABS.find((t) => t.to === pathname) ??
    // loan detail rolls under "Active Loans"
    (pathname.startsWith("/loans/") ? TABS.find((t) => t.to === "/loans/active") : TABS[0]) ??
    TABS[0];

  return (
    <div style={{ background: LOAN.pageBg, minHeight: "100%" }}>
      {/* Sub-nav bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: `1px solid ${LOAN.border}`,
          padding: "0 28px",
          overflowX: "auto",
        }}
      >
        <div className="flex items-end gap-1" style={{ height: 50 }}>
          {TABS.map((t) => {
            const active = t === activeTab;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex items-center gap-2"
                style={{
                  height: "100%",
                  padding: "0 14px",
                  borderBottom: `2px solid ${active ? LOAN.navy : "transparent"}`,
                  color: active ? "#0A2F6D" : LOAN.muted,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
                {t.badge != null && (
                  <span
                    style={{
                      background: active ? LOAN.navy : "#EEF1F6",
                      color: active ? "#fff" : LOAN.muted,
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {fmtBadge(t.badge)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page header */}
      <div
        className="flex items-end justify-between"
        style={{ padding: "24px 28px 16px" }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: LOAN.muted,
              textTransform: "uppercase",
            }}
          >
            Loan Management
          </div>
          <h1
            style={{
              ...fontDisplay,
              fontSize: 26,
              fontWeight: 800,
              color: LOAN.ink,
              marginTop: 4,
            }}
          >
            {activeTab.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <OutlineBtn icon={<Download size={14} />}>Export</OutlineBtn>
          <NavyBtn
            icon={<Plus size={14} />}
            onClick={() => setOpenWizard(true)}
          >
            New Application
          </NavyBtn>
        </div>
      </div>

      <div style={{ padding: "0 28px 32px" }}>{children}</div>

      <NewApplicationDrawer open={openWizard} onClose={() => setOpenWizard(false)} />
    </div>
  );
}
