import type { CSSProperties, ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

export type TabItem<K extends string> = {
  key: K;
  label: ReactNode;
  badge?: number;
};

/**
 * Canonical underline tab bar. Matches the loans navigation / loan-detail look
 * and replaces the per-page segmented-pill and joined-toggle tab variants so
 * tabbed sections behave and look the same everywhere.
 */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  style,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        borderBottom: `1px solid ${tokens.border}`,
        overflowX: "auto",
        ...style,
      }}
    >
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${active ? tokens.navy : "transparent"}`,
              color: active ? tokens.navy : tokens.textMuted,
              fontWeight: active ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: FONTS.body,
            }}
          >
            {t.label}
            {t.badge != null && (
              <span
                style={{
                  background: active ? tokens.navy : "#EEF1F6",
                  color: active ? "#fff" : tokens.textMuted,
                  borderRadius: 999,
                  padding: "1px 8px",
                  fontSize: 10,
                  fontWeight: 100,
                }}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
