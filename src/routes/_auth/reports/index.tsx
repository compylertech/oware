import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, Download, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MSelect, MCancelBtn, MNavyBtn } from "@/components/common/Modal";

export const Route = createFileRoute("/_auth/reports/")({
  component: ReportsPage,
});

type Category = "Financial" | "Regulatory" | "Operational" | "Membership";

type Report = {
  title: string;
  category: Category;
  frequency: string;
  description: string;
  lastGenerated: string;
};

const REPORTS: Report[] = [
  {
    title: "Trial Balance",
    category: "Financial",
    frequency: "Monthly",
    description: "General ledger balances across all accounts.",
    lastGenerated: "14 Jun 2026",
  },
  {
    title: "Income Statement",
    category: "Financial",
    frequency: "Monthly",
    description: "Revenue, expenses and net surplus for the period.",
    lastGenerated: "14 Jun 2026",
  },
  {
    title: "Balance Sheet",
    category: "Financial",
    frequency: "Quarterly",
    description: "Assets, liabilities and members' equity.",
    lastGenerated: "31 Mar 2026",
  },
  {
    title: "BoG Prudential Return",
    category: "Regulatory",
    frequency: "Monthly",
    description: "Bank of Ghana regulatory submission.",
    lastGenerated: "10 Jun 2026",
  },
  {
    title: "Loan Portfolio (PAR) Report",
    category: "Regulatory",
    frequency: "Monthly",
    description: "Portfolio at risk and arrears ageing.",
    lastGenerated: "12 Jun 2026",
  },
  {
    title: "AML / Suspicious Transactions",
    category: "Regulatory",
    frequency: "Weekly",
    description: "Flagged transactions for compliance review.",
    lastGenerated: "17 Jun 2026",
  },
  {
    title: "Daily Transaction Summary",
    category: "Operational",
    frequency: "Daily",
    description: "Teller and channel transaction totals.",
    lastGenerated: "21 Jun 2026",
  },
  {
    title: "Dormant Accounts",
    category: "Operational",
    frequency: "Monthly",
    description: "Accounts with no activity over threshold.",
    lastGenerated: "01 Jun 2026",
  },
  {
    title: "Membership Growth",
    category: "Membership",
    frequency: "Monthly",
    description: "New admissions, withdrawals and net change.",
    lastGenerated: "01 Jun 2026",
  },
];

const CATEGORY_STYLES: Record<Category, { fg: string; bg: string }> = {
  Financial: { fg: "#067647", bg: "#ECFDF3" },
  Regulatory: { fg: "#3551A4", bg: "#EEF2FB" },
  Operational: { fg: "#B45309", bg: "#FFFBEB" },
  Membership: { fg: "#0F6E56", bg: "#E1F5EE" },
};

const FILTERS = ["All", "Financial", "Regulatory", "Operational", "Membership"] as const;

function ReportsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [generating, setGenerating] = useState<Report | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "All" ? REPORTS : REPORTS.filter((r) => r.category === filter)),
    [filter],
  );

  return (
    <div
      style={{
        padding: "24px 28px",
        background: tokens.bg,
        minHeight: "100%",
        fontFamily: FONTS.body,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "#5B6A86",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            REPORTS
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "#EAF0FB",
                color: "#002663",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: FONTS.display,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#16233F",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Reports
              </h1>
              <div style={{ fontSize: 13, color: "#5B6A86", marginTop: 4 }}>
                Generate, schedule and export operational and regulatory reports.
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setScheduleOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${tokens.border}`,
              background: "#fff",
              color: "#16233F",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONTS.body,
              cursor: "pointer",
            }}
          >
            <CalendarClock size={14} /> Schedule report
          </button>
          <button
            onClick={() => toast.success("All reports queued for export")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#002663",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONTS.body,
              cursor: "pointer",
            }}
          >
            <Download size={14} /> Export all
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: "inline-flex",
          background: "#EEF1F6",
          padding: 4,
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: active ? "#fff" : "transparent",
                color: active ? "#002663" : "#5B6A86",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONTS.body,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        {visible.map((r) => {
          const cs = CATEGORY_STYLES[r.category];
          return (
            <div
              key={r.title}
              style={{
                background: "#fff",
                border: `1px solid ${tokens.border}`,
                borderRadius: 12,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span
                  style={{
                    background: cs.bg,
                    color: cs.fg,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    letterSpacing: "0.02em",
                  }}
                >
                  {r.category}
                </span>
                <span style={{ fontSize: 12, color: "#5B6A86" }}>{r.frequency}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#16233F", lineHeight: 1.3 }}>
                {r.title}
              </div>
              <div style={{ fontSize: 13, color: "#5B6A86", lineHeight: 1.45, flex: 1 }}>
                {r.description}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: `1px solid ${tokens.border}`,
                }}
              >
                <span style={{ fontSize: 12, color: "#5B6A86" }}>
                  Last generated: {r.lastGenerated}
                </span>
                <button
                  onClick={() => setGenerating(r)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#002663",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: FONTS.body,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Generate →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {generating && (
        <GenerateModal
          report={generating}
          onClose={() => setGenerating(null)}
          onSubmit={() => {
            setGenerating(null);
            toast.success("Report queued — you'll be notified when ready.");
          }}
        />
      )}

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule report"
        maxWidth={460}
        footer={
          <>
            <MCancelBtn onClick={() => setScheduleOpen(false)} />
            <MNavyBtn
              onClick={() => {
                setScheduleOpen(false);
                toast.success("Report scheduled.");
              }}
            >
              Schedule
            </MNavyBtn>
          </>
        }
      >
        <MField label="Report">
          <MSelect options={REPORTS.map((r) => r.title)} />
        </MField>
        <MField label="Frequency">
          <MSelect options={["Daily", "Weekly", "Monthly", "Quarterly"]} />
        </MField>
        <MField label="Delivery">
          <MSelect options={["In-app notification", "Email", "Both"]} />
        </MField>
      </Modal>
    </div>
  );
}

function GenerateModal({
  report,
  onClose,
  onSubmit,
}: {
  report: Report;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [format, setFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");
  return (
    <Modal
      open
      onClose={onClose}
      title={report.title}
      maxWidth={460}
      footer={
        <>
          <MCancelBtn onClick={onClose} />
          <MNavyBtn onClick={onSubmit}>Generate Report</MNavyBtn>
        </>
      }
    >
      <MField label="Date Range">
        <MSelect options={["This month", "Last month", "This quarter", "Year to date", "Custom"]} />
      </MField>
      <MField label="Branch">
        <MSelect options={["All", "Head Office", "Kumasi", "Takoradi"]} />
      </MField>
      <MField label="Format">
        <div
          style={{ display: "inline-flex", background: "#EEF1F6", padding: 4, borderRadius: 10 }}
        >
          {(["PDF", "Excel", "CSV"] as const).map((f) => {
            const active = format === f;
            return (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  background: active ? "#fff" : "transparent",
                  color: active ? "#002663" : "#5B6A86",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: FONTS.body,
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </MField>
    </Modal>
  );
}
