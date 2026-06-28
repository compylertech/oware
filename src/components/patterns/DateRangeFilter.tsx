import { X } from "lucide-react";
import { tokens } from "@/lib/tokens";

export function DateRangeFilter({
  label = "Date",
  from,
  to,
  onFromChange,
  onToChange,
}: {
  label?: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  const hasValue = Boolean(from || to);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        height: 36,
        background: "#fff",
        border: `1px solid ${tokens.border}`,
        borderRadius: 8,
        padding: "0 9px",
      }}
    >
      <span style={{ color: tokens.textMuted, fontSize: 13, fontWeight: 500 }}>{label}:</span>
      <DateInput ariaLabel={`${label} from`} value={from} onChange={onFromChange} />
      <span style={{ color: tokens.textMuted, fontSize: 12 }}>to</span>
      <DateInput ariaLabel={`${label} to`} value={to} onChange={onToChange} />
      {hasValue && (
        <button
          type="button"
          aria-label={`Clear ${label.toLowerCase()} filter`}
          onClick={() => {
            onFromChange("");
            onToChange("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 6,
            border: "none",
            background: "#F4F6FB",
            color: tokens.textMuted,
            cursor: "pointer",
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

function DateInput({
  ariaLabel,
  value,
  onChange,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      aria-label={ariaLabel}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 118,
        border: "none",
        outline: "none",
        background: "transparent",
        color: tokens.text,
        fontSize: 12,
        fontWeight: 300,
      }}
    />
  );
}

export default DateRangeFilter;
