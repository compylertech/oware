import type { CSSProperties, ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

type PageHeaderProps = {
  /** Small uppercase label above the title (breadcrumb-style parent/module). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Optional leading icon shown beside the title. */
  icon?: ReactNode;
  /** Right-aligned actions (buttons, toggles). */
  actions?: ReactNode;
  /** "plain" sits on the page background; "hero" is the navy gradient card. */
  variant?: "plain" | "hero";
  /** Extra content rendered inside the header (e.g. stat row in hero). */
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * Canonical page header. Replaces the five different bespoke header treatments
 * across the app so every page leads with the same eyebrow → title → subtitle
 * rhythm and right-aligned actions.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  variant = "plain",
  children,
  style,
}: PageHeaderProps) {
  const hero = variant === "hero";
  const eyebrowColor = hero ? "rgba(255,255,255,0.6)" : tokens.textMuted;
  const titleColor = hero ? "#FFFFFF" : tokens.text;
  const subColor = hero ? "rgba(255,255,255,0.75)" : tokens.textSub;

  return (
    <div
      style={{
        ...(hero
          ? {
              background: `linear-gradient(135deg, ${tokens.navy} 0%, ${tokens.navyLight} 100%)`,
              borderRadius: 16,
              padding: "24px 28px",
            }
          : {}),
        fontFamily: FONTS.body,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {eyebrow ? (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: eyebrowColor,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, marginTop: eyebrow ? 6 : 0 }}
          >
            {icon ? (
              <span style={{ display: "grid", placeItems: "center", color: titleColor }}>
                {icon}
              </span>
            ) : null}
            <h1
              style={{
                fontFamily: FONTS.display,
                fontSize: 26,
                fontWeight: 800,
                color: titleColor,
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {title}
            </h1>
          </div>
          {subtitle ? (
            <p
              style={{
                color: subColor,
                fontSize: 14,
                maxWidth: 680,
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default PageHeader;
