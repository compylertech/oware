import { Link, useRouterState } from "@tanstack/react-router";
import { Download, Plus, Bell } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LOAN } from "@/lib/tokens";
import { fontDisplay } from "./ui";
import { NewApplicationDrawer } from "./NewApplicationDrawer";
import { Button } from "@/components/patterns";
import { loanReportsApi } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";

type Tab = { label: string; to: string; badge?: number };

const TABS: Tab[] = [
  { label: "Overview", to: "/loans" },
  // Applications/Active Loans badges come from live data (see liveBadges
  // below) rather than a fixture here, so no fake count flashes before it.
  { label: "Applications", to: "/loans/applications" },
  { label: "Active Loans", to: "/loans/active" },
  { label: "Approvals", to: "/loans/approvals" },
  { label: "Disbursements", to: "/loans/disbursements" },
  { label: "Repayments", to: "/loans/repayments" },
  { label: "Arrears & PAR", to: "/loans/arrears", badge: 92 },
  { label: "Loan Products", to: "/loans/products" },
  { label: "Collateral & Guarantors", to: "/loans/collateral" },
];

const fmtBadge = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

export function LoansShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openWizard, setOpenWizard] = useState(false);

  const { data: applicationsTotal } = useBackendData("loans:applications-total", () =>
    loanReportsApi.applicationsTotal(),
  );
  // Same cache key + params as the unfiltered call on the Active Loans page
  // itself, so visiting it doesn't refetch. `totalLoans` mirrors however many
  // rows come back (not a true grand total — see active.tsx), so a large
  // limit is needed here too or this badge would cap at the default page size.
  const { data: activeReport } = useBackendData("loans:active:", () =>
    loanReportsApi.active({ limit: 500 }),
  );
  // Same cache key as the Approvals page's queue fetch.
  const { data: approvalsReport } = useBackendData("loans:approvals", () =>
    loanReportsApi.approvals({ limit: 500 }),
  );
  // Same cache key as the Disbursements page's default (Pending tab, no
  // office/product/date filters) fetch.
  const { data: disbursementsReport } = useBackendData("loans:disbursements:pending:::", () =>
    loanReportsApi.disbursements({ status: "pending", limit: 500 }),
  );
  const liveBadges: Record<string, number | undefined> = {
    "/loans/applications": applicationsTotal ?? undefined,
    "/loans/active": activeReport?.loans.length,
    "/loans/approvals": approvalsReport?.rows.length,
    "/loans/disbursements": disbursementsReport?.pending.length,
  };

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
            const badge = liveBadges[t.to] ?? t.badge;
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
                {badge != null && (
                  <span
                    style={{
                      background: active ? LOAN.navy : "#EEF1F6",
                      color: active ? "#fff" : LOAN.muted,
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontSize: 10,
                      fontWeight: 100,
                    }}
                  >
                    {fmtBadge(badge)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page header */}
      <div className="flex items-end justify-between" style={{ padding: "24px 28px 16px" }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 100,
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
              fontWeight: 200,
              color: LOAN.ink,
              marginTop: 4,
            }}
          >
            {activeTab.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const path = activeTab.to;
            const showExport = [
              "/loans",
              "/loans/applications",
              "/loans/active",
              "/loans/arrears",
            ].includes(path);
            const showNewApp = ["/loans", "/loans/applications"].includes(path);
            const showReminders = path === "/loans/arrears";
            const showNewProduct = path === "/loans/products";
            const showRegisterCollat = path === "/loans/collateral";
            return (
              <>
                {showExport && (
                  <Button variant="primary" icon={<Download size={14} />}>
                    Export
                  </Button>
                )}
                {showNewApp && (
                  <Button
                    variant="success"
                    icon={<Plus size={14} />}
                    onClick={() => setOpenWizard(true)}
                  >
                    New Application
                  </Button>
                )}
                {showReminders && (
                  <Button variant="success" icon={<Bell size={14} />}>
                    Send Reminders
                  </Button>
                )}
                {showNewProduct && (
                  <Button variant="success" icon={<Plus size={14} />}>
                    New Product
                  </Button>
                )}
                {showRegisterCollat && (
                  <Button variant="success" icon={<Plus size={14} />}>
                    Register Collateral
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div style={{ padding: "0 28px 32px" }}>{children}</div>

      <NewApplicationDrawer open={openWizard} onClose={() => setOpenWizard(false)} />
    </div>
  );
}
