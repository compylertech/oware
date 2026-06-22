import { LOAN } from "@/lib/tokens";
import { FONTS } from "@/lib/tokens";
import type { CSSProperties, ReactNode } from "react";
import { Button, Pill } from "@/components/patterns";

export const fontBody = { fontFamily: FONTS.body };
export const fontDisplay = { fontFamily: FONTS.display };
export const fontMono = { fontFamily: FONTS.mono };

export function Panel({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: LOAN.cardBg,
        border: `1px solid ${LOAN.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PanelHead({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-5"
      style={{
        height: 48,
        borderBottom: `1px solid ${LOAN.border}`,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: LOAN.ink }}>{title}</div>
      {action ? (
        <div style={{ fontSize: 12, color: LOAN.blue, fontWeight: 600 }}>{action}</div>
      ) : null}
    </div>
  );
}

export function Ava({
  name,
  bg = "#3B5BDB",
  size = 32,
}: {
  name: string;
  bg?: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.max(10, size * 0.38),
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

export function MiniBar({ pct, color = LOAN.green }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: 80,
          height: 6,
          borderRadius: 999,
          background: "#EEF1F6",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            height: "100%",
            background: color,
          }}
        />
      </div>
      <span style={{ fontSize: 12, color: LOAN.muted, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

export function Chip({
  label,
  value,
  meta,
  metaColor,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  metaColor?: string;
}) {
  return (
    <Panel style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: LOAN.muted, fontWeight: 600 }}>{label}</div>
      <div
        style={{
          ...fontDisplay,
          fontSize: 20,
          fontWeight: 800,
          color: LOAN.ink,
          marginTop: 4,
        }}
      >
        {value}
      </div>
      {meta != null && (
        <div
          style={{
            fontSize: 11,
            color: metaColor ?? LOAN.muted,
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {meta}
        </div>
      )}
    </Panel>
  );
}

export function Th({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <th
      style={{
        textAlign: "left",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: LOAN.muted,
        background: "#F8FAFD",
        padding: "10px 14px",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <td
      style={{
        fontSize: 13,
        color: LOAN.ink,
        padding: "12px 14px",
        borderTop: `1px solid ${LOAN.border}`,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function TypePill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <Pill color={color} bg={bg} size="sm">
      {label}
    </Pill>
  );
}

// Thin wrappers over the shared Button so loans pages share one button style.
export function OutlineBtn({
  children,
  onClick,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <Button variant="outline" onClick={onClick} icon={icon}>
      {children}
    </Button>
  );
}

export function NavyBtn({
  children,
  onClick,
  icon,
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  full?: boolean;
}) {
  return (
    <Button onClick={onClick} icon={icon} disabled={disabled} full={full}>
      {children}
    </Button>
  );
}
