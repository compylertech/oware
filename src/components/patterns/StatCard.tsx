import type { CSSProperties, ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

type StatCardProps = {
  label: string;
  value: ReactNode;
  /** Optional leading icon. */
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  /** Secondary line under the value (e.g. "92 loans", "GH₵ 2.1M"). */
  meta?: ReactNode;
  metaColor?: string;
  /** Percentage delta vs. previous period; renders an arrow + colored value. */
  delta?: number;
  up?: boolean;
  /** "horizontal" = icon beside text; "vertical" = icon above text. */
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
};

/**
 * Unified KPI/stat card. Replaces the four divergent local `KpiCard`/`StatCard`
 * definitions (dashboard, loans, cooperative, products) with one component that
 * covers every variant: optional icon, `meta` sub-line, and `delta` trend.
 */
export function StatCard({
  label,
  value,
  icon,
  iconBg = tokens.surface,
  iconColor = tokens.navy,
  meta,
  metaColor,
  delta,
  up,
  orientation = "horizontal",
  style,
}: StatCardProps) {
  const vertical = orientation === "vertical";
  const iconEl = icon ? (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: iconBg,
        color: iconColor,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  ) : null;

  const body = (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 300 }}>{label}</div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 22,
          fontWeight: 200,
          color: tokens.text,
          marginTop: 2,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
      {delta != null ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 12 }}>
          <span style={{ color: up ? tokens.success : tokens.danger, fontWeight: 100 }}>
            {up ? "▲" : "▼"} {Math.abs(delta)}%
          </span>
          <span style={{ color: tokens.textMuted }}>vs last month</span>
        </div>
      ) : meta != null ? (
        <div
          style={{
            fontSize: 11,
            color: metaColor ?? tokens.textMuted,
            marginTop: 3,
            fontWeight: 300,
          }}
        >
          {meta}
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        alignItems: vertical ? "flex-start" : "center",
        gap: vertical ? 10 : 14,
        fontFamily: FONTS.body,
        ...style,
      }}
    >
      {iconEl}
      {body}
    </div>
  );
}

/** Responsive grid wrapper for a row of {@link StatCard}s. */
export function StatGrid({
  columns,
  children,
  style,
}: {
  /** Fixed column count; omit for auto-fit min-220px columns. */
  columns?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: columns
          ? `repeat(${columns}, minmax(0, 1fr))`
          : "repeat(auto-fit, minmax(220px, 1fr))",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default StatCard;
