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
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 32px)",
          border: `1px solid ${tokens.border}`,
          fontFamily: FONTS.body,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "28px 28px 0",
            fontFamily: FONTS.display,
            fontSize: 18,
            fontWeight: 100,
            color: "#16233F",
            marginBottom: 18,
          }}
        >
          {title}
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "0 28px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              flexShrink: 0,
              padding: "24px 28px 28px",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
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
      <span style={{ fontSize: 12, fontWeight: 300, color: "#16233F", fontFamily: FONTS.body }}>
        {label}
      </span>
      {children}
    </label>
  );
}

// Light fill (not white) so an editable field visibly reads as an input
// rather than blending into the modal's white background - same treatment
// used for search bars and the loan application wizard elsewhere in the app.
const baseInputStyle: React.CSSProperties = {
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  fontFamily: FONTS.body,
  color: "#16233F",
  outline: "none",
  background: "#F5F8FE",
  width: "100%",
};

function focusHandlers(
  onFocus?: React.FocusEventHandler<HTMLElement>,
  onBlur?: React.FocusEventHandler<HTMLElement>,
) {
  return {
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = tokens.navy;
      onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      e.currentTarget.style.borderColor = tokens.border;
      onBlur?.(e);
    },
  };
}

export function MInput({ onFocus, onBlur, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...baseInputStyle, ...(props.style ?? {}) }}
    />
  );
}
export function MTextarea({
  onFocus,
  onBlur,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...baseInputStyle, resize: "vertical", ...(props.style ?? {}) }}
    />
  );
}
export type MSelectOption = string | { value: string; label: string };

export function MSelect({
  options,
  onFocus,
  onBlur,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: MSelectOption[] }) {
  return (
    <select
      {...props}
      {...focusHandlers(onFocus, onBlur)}
      style={{ ...baseInputStyle, ...(props.style ?? {}) }}
    >
      {options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
