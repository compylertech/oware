import { cn } from "@/lib/utils";

export type StatusKind =
  | "Active"
  | "Pending"
  | "Suspended"
  | "Withdrawn"
  | "Credit"
  | "Deposit"
  | "Debit"
  | "Withdrawal";

const STYLES: Record<StatusKind, { text: string; bg: string; dot: string }> = {
  Active:     { text: "#067647", bg: "#ECFDF3", dot: "#067647" },
  Pending:    { text: "#B45309", bg: "#FFFBEB", dot: "#D97706" },
  Suspended:  { text: "#D92D20", bg: "#FEF3F2", dot: "#D92D20" },
  Withdrawn:  { text: "#475467", bg: "#F2F4F7", dot: "#475467" },
  Credit:     { text: "#067647", bg: "#ECFDF3", dot: "#067647" },
  Deposit:    { text: "#067647", bg: "#ECFDF3", dot: "#067647" },
  Debit:      { text: "#D92D20", bg: "#FEF3F2", dot: "#D92D20" },
  Withdrawal: { text: "#D92D20", bg: "#FEF3F2", dot: "#D92D20" },
};

export function StatusPill({
  status,
  className,
}: {
  status: StatusKind;
  className?: string;
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        className,
      )}
      style={{
        color: s.text,
        backgroundColor: s.bg,
        padding: "2px 10px",
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          backgroundColor: s.dot,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

export default StatusPill;
