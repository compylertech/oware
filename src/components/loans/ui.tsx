import { LOAN } from "@/lib/tokens";
import { FONTS } from "@/lib/tokens";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import {
  Pill,
  Table as BaseTable,
  THead as BaseTHead,
  Tr as BaseTr,
  Th as BaseTh,
  Td as BaseTd,
} from "@/components/patterns";

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
      <div style={{ fontSize: 14, fontWeight: 100, color: LOAN.ink }}>{title}</div>
      {action ? (
        <div style={{ fontSize: 12, color: LOAN.blue, fontWeight: 300 }}>{action}</div>
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
        fontWeight: 100,
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
      <span style={{ fontSize: 12, color: LOAN.muted, fontWeight: 300 }}>{pct}%</span>
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
      <div style={{ fontSize: 12, color: LOAN.muted, fontWeight: 300 }}>{label}</div>
      <div
        style={{
          ...fontDisplay,
          fontSize: 20,
          fontWeight: 200,
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
            fontWeight: 300,
          }}
        >
          {meta}
        </div>
      )}
    </Panel>
  );
}

export function Table({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <BaseTable style={style}>{children}</BaseTable>;
}

export function THead({ children }: { children: ReactNode }) {
  return <BaseTHead>{children}</BaseTHead>;
}

export function Tr({
  children,
  hover,
  style,
  ...props
}: {
  children: ReactNode;
  hover?: boolean;
} & HTMLAttributes<HTMLTableRowElement>) {
  return (
    <BaseTr
      hover={hover}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </BaseTr>
  );
}

export function Th({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <BaseTh
      style={{
        color: LOAN.muted,
        ...style,
      }}
    >
      {children}
    </BaseTh>
  );
}

export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <BaseTd
      numeric
      style={{
        color: LOAN.ink,
        ...style,
      }}
    >
      {children}
    </BaseTd>
  );
}

export function TypePill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <Pill color={color} bg={bg} size="sm">
      {label}
    </Pill>
  );
}

