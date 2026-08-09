import { Link, useRouterState } from "@tanstack/react-router";
import { Download, Plus, Bell } from "lucide-react";
import { type ReactNode } from "react";
import { LOAN, tokens } from "@/lib/tokens";
import { fontDisplay } from "./ui";
import { Button } from "@/components/patterns";
import { loanReportsApi } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";

type Tab = { label: string; to: string };
// A group has no route of its own - its children are the real pages. The
// group's nav button links to its first child (a natural "section landing"),
// and once any child is active, the group's row of children shows as a
// second-level tab strip beneath the primary row.
type NavItem = Tab | { label: string; children: Tab[] };

// Applications/Approvals/Disbursements are one loan's journey through three
// sequential stages, not three unrelated pages - same for Active/Repayments/
// Arrears once a loan is disbursed and being serviced. Grouping them this way
// replaces nine flat tabs with four sections without moving any route.
const NAV: NavItem[] = [
  { label: "Overview", to: "/loans" },
  {
    label: "Loan Pipeline",
    children: [
      { label: "Applications", to: "/loans/applications" },
      { label: "Approvals", to: "/loans/approvals" },
      { label: "Disbursements", to: "/loans/disbursements" },
    ],
  },
  {
    label: "Portfolio",
    children: [
      { label: "Active Loans", to: "/loans/active" },
      { label: "Repayments", to: "/loans/repayments" },
      { label: "Arrears & PAR", to: "/loans/arrears" },
    ],
  },
  { label: "Loan Products", to: "/loans/products" },
];

function isGroup(item: NavItem): item is { label: string; children: Tab[] } {
  return "children" in item;
}
const LEAVES: Tab[] = NAV.flatMap((item) => (isGroup(item) ? item.children : [item]));

const fmtBadge = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);

export function LoansShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Loan detail rolls under whichever tab the user actually navigated from
  // (Active Loans vs Disbursements), carried via the ?from= search param -
  // not hardcoded to Active Loans.
  const fromSearch = useRouterState({
    select: (s) => (s.location.search as { from?: string }).from,
  });

  const { data: applicationsTotal } = useBackendData("loans:applications-total", () =>
    loanReportsApi.applicationsTotal(),
  );
  // Same cache key + params as the unfiltered call on the Active Loans page
  // itself, so visiting it doesn't refetch. `totalLoans` mirrors however many
  // rows come back (not a true grand total - see active.tsx), so a large
  // limit is needed here too or this badge would cap at the default page size.
  const { data: activeReport } = useBackendData("loans:active:", () =>
    loanReportsApi.active({ limit: 500 }),
  );
  // Same cache key as the Approvals page's queue fetch.
  const { data: approvalsReport } = useBackendData("loans:approvals", () =>
    loanReportsApi.approvals({ limit: 500 }),
  );
  // Same cache key as the Disbursements page's default (no office/product/
  // date filters) fetch.
  const { data: disbursementsReport } = useBackendData("loans:disbursements:::", () =>
    loanReportsApi.disbursements({ limit: 500 }),
  );
  // Same cache key as the Arrears page's preview fetch. loansInArrears is a
  // summary field unaffected by limit/bucket, so any call returns the real
  // total regardless of how small a page it asks for.
  const { data: arrearsReport } = useBackendData("loans:arrears:preview", () =>
    loanReportsApi.arrears({ limit: 5 }),
  );
  const liveBadges: Record<string, number | undefined> = {
    "/loans/applications": applicationsTotal ?? undefined,
    "/loans/active": activeReport?.loans.length,
    "/loans/approvals": approvalsReport?.rows.length,
    "/loans/disbursements": disbursementsReport?.pending.length,
    "/loans/arrears": arrearsReport?.loansInArrears,
  };
  // A group's own badge is the sum of whichever of its children's live
  // badges have loaded - so "Loan Pipeline" reads as one glance at the whole
  // stage instead of forcing a click into each child to see what's pending.
  function groupBadge(children: Tab[]): number | undefined {
    const values = children.map((c) => liveBadges[c.to]).filter((n): n is number => n != null);
    return values.length ? values.reduce((a, b) => a + b, 0) : undefined;
  }

  const FROM_LEAF_TO: Record<string, string> = {
    disbursements: "/loans/disbursements",
    applications: "/loans/applications",
    approvals: "/loans/approvals",
    arrears: "/loans/arrears",
    active: "/loans/active",
  };
  // Exact match for leaf activation; loan detail (no leaf of its own) rolls
  // under whichever page the user actually navigated from.
  const activeLeaf =
    LEAVES.find((t) => t.to === pathname) ??
    (pathname.startsWith("/loans/")
      ? LEAVES.find((t) => t.to === (FROM_LEAF_TO[fromSearch ?? "active"] ?? "/loans/active"))
      : LEAVES[0]) ??
    LEAVES[0];
  const activeGroup = NAV.find((item) =>
    isGroup(item) ? item.children.includes(activeLeaf) : item === activeLeaf,
  );

  return (
    <div style={{ background: LOAN.pageBg, minHeight: "100%" }}>
      {/* Primary nav */}
      <div
        style={{
          background: "#fff",
          borderBottom: `1px solid ${LOAN.border}`,
          padding: "0 28px",
          overflowX: "auto",
        }}
      >
        <div className="flex items-end gap-1" style={{ height: 50 }}>
          {NAV.map((item) => {
            const active = item === activeGroup;
            const to = isGroup(item) ? item.children[0].to : item.to;
            const badge = isGroup(item) ? groupBadge(item.children) : liveBadges[item.to];
            return (
              <Link
                key={item.label}
                to={to}
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
                {item.label}
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
            Loan Management{activeGroup && isGroup(activeGroup) ? ` · ${activeGroup.label}` : ""}
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
            {activeLeaf.label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const path = activeLeaf.to;
            const showExport = [
              "/loans",
              "/loans/applications",
              "/loans/active",
              "/loans/arrears",
            ].includes(path);
            const showNewApp = ["/loans", "/loans/applications"].includes(path);
            const showReminders = path === "/loans/arrears";
            return (
              <>
                {showExport && (
                  <Button variant="primary" icon={<Download size={14} />}>
                    Export
                  </Button>
                )}
                {showNewApp && (
                  <Link to="/loans/apply">
                    <Button variant="success" icon={<Plus size={14} />}>
                      New Application
                    </Button>
                  </Link>
                )}
                {showReminders && (
                  <Button variant="success" icon={<Bell size={14} />}>
                    Send Reminders
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Sub-tabs - a nested filter within the active section, not a second
          nav bar, so this echoes the primary tabs' underline instead of
          repeating their pill shape. */}
      {activeGroup && isGroup(activeGroup) && (
        <div style={{ padding: "0 28px" }}>
          <div
            className="flex items-center"
            style={{ gap: 26, borderBottom: `1px solid ${LOAN.border}`, marginBottom: 18 }}
          >
            {activeGroup.children.map((t) => {
              const active = t === activeLeaf;
              const badge = liveBadges[t.to];
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="flex items-center"
                  style={{
                    gap: 6,
                    padding: "9px 1px",
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#0A2F6D" : tokens.textSub,
                    borderBottom: `2px solid ${active ? LOAN.navy : "transparent"}`,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                  {badge != null && (
                    <span style={{ color: active ? tokens.textSub : LOAN.muted, fontWeight: 500 }}>
                      {fmtBadge(badge)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: "0 28px 32px" }}>{children}</div>
    </div>
  );
}
