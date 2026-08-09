import type { CSSProperties, ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

export type SegmentOption<K extends string> = { key: K; label: ReactNode };

/**
 * Flat two-or-more-option toggle for filtering the state of a list below it
 * (queue vs history, pending vs disbursed, board vs table) - distinct from
 * {@link import("./Tabs").Tabs}, which is for navigating between content
 * sections. A segmented control is a filter, not a destination, so it reads
 * as a quiet bordered pill rather than an underline tab.
 */
export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid ${tokens.border}`,
        borderRadius: 8,
        overflow: "hidden",
        ...style,
      }}
    >
      {options.map((o, i) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            style={{
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONTS.body,
              color: active ? "#fff" : tokens.textSub,
              background: active ? tokens.navy : "transparent",
              border: "none",
              borderLeft: i > 0 ? `1px solid ${tokens.border}` : "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
