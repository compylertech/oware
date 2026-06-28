import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { tokens } from "@/lib/tokens";

export type FilterOption = { label: string; value: string };

/**
 * Reusable working filter dropdown. Shows "Label: value" and opens a menu of
 * options. Controlled via `value`/`onChange`. Replaces the per-page static
 * "SelectPill" buttons that didn't actually filter anything.
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fff",
          border: `1px solid ${tokens.border}`,
          color: tokens.text,
          fontSize: 13,
          fontWeight: 300,
          lineHeight: 1.2,
          borderRadius: 8,
          padding: "8px 12px",
          height: 36,
          cursor: "pointer",
        }}
      >
        {label ? <span style={{ color: tokens.textMuted, fontWeight: 500 }}>{label}:</span> : null}
        <span>{current?.label ?? value}</span>
        <ChevronDown
          size={14}
          color={tokens.textMuted}
          style={{ transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 30,
            minWidth: 180,
            background: "#fff",
            border: `1px solid ${tokens.border}`,
            borderRadius: 8,
            padding: 4,
            boxShadow: "0 8px 24px rgba(13,27,62,0.10)",
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                color: tokens.text,
                background: o.value === value ? "rgba(0,38,99,0.08)" : "transparent",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "#F4F6FB";
              }}
              onMouseLeave={(e) => {
                if (o.value !== value) e.currentTarget.style.background = "transparent";
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterSelect;
