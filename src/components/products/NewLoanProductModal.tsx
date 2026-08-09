import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { Button } from "@/components/patterns";
import { tokens } from "@/lib/tokens";
import { WizardStepper } from "@/components/products/WizardStepper";
import {
  AccountingStep,
  ACCOUNTING_RULE_OPTIONS,
  type GLField,
} from "@/components/products/AccountingStep";
import { ReviewCard, ReviewRow, optionLabel } from "@/components/products/ProductReview";
import { loanProductsApi } from "@/api/loans";
import {
  referencesApi,
  apiErrorMessage,
  type ReferenceValueDto,
  type CreateLoanProductDto,
} from "@/api/backend";
import { refreshBackendData } from "@/api/useBackendData";

// Shared cache key for the loan-product list, used by both /products/loans
// and /loans/products (near-duplicate pages showing the same catalogue) -
// refreshing here updates both without either needing to know about the other.
export const LOAN_PRODUCTS_LIST_KEY = "loans:products";

const STEPS = ["Basic Info", "Loan Terms", "Accounting", "Review"];

const LOAN_GL_FIELDS: GLField[] = [
  { key: "fundSourceAccountCode", label: "Fund Source Account" },
  { key: "loanPortfolioAccountCode", label: "Loan Portfolio Account" },
  { key: "transfersInSuspenseAccountCode", label: "Transfers in Suspense Account" },
  { key: "interestOnLoanAccountCode", label: "Interest on Loan Account" },
  { key: "incomeFromFeeAccountCode", label: "Income from Fees Account" },
  { key: "incomeFromPenaltyAccountCode", label: "Income from Penalty Account" },
  { key: "incomeFromRecoveryAccountCode", label: "Income from Recovery Account" },
  { key: "writeOffAccountCode", label: "Write-off Account" },
  { key: "overpaymentLiabilityAccountCode", label: "Overpayment Liability Account" },
  { key: "receivableInterestAccountCode", label: "Receivable Interest Account" },
  { key: "receivableFeeAccountCode", label: "Receivable Fee Account" },
  { key: "receivablePenaltyAccountCode", label: "Receivable Penalty Account" },
];

const defaultForm = {
  name: "",
  shortName: "",
  description: "",
  currencyCode: "GHS",
  principal: "",
  minPrincipal: "",
  maxPrincipal: "",
  numberOfRepayments: "",
  repaymentEvery: "1",
  repaymentFrequencyType: "MONTHS",
  interestRatePerPeriod: "",
  interestRateFrequencyType: "PER_YEAR",
  amortizationType: "EQUAL_INSTALLMENTS",
  interestType: "DECLINING_BALANCE",
  interestCalculationPeriodType: "DAILY",
  accountingRule: "NONE",
};

export function NewLoanProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceValueDto[]>([]);
  const [repayFreqOptions, setRepayFreqOptions] = useState<ReferenceValueDto[]>([]);
  const [rateFreqOptions, setRateFreqOptions] = useState<ReferenceValueDto[]>([]);
  const [amortizationOptions, setAmortizationOptions] = useState<ReferenceValueDto[]>([]);
  const [interestTypeOptions, setInterestTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [calcPeriodOptions, setCalcPeriodOptions] = useState<ReferenceValueDto[]>([]);
  const [glOptions, setGlOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void referencesApi.list("CURRENCY").then(setCurrencyOptions);
    void referencesApi.list("LOAN_REPAYMENT_FREQUENCY_TYPE").then(setRepayFreqOptions);
    void referencesApi.list("LOAN_INTEREST_RATE_FREQUENCY_TYPE").then(setRateFreqOptions);
    void referencesApi.list("LOAN_AMORTIZATION_TYPE").then(setAmortizationOptions);
    void referencesApi.list("LOAN_INTEREST_TYPE").then(setInterestTypeOptions);
    void referencesApi.list("LOAN_INTEREST_CALCULATION_PERIOD_TYPE").then(setCalcPeriodOptions);
    void referencesApi.list("GL_ACCOUNT").then(setGlOptions);
  }, [open]);

  const [stepIdx, setStepIdx] = useState(0);
  const [furthestStepIdx, setFurthestStepIdx] = useState(0);
  const [f, setF] = useState(defaultForm);
  const [gl, setGl] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function close() {
    setErr(null);
    setStepIdx(0);
    setFurthestStepIdx(0);
    setF(defaultForm);
    setGl({});
    onClose();
  }

  const principal = parseFloat(f.principal);
  const numberOfRepayments = parseInt(f.numberOfRepayments, 10);
  const repaymentEvery = parseInt(f.repaymentEvery, 10);
  const interestRatePerPeriod = parseFloat(f.interestRatePerPeriod);
  const termsValid =
    !!principal &&
    principal > 0 &&
    !!numberOfRepayments &&
    numberOfRepayments > 0 &&
    !!repaymentEvery &&
    repaymentEvery > 0 &&
    !Number.isNaN(interestRatePerPeriod) &&
    interestRatePerPeriod >= 0;

  const needsGl = f.accountingRule !== "NONE";
  const glComplete = !needsGl || LOAN_GL_FIELDS.every((field) => gl[field.key]);

  const stepValid = [
    !!f.name.trim() && !!f.shortName.trim() && !!f.currencyCode,
    termsValid,
    glComplete,
    true,
  ];
  const canGoNext = stepValid[stepIdx];

  function goNext() {
    if (!canGoNext) return;
    const next = Math.min(stepIdx + 1, STEPS.length - 1);
    setStepIdx(next);
    setFurthestStepIdx((v) => Math.max(v, next));
  }

  const payload: CreateLoanProductDto | null = useMemo(() => {
    if (!f.name.trim() || !f.shortName.trim() || !termsValid) return null;
    return {
      name: f.name.trim(),
      shortName: f.shortName.trim(),
      description: f.description.trim() || undefined,
      currencyCode: f.currencyCode,
      principal,
      minPrincipal: f.minPrincipal ? parseFloat(f.minPrincipal) : undefined,
      maxPrincipal: f.maxPrincipal ? parseFloat(f.maxPrincipal) : undefined,
      numberOfRepayments,
      repaymentEvery,
      repaymentFrequencyType: f.repaymentFrequencyType,
      interestRatePerPeriod,
      interestRateFrequencyType: f.interestRateFrequencyType,
      amortizationType: f.amortizationType,
      interestType: f.interestType,
      interestCalculationPeriodType: f.interestCalculationPeriodType,
      accountingRule: f.accountingRule,
      ...(needsGl
        ? {
            fundSourceAccountCode: gl.fundSourceAccountCode,
            loanPortfolioAccountCode: gl.loanPortfolioAccountCode,
            transfersInSuspenseAccountCode: gl.transfersInSuspenseAccountCode,
            interestOnLoanAccountCode: gl.interestOnLoanAccountCode,
            incomeFromFeeAccountCode: gl.incomeFromFeeAccountCode,
            incomeFromPenaltyAccountCode: gl.incomeFromPenaltyAccountCode,
            incomeFromRecoveryAccountCode: gl.incomeFromRecoveryAccountCode,
            writeOffAccountCode: gl.writeOffAccountCode,
            overpaymentLiabilityAccountCode: gl.overpaymentLiabilityAccountCode,
            receivableInterestAccountCode: gl.receivableInterestAccountCode,
            receivableFeeAccountCode: gl.receivableFeeAccountCode,
            receivablePenaltyAccountCode: gl.receivablePenaltyAccountCode,
          }
        : {}),
    };
  }, [
    f,
    gl,
    needsGl,
    termsValid,
    principal,
    numberOfRepayments,
    repaymentEvery,
    interestRatePerPeriod,
  ]);

  async function submit() {
    if (!payload) return;
    setErr(null);
    setSaving(true);
    try {
      const result = await loanProductsApi.create(payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Loan product "${result.name}" created.`);
      await refreshBackendData(LOAN_PRODUCTS_LIST_KEY, () => loanProductsApi.list());
      close();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong creating this product."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New Loan Product"
      maxWidth={640}
      footer={
        <div className="flex w-full items-center justify-between">
          {stepIdx > 0 ? (
            <Button variant="outline" onClick={() => setStepIdx(stepIdx - 1)} disabled={saving}>
              Previous
            </Button>
          ) : (
            <Button variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
          )}
          {stepIdx < STEPS.length - 1 ? (
            <Button variant="success" onClick={goNext} disabled={!canGoNext}>
              Next →
            </Button>
          ) : (
            <Button variant="success" onClick={() => void submit()} disabled={saving || !payload}>
              {saving ? "Creating…" : "Create Product"}
            </Button>
          )}
        </div>
      }
    >
      <WizardStepper
        steps={STEPS}
        currentIndex={stepIdx}
        furthestIndex={furthestStepIdx}
        onStepClick={setStepIdx}
      />

      {stepIdx === 0 && (
        <>
          <MField label="Name">
            <MInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </MField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Short name *">
              <MInput
                value={f.shortName}
                onChange={(e) => setF({ ...f, shortName: e.target.value })}
              />
            </MField>
            <MField label="Currency">
              <MSelect
                value={f.currencyCode}
                onChange={(e) => setF({ ...f, currencyCode: e.target.value })}
                options={
                  currencyOptions.length
                    ? currencyOptions.map((o) => ({
                        value: o.code,
                        label: `${o.name} (${o.code})`,
                      }))
                    : [{ value: "GHS", label: "Ghana Cedi (GHS)" }]
                }
              />
            </MField>
          </div>
          <MField label="Description">
            <MTextarea
              rows={2}
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
            />
          </MField>
        </>
      )}

      {stepIdx === 1 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <MField label="Principal">
              <MInput
                type="number"
                step="0.01"
                value={f.principal}
                onChange={(e) => setF({ ...f, principal: e.target.value })}
              />
            </MField>
            <MField label="Min Principal">
              <MInput
                type="number"
                step="0.01"
                value={f.minPrincipal}
                onChange={(e) => setF({ ...f, minPrincipal: e.target.value })}
              />
            </MField>
            <MField label="Max Principal">
              <MInput
                type="number"
                step="0.01"
                value={f.maxPrincipal}
                onChange={(e) => setF({ ...f, maxPrincipal: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Number of Repayments">
              <MInput
                type="number"
                min={1}
                value={f.numberOfRepayments}
                onChange={(e) => setF({ ...f, numberOfRepayments: e.target.value })}
              />
            </MField>
            <MField label="Repay Every">
              <MInput
                type="number"
                min={1}
                value={f.repaymentEvery}
                onChange={(e) => setF({ ...f, repaymentEvery: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Repayment Frequency">
              <MSelect
                value={f.repaymentFrequencyType}
                onChange={(e) => setF({ ...f, repaymentFrequencyType: e.target.value })}
                options={
                  repayFreqOptions.length
                    ? repayFreqOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["MONTHS"]
                }
              />
            </MField>
            <MField label="Interest Rate Per Period (%)">
              <MInput
                type="number"
                step="0.01"
                value={f.interestRatePerPeriod}
                onChange={(e) => setF({ ...f, interestRatePerPeriod: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Rate Frequency">
              <MSelect
                value={f.interestRateFrequencyType}
                onChange={(e) => setF({ ...f, interestRateFrequencyType: e.target.value })}
                options={
                  rateFreqOptions.length
                    ? rateFreqOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["PER_YEAR"]
                }
              />
            </MField>
            <MField label="Amortization">
              <MSelect
                value={f.amortizationType}
                onChange={(e) => setF({ ...f, amortizationType: e.target.value })}
                options={
                  amortizationOptions.length
                    ? amortizationOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["EQUAL_INSTALLMENTS"]
                }
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Method">
              <MSelect
                value={f.interestType}
                onChange={(e) => setF({ ...f, interestType: e.target.value })}
                options={
                  interestTypeOptions.length
                    ? interestTypeOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["DECLINING_BALANCE"]
                }
              />
            </MField>
            <MField label="Calculation Period">
              <MSelect
                value={f.interestCalculationPeriodType}
                onChange={(e) => setF({ ...f, interestCalculationPeriodType: e.target.value })}
                options={
                  calcPeriodOptions.length
                    ? calcPeriodOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["DAILY"]
                }
              />
            </MField>
          </div>
        </>
      )}

      {stepIdx === 2 && (
        <AccountingStep
          accountingRule={f.accountingRule}
          onAccountingRuleChange={(v) => setF({ ...f, accountingRule: v })}
          glFields={LOAN_GL_FIELDS}
          glValues={gl}
          onGlChange={(key, value) => setGl({ ...gl, [key]: value })}
          glOptions={glOptions}
        />
      )}

      {stepIdx === 3 && (
        <div className="space-y-4">
          <ReviewCard title="Basic Info">
            <ReviewRow label="Name" value={f.name || "-"} />
            <ReviewRow label="Short Name" value={f.shortName || "-"} />
            <ReviewRow label="Currency" value={f.currencyCode} />
            <ReviewRow label="Description" value={f.description || "-"} />
          </ReviewCard>

          <ReviewCard title="Loan Terms">
            <ReviewRow
              label="Principal"
              value={f.principal ? `${f.currencyCode} ${f.principal}` : "-"}
            />
            <ReviewRow
              label="Principal Range"
              value={
                f.minPrincipal || f.maxPrincipal
                  ? `${f.minPrincipal || "-"} – ${f.maxPrincipal || "-"}`
                  : "-"
              }
            />
            <ReviewRow label="Number of Repayments" value={f.numberOfRepayments || "-"} />
            <ReviewRow label="Repay Every" value={f.repaymentEvery || "-"} />
            <ReviewRow
              label="Repayment Frequency"
              value={optionLabel(repayFreqOptions, f.repaymentFrequencyType)}
            />
            <ReviewRow
              label="Interest Rate"
              value={f.interestRatePerPeriod ? `${f.interestRatePerPeriod}%` : "-"}
            />
            <ReviewRow
              label="Interest Rate Frequency"
              value={optionLabel(rateFreqOptions, f.interestRateFrequencyType)}
            />
            <ReviewRow
              label="Amortization"
              value={optionLabel(amortizationOptions, f.amortizationType)}
            />
            <ReviewRow
              label="Interest Method"
              value={optionLabel(interestTypeOptions, f.interestType)}
            />
            <ReviewRow
              label="Calculation Period"
              value={optionLabel(calcPeriodOptions, f.interestCalculationPeriodType)}
            />
          </ReviewCard>

          <ReviewCard title="Accounting">
            <ReviewRow
              label="Accounting Rule"
              value={
                ACCOUNTING_RULE_OPTIONS.find((o) => o.value === f.accountingRule)?.label ??
                f.accountingRule
              }
            />
            {needsGl &&
              LOAN_GL_FIELDS.map((field) => (
                <ReviewRow
                  key={field.key}
                  label={field.label}
                  value={gl[field.key] ? optionLabel(glOptions, gl[field.key]) : "-"}
                />
              ))}
          </ReviewCard>
        </div>
      )}

      {err && (
        <div
          className="flex items-center gap-2"
          style={{
            background: "#FEF3F2",
            border: "1px solid #FECDCA",
            color: "#B42318",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 12,
          }}
        >
          <AlertTriangle size={14} /> {err}
        </div>
      )}
    </Modal>
  );
}
