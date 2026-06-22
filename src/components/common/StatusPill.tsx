import { Pill } from "@/components/patterns/Pill";

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
  | "Membership"
  | "Scheduled"
  | "Cancelled"
  | "Rejected"
  | "Tabled"
  | "Reversed";

export type Tone = "green" | "amber" | "red" | "orange" | "gray" | "blue";

const TONE: Record<Tone, { text: string; bg: string; border: string }> = {
  green: { text: "#067647", bg: "#ECFDF3", border: "#ABEFC6" },
  amber: { text: "#B45309", bg: "#FFFBEB", border: "#FEDF89" },
  red: { text: "#D92D20", bg: "#FEF3F2", border: "#FECDCA" },
  orange: { text: "#C2410C", bg: "#FFF3EA", border: "#FED7AA" },
  gray: { text: "#475467", bg: "#F2F4F7", border: "#D0D5DD" },
  blue: { text: "#3551A4", bg: "#EEF2FB", border: "#C7D3F0" },
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
  Rejected: "red",
  Cancelled: "red",
  Withdrawn: "gray",
  Inactive: "gray",
  Draft: "gray",
  Tabled: "gray",
  Reversed: "gray",
  Regulatory: "blue",
  Membership: "blue",
  Scheduled: "blue",
};

const ON_DARK: Record<string, { text: string; bg: string; border: string }> = {
  green: { text: "#86EFAC", bg: "rgba(16,185,129,0.15)", border: "rgba(134,239,172,0.35)" },
  amber: { text: "#FCD34D", bg: "rgba(245,158,11,0.18)", border: "rgba(252,211,77,0.35)" },
  red: { text: "#FCA5A5", bg: "rgba(220,38,38,0.18)", border: "rgba(252,165,165,0.35)" },
  gray: { text: "#CBD5E1", bg: "rgba(148,163,184,0.18)", border: "rgba(203,213,225,0.35)" },
  orange: { text: "#FDBA74", bg: "rgba(234,88,12,0.18)", border: "rgba(253,186,116,0.35)" },
  blue: { text: "#93C5FD", bg: "rgba(59,91,219,0.18)", border: "rgba(147,197,253,0.35)" },
};

/**
 * Semantic status badge — a special {@link Pill} that always has a border and a
 * status dot. Pass a known `status` (mapped to a tone) or an explicit `tone` +
 * `label` for domain-specific statuses (e.g. loan stages).
 */
export function StatusPill({
  status,
  tone,
  label,
  variant = "default",
  className,
}: {
  status?: StatusKind;
  tone?: Tone;
  label?: React.ReactNode;
  variant?: "default" | "onDark";
  className?: string;
}) {
  const resolvedTone = tone ?? (status ? STATUS_TONE[status] : undefined) ?? "gray";
  const s = variant === "onDark" ? ON_DARK[resolvedTone] : TONE[resolvedTone];
  return (
    <Pill color={s.text} bg={s.bg} border={s.border} dot className={className}>
      {label ?? status}
    </Pill>
  );
}

export default StatusPill;
