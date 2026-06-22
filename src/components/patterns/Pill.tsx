import type { CSSProperties, ReactNode } from "react";

type PillProps = {
  children: ReactNode;
  color: string;
  bg: string;
  border?: string;
  uppercase?: boolean;
  style?: CSSProperties;
};

/**
 * Generic colored pill/badge. Generalizes the bespoke `TypePill` (loans) and
 * `LayerTag` (products/cooperative) so tags share one shape. For status badges
 * with a fixed semantic palette, use `StatusPill` instead.
 */
export function Pill({ children, color, bg, border, uppercase, style }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: uppercase ? "2px 8px" : "2px 10px",
        borderRadius: 999,
        fontSize: uppercase ? 10 : 11,
        fontWeight: uppercase ? 700 : 600,
        letterSpacing: uppercase ? 0.3 : undefined,
        textTransform: uppercase ? "uppercase" : undefined,
        color,
        background: bg,
        border: border ? `1px solid ${border}` : undefined,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Pill;
