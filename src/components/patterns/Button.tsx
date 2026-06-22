import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { tokens } from "@/lib/tokens";

type Variant = "primary" | "outline" | "ghost";
type Size = "md" | "sm";

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const SIZES: Record<Size, { height: number; padding: string; fontSize: number }> = {
  md: { height: 36, padding: "0 16px", fontSize: 13 },
  sm: { height: 32, padding: "0 12px", fontSize: 12 },
};

function variantStyle(variant: Variant, disabled?: boolean): CSSProperties {
  if (variant === "primary") {
    return {
      background: disabled ? "#94A3B8" : tokens.navy,
      color: "#fff",
      border: "none",
    };
  }
  if (variant === "outline") {
    return {
      background: tokens.surface,
      color: tokens.text,
      border: `1px solid ${tokens.border}`,
    };
  }
  return { background: "transparent", color: tokens.text, border: "none" };
}

/**
 * Canonical button. Replaces the per-page inline navy/outline buttons and the
 * loans `NavyBtn`/`OutlineBtn` so primary actions look the same everywhere.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  return (
    <button
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: s.height,
        padding: s.padding,
        borderRadius: 10,
        fontSize: s.fontSize,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        width: full ? "100%" : undefined,
        whiteSpace: "nowrap",
        ...variantStyle(variant, disabled),
        ...style,
      }}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}

export default Button;
