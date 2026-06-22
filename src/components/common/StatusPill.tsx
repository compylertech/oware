import { cn } from "@/lib/utils";

export type StatusKind =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Withdrawn"
  | "Credit"
  | "Deposit"
  | "Debit"
  | "Withdrawal"
  | "Completed"
  | "Failed"
  | "Success"
  | "Passed"
  | "Inactive"
  | "Draft"
  | "Overdue"
  | "Ineligible"
  | "Needs review"
  | "Regulatory"
  | "Membership";

type Tone = "green" | "amber" | "red" | "gray" | "blue";

const TONE: Record<Tone, { text: string; bg: string; border: string; dot: string }> = {
  green: { text: "#067647", bg: "#ECFDF3", border: "#ABEFC6", dot: "#067647" },
  amber: { text: "#B45309", bg: "#FFFBEB", border: "#FEDF89", dot: "#D97706" },
  red:   { text: "#D92D20", bg: "#FEF3F2", border: "#FECDCA", dot: "#D92D20" },
  gray:  { text: "#475467", bg: "#F2F4F7", border: "#D0D5DD", dot: "#475467" },
  blue:  { text: "#3551A4", bg: "#EEF2FB", border: "#C7D3F0", dot: "#3551A4" },
};

const STATUS_TONE: Record<StatusKind, Tone> = {
  Active: "green",
  Completed: "green",
  Credit: "green",
  Deposit: "green",
  Success: "green",
  Passed: "green",
  Pending: "amber",
  "Needs review": "amber",
  Suspended: "red",
  Failed: "red",
  Debit: "red",
  Withdrawal: "red",
  Overdue: "red",
  Ineligible: "red",
  Withdrawn: "gray",
  Inactive: "gray",
  Draft: "gray",
  Regulatory: "blue",
  Membership: "blue",
};

const ON_DARK: Partial<Record<StatusKind, { text: string; bg: string; border: string; dot: string }>> = {
  Active:    { text: "#86EFAC", bg: "rgba(16,185,129,0.15)", border: "rgba(134,239,172,0.35)", dot: "#86EFAC" },
  Pending:   { text: "#FCD34D", bg: "rgba(245,158,11,0.18)", border: "rgba(252,211,77,0.35)", dot: "#FCD34D" },
  Suspended: { text: "#FCA5A5", bg: "rgba(220,38,38,0.18)", border: "rgba(252,165,165,0.35)", dot: "#FCA5A5" },
  Withdrawn: { text: "#CBD5E1", bg: "rgba(148,163,184,0.18)", border: "rgba(203,213,225,0.35)", dot: "#CBD5E1" },
};

export function StatusPill({
  status,
  variant = "default",
  className,
}: {
  status: StatusKind;
  variant?: "default" | "onDark";
  className?: string;
}) {
  if (variant === "onDark") {
    const s = ON_DARK[status] ?? ON_DARK.Active!;
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 rounded-full", className)}
        style={{
          color: s.text,
          backgroundColor: s.bg,
          border: `1px solid ${s.border}`,
          padding: "3px 10px",
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
        {status}
      </span>
    );
  }
  const s = TONE[STATUS_TONE[status] ?? "gray"];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full", className)}
      style={{
        color: s.text,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
      {status}
    </span>
  );
}

export default StatusPill;
