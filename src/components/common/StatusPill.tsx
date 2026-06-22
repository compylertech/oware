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

const ON_DARK: Record<StatusKind, { text: string; bg: string; border: string; dot: string }> = {
  Active:     { text: "#6EE7B7", bg: "rgba(5,150,105,0.18)",   border: "rgba(110,231,183,0.35)", dot: "#6EE7B7" },
  Pending:    { text: "#FCD34D", bg: "rgba(217,119,6,0.18)",   border: "rgba(252,211,77,0.35)",  dot: "#FCD34D" },
  Suspended:  { text: "#FCA5A5", bg: "rgba(220,38,38,0.18)",   border: "rgba(252,165,165,0.35)", dot: "#FCA5A5" },
  Withdrawn:  { text: "#CBD5E1", bg: "rgba(148,163,184,0.18)", border: "rgba(203,213,225,0.35)", dot: "#CBD5E1" },
  Credit:     { text: "#6EE7B7", bg: "rgba(5,150,105,0.18)",   border: "rgba(110,231,183,0.35)", dot: "#6EE7B7" },
  Deposit:    { text: "#6EE7B7", bg: "rgba(5,150,105,0.18)",   border: "rgba(110,231,183,0.35)", dot: "#6EE7B7" },
  Debit:      { text: "#FCA5A5", bg: "rgba(220,38,38,0.18)",   border: "rgba(252,165,165,0.35)", dot: "#FCA5A5" },
  Withdrawal: { text: "#FCA5A5", bg: "rgba(220,38,38,0.18)",   border: "rgba(252,165,165,0.35)", dot: "#FCA5A5" },
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
    const s = ON_DARK[status];
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
  const s = STYLES[status];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold", className)}
      style={{
        color: s.text,
        backgroundColor: s.bg,
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

export default StatusPill;
