import type { ReactNode } from "react";
import { tokens } from "@/lib/tokens";
import type { ReferenceValueDto } from "@/api/backend";

/** Resolve a reference code to its readable name for display - falls back to
 * the raw code if the reference list hasn't loaded yet or has no match. */
export function optionLabel(options: ReferenceValueDto[], code: string): string {
  return options.find((o) => o.code === code)?.name ?? code;
}

/** Loan product GET responses return several enum fields (repaymentFrequencyType,
 * amortizationType, etc.) as Fineract's raw internal numeric id (e.g. "2"),
 * not the human string code ("MONTHS") the create/update payload takes -
 * verified live. Reference rows carry that same numeric id as `providerId`,
 * so it can be matched back to the readable code for prefilling an edit form. */
export function codeFromProviderId(
  options: ReferenceValueDto[],
  raw: string | number | null | undefined,
): string {
  if (raw == null || raw === "") return "";
  const n = Number(raw);
  if (Number.isNaN(n)) return "";
  return options.find((o) => o.providerId === n)?.code ?? "";
}

/** Update endpoints are genuinely partial - an omitted field is left as-is,
 * and there's no way to unset one back to null. So an edit form only ever
 * sends fields that actually changed from what was loaded, and never sends
 * an empty value (an empty field just means "leave unchanged"). */
export function diffField(baseline: string, current: string): string | undefined {
  const next = current.trim();
  if (!next || next === baseline) return undefined;
  return next;
}

export function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 100, color: tokens.text, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 4 }}>
        {children}
      </div>
    </div>
  );
}

export function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "8px 12px", fontSize: 13 }}
    >
      <span style={{ color: tokens.textMuted }}>{label}</span>
      <span style={{ color: tokens.text, fontWeight: 300, textAlign: "right" }}>
        {value ?? "-"}
      </span>
    </div>
  );
}
