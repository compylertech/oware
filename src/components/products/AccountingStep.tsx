import { MField, MSelect } from "@/components/common/Modal";
import type { ReferenceValueDto } from "@/api/backend";

// No ACCOUNTING_RULE reference category exists on this backend (confirmed
// live - returns null), so this stays Fineract's fixed, documented set.
export const ACCOUNTING_RULE_OPTIONS = [
  { value: "NONE", label: "None (no GL postings)" },
  { value: "CASH_BASED", label: "Cash based" },
  { value: "ACCRUAL_PERIODIC", label: "Accrual (periodic)" },
  { value: "ACCRUAL_UPFRONT", label: "Accrual (upfront)" },
];

export type GLField = { key: string; label: string };

/** Every GL account field, across all three product types, shows the same
 * full account list rather than one filtered by an assumed required type -
 * confirmed live that the API doc's own per-field type hints aren't fully
 * reliable (e.g. it says transfersInSuspenseAccountCode wants ASSET, the
 * backend actually rejects that and wants LIABILITY). Fineract enforces the
 * real type server-side and names the correct one in a clean 400 if wrong -
 * surfaced via the form's error banner - so guessing client-side would only
 * add a second, less trustworthy source of truth. */
export function AccountingStep({
  accountingRule,
  onAccountingRuleChange,
  glFields,
  glValues,
  onGlChange,
  glOptions,
}: {
  accountingRule: string;
  onAccountingRuleChange: (v: string) => void;
  glFields: GLField[];
  glValues: Record<string, string>;
  onGlChange: (key: string, value: string) => void;
  glOptions: ReferenceValueDto[];
}) {
  const showGlFields = accountingRule !== "NONE";
  const glSelectOptions = glOptions.map((o) => ({
    value: o.code,
    label: `${o.name} - ${o.providerCode ?? "?"}`,
  }));

  return (
    <div className="space-y-4">
      <MField label="Accounting Rule">
        <MSelect
          value={accountingRule}
          onChange={(e) => onAccountingRuleChange(e.target.value)}
          options={ACCOUNTING_RULE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />
      </MField>

      {!showGlFields && (
        <div
          style={{
            background: "#F5F8FE",
            border: "1px solid #DDE4EF",
            color: "#5B6A86",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 12,
          }}
        >
          No GL postings for this product - skip straight to Review.
        </div>
      )}

      {showGlFields && (
        <>
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FEDF89",
              color: "#B45309",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 12,
            }}
          >
            Each GL field expects a specific account type (asset, liability, etc.).
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {glFields.map((f) => (
              <MField key={f.key} label={f.label}>
                <MSelect
                  value={glValues[f.key] ?? ""}
                  onChange={(e) => onGlChange(f.key, e.target.value)}
                  options={
                    glSelectOptions.length
                      ? [{ value: "", label: "Select…" }, ...glSelectOptions]
                      : [{ value: "", label: "Loading…" }]
                  }
                />
              </MField>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
