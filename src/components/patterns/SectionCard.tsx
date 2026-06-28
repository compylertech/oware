import type { CSSProperties, ReactNode } from "react";
import { tokens } from "@/lib/tokens";

type SectionCardProps = {
  /** Optional header title; when set, a 48px header bar with a divider renders. */
  title?: ReactNode;
  /** Right-aligned header action (link/button). */
  action?: ReactNode;
  children: ReactNode;
  /** Apply default 20px body padding. Disable for flush content like tables. */
  padded?: boolean;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
  className?: string;
};

/**
 * Card container with an optional header bar. Generalizes the loans `Panel` +
 * `PanelHead` pair so every page frames its sections the same way.
 */
export function SectionCard({
  title,
  action,
  children,
  padded = true,
  style,
  bodyStyle,
  className,
}: SectionCardProps) {
  return (
    <div
      className={className}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        overflow: "hidden",
        ...style,
      }}
    >
      {title != null ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 48,
            padding: "0 20px",
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 100, color: tokens.text }}>{title}</div>
          {action != null ? (
            <div style={{ fontSize: 12, color: tokens.accent, fontWeight: 300 }}>{action}</div>
          ) : null}
        </div>
      ) : null}
      <div style={{ padding: padded ? 20 : 0, ...bodyStyle }}>{children}</div>
    </div>
  );
}

export default SectionCard;
