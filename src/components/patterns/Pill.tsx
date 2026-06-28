import type { CSSProperties, ReactNode } from "react";

type PillProps = {
  children: ReactNode;
  color: string;
  bg: string;
  /** Border color; when set renders a 1px solid border. */
  border?: string;
  /** Leading status dot in `color`. */
  dot?: boolean;
  /** Leading icon. */
  icon?: ReactNode;
  uppercase?: boolean;
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
};

/**
 * The one rounded badge/pill renderer. Every pill in the app should go through
 * this (or {@link StatusPill}, the semantic status variant built on it) instead
 * of hand-rolling a `<span style={{ borderRadius: 999 }}>`.
 */
export function Pill({
  children,
  color,
  bg,
  border,
  dot,
  icon,
  uppercase,
  size = "md",
  className,
  style,
}: PillProps) {
  const sized: CSSProperties = uppercase
    ? {
        fontSize: 10,
        fontWeight: 100,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        padding: "2px 8px",
      }
    : size === "sm"
      ? { fontSize: 11, fontWeight: 300, padding: "2px 9px" }
      : { fontSize: 12, fontWeight: 300, padding: "3px 10px" };

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        color,
        background: bg,
        border: border ? `1px solid ${border}` : undefined,
        whiteSpace: "nowrap",
        ...sized,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0 }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}

export default Pill;
