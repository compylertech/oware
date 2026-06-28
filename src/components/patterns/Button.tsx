import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { tokens } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// Semantic convention: `success` (solid green) for affirmative actions —
// add/create/approve/post/register/issue; `danger` (solid red) for negative
// actions — reject/cancel/delete. `primary` (navy) is for neutral primaries.
type Variant =
  | "primary"
  | "primaryOutline"
  | "success"
  | "outline"
  | "ghost"
  | "danger"
  | "dangerOutline"
  | "successOutline";
type Size = "md" | "sm" | "lg";

const GREEN = "#047857";

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
  lg: { height: 40, padding: "0 20px", fontSize: 14 },
};

type ButtonVariantStyle = CSSProperties & {
  "--oware-button-bg": string;
  "--oware-button-color": string;
  "--oware-button-border": string;
  "--oware-button-hover-bg"?: string;
  "--oware-button-hover-color"?: string;
  "--oware-button-hover-border"?: string;
};

function variantStyle(variant: Variant, disabled?: boolean): ButtonVariantStyle {
  if (variant === "primary") {
    return {
      "--oware-button-bg": disabled ? "#94A3B8" : tokens.navy,
      "--oware-button-color": "#fff",
      "--oware-button-border": "none",
    };
  }
  if (variant === "success") {
    return {
      "--oware-button-bg": disabled ? "#94A3B8" : GREEN,
      "--oware-button-color": "#fff",
      "--oware-button-border": "none",
    };
  }
  if (variant === "outline") {
    return {
      "--oware-button-bg": tokens.surface,
      "--oware-button-color": tokens.text,
      "--oware-button-border": `1px solid ${tokens.border}`,
    };
  }
  if (variant === "primaryOutline") {
    return {
      "--oware-button-bg": tokens.surface,
      "--oware-button-color": tokens.navy,
      "--oware-button-border": "1px solid #B8C7E6",
      "--oware-button-hover-bg": tokens.navy,
      "--oware-button-hover-color": "#fff",
      "--oware-button-hover-border": `1px solid ${tokens.navy}`,
    };
  }
  if (variant === "danger") {
    return {
      "--oware-button-bg": disabled ? "#94A3B8" : tokens.danger,
      "--oware-button-color": "#fff",
      "--oware-button-border": "none",
    };
  }
  if (variant === "dangerOutline") {
    return {
      "--oware-button-bg": tokens.surface,
      "--oware-button-color": tokens.danger,
      "--oware-button-border": "1px solid #FECDCA",
      "--oware-button-hover-bg": tokens.danger,
      "--oware-button-hover-color": "#fff",
      "--oware-button-hover-border": `1px solid ${tokens.danger}`,
    };
  }
  if (variant === "successOutline") {
    return {
      "--oware-button-bg": tokens.surface,
      "--oware-button-color": tokens.success,
      "--oware-button-border": "1px solid #A7F3D0",
      "--oware-button-hover-bg": tokens.success,
      "--oware-button-hover-color": "#fff",
      "--oware-button-hover-border": `1px solid ${tokens.success}`,
    };
  }
  return {
    "--oware-button-bg": "transparent",
    "--oware-button-color": tokens.text,
    "--oware-button-border": "none",
  };
}

/**
 * Canonical button. The single button used across the app — every page action,
 * modal footer, and toolbar button renders through this so they look the same
 * everywhere. Use `variant` for intent and `size` for scale; pass `icon` /
 * `iconRight` instead of nesting icons in children.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  full,
  disabled,
  style,
  className,
  children,
  ...rest
}: ButtonProps) {
  const s = SIZES[size];
  return (
    <button
      disabled={disabled}
      className={cn("oware-button", className)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: s.height,
        padding: s.padding,
        borderRadius: 10,
        fontSize: s.fontSize,
        fontWeight: 300,
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
