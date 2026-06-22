import type { ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(16,33,73,0.35)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          width: "100%",
          maxWidth,
          border: `1px solid ${tokens.border}`,
          fontFamily: FONTS.body,
        }}
      >
        <div style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 700, color: "#16233F", marginBottom: 18 }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        {footer && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function MField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#16233F", fontFamily: FONTS.body }}>{label}</span>
      {children}
    </label>
  );
}

const baseInputStyle: React.CSSProperties = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: FONTS.body,
  color: "#16233F",
  outline: "none",
  background: "#fff",
  width: "100%",
};

export function MInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseInputStyle, ...(props.style ?? {}) }} />;
}
export function MTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...baseInputStyle, resize: "vertical", ...(props.style ?? {}) }} />;
}
export function MSelect({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <select {...props} style={{ ...baseInputStyle, ...(props.style ?? {}) }}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function MCancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${tokens.border}`,
        background: "#fff",
        color: "#16233F",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONTS.body,
        cursor: "pointer",
      }}
    >
      Cancel
    </button>
  );
}
export function MNavyBtn({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#94A3B8" : "#002663",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONTS.body,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
