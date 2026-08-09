import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { Button } from "@/components/patterns";
import { WizardStepper } from "@/components/products/WizardStepper";
import {
  AccountingStep,
  ACCOUNTING_RULE_OPTIONS,
  type GLField,
} from "@/components/products/AccountingStep";
import {
  ReviewCard,
  ReviewRow,
  optionLabel,
  codeFromProviderId,
  diffField,
} from "@/components/products/ProductReview";
import { loanProductsApi } from "@/api/loans";
import {
  referencesApi,
  apiErrorMessage,
  type ReferenceValueDto,
  type ProductDto,
  type UpdateLoanProductDto,
} from "@/api/backend";
import { refreshBackendData } from "@/api/useBackendData";
import { LOAN_PRODUCTS_LIST_KEY } from "@/components/products/NewLoanProductModal";

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

// repaymentFrequencyType/interestRateFrequencyType/amortizationType/
// interestType/interestCalculationPeriodType arrive as Fineract's raw
// internal numeric id (e.g. "2"), not the human string code ("MONTHS") the
// update payload takes - verified live. codeFromProviderId reverse-maps them.
function formFromProduct(
  p: ProductDto,
  repayFreq: ReferenceValueDto[],
  rateFreq: ReferenceValueDto[],
  amortization: ReferenceValueDto[],
  interestType: ReferenceValueDto[],
  calcPeriod: ReferenceValueDto[],
) {
  return {
    name: p.name ?? "",
    shortName: p.shortName ?? "",
    description: p.description ?? "",
    currencyCode: p.currencyCode ?? "",
    principal: p.principal != null ? String(p.principal) : "",
    minPrincipal: p.minPrincipal != null ? String(p.minPrincipal) : "",
    maxPrincipal: p.maxPrincipal != null ? String(p.maxPrincipal) : "",
    numberOfRepayments: p.numberOfRepayments != null ? String(p.numberOfRepayments) : "",
    repaymentEvery: p.repaymentEvery != null ? String(p.repaymentEvery) : "",
    repaymentFrequencyType: codeFromProviderId(repayFreq, p.repaymentFrequencyType),
    interestRatePerPeriod:
      p.annualNominalInterestRate != null ? String(p.annualNominalInterestRate) : "",
    interestRateFrequencyType: codeFromProviderId(rateFreq, p.interestRateFrequencyType),
    amortizationType: codeFromProviderId(amortization, p.amortizationType),
    interestType: codeFromProviderId(interestType, p.interestType),
    interestCalculationPeriodType: codeFromProviderId(calcPeriod, p.interestCalculationPeriodType),
    accountingRule: p.accountingRule ?? "NONE",
  };
}

function glFromProduct(p: ProductDto): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of LOAN_GL_FIELDS) {
    out[field.key] = (p as unknown as Record<string, string | null | undefined>)[field.key] ?? "";
  }
  return out;
}

export function EditLoanProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDto | null;
}) {
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
  const [baseline, setBaseline] = useState(() =>
    formFromProduct({} as ProductDto, [], [], [], [], []),
  );
  const [f, setF] = useState(baseline);
  const [glBaseline, setGlBaseline] = useState<Record<string, string>>({});
  const [gl, setGl] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Reference lists load async after `open` flips true, so re-seed the
  // baseline once they're in (needed to reverse-map the loan enum fields).
  useEffect(() => {
    if (!open || !product) return;
    const seeded = formFromProduct(
      product,
      repayFreqOptions,
      rateFreqOptions,
      amortizationOptions,
      interestTypeOptions,
      calcPeriodOptions,
    );
    const seededGl = glFromProduct(product);
    setBaseline(seeded);
    setF(seeded);
    setGlBaseline(seededGl);
    setGl(seededGl);
    setStepIdx(0);
    setErr(null);
  }, [
    open,
    product,
    repayFreqOptions,
    rateFreqOptions,
    amortizationOptions,
    interestTypeOptions,
    calcPeriodOptions,
  ]);

  function close() {
    setErr(null);
    setStepIdx(0);
    onClose();
  }

  const payload: UpdateLoanProductDto = useMemo(() => {
    const body: UpdateLoanProductDto = {
      name: diffField(baseline.name, f.name),
      shortName: diffField(baseline.shortName, f.shortName),
      description: diffField(baseline.description, f.description),
      currencyCode: diffField(baseline.currencyCode, f.currencyCode),
      repaymentFrequencyType: diffField(baseline.repaymentFrequencyType, f.repaymentFrequencyType),
      interestRateFrequencyType: diffField(
        baseline.interestRateFrequencyType,
        f.interestRateFrequencyType,
      ),
      amortizationType: diffField(baseline.amortizationType, f.amortizationType),
      interestType: diffField(baseline.interestType, f.interestType),
      interestCalculationPeriodType: diffField(
        baseline.interestCalculationPeriodType,
        f.interestCalculationPeriodType,
      ),
      accountingRule: diffField(baseline.accountingRule, f.accountingRule),
    };
    const numDiff = diffField(baseline.principal, f.principal);
    if (numDiff !== undefined) body.principal = parseFloat(numDiff);
    const minDiff = diffField(baseline.minPrincipal, f.minPrincipal);
    if (minDiff !== undefined) body.minPrincipal = parseFloat(minDiff);
    const maxDiff = diffField(baseline.maxPrincipal, f.maxPrincipal);
    if (maxDiff !== undefined) body.maxPrincipal = parseFloat(maxDiff);
    const repsDiff = diffField(baseline.numberOfRepayments, f.numberOfRepayments);
    if (repsDiff !== undefined) body.numberOfRepayments = parseInt(repsDiff, 10);
    const everyDiff = diffField(baseline.repaymentEvery, f.repaymentEvery);
    if (everyDiff !== undefined) body.repaymentEvery = parseInt(everyDiff, 10);
    const rateDiff = diffField(baseline.interestRatePerPeriod, f.interestRatePerPeriod);
    if (rateDiff !== undefined) body.interestRatePerPeriod = parseFloat(rateDiff);
    for (const field of LOAN_GL_FIELDS) {
      const glDiff = diffField(glBaseline[field.key] ?? "", gl[field.key] ?? "");
      if (glDiff !== undefined) (body as Record<string, unknown>)[field.key] = glDiff;
    }
    for (const key of Object.keys(body) as (keyof UpdateLoanProductDto)[]) {
      if (body[key] === undefined) delete body[key];
    }
    return body;
  }, [f, gl, baseline, glBaseline]);

  const hasChanges = Object.keys(payload).length > 0;

  async function submit() {
    if (!product || !hasChanges) return;
    setErr(null);
    setSaving(true);
    try {
      const result = await loanProductsApi.update(product.code, payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Loan product "${result.name}" updated.`);
      await refreshBackendData(LOAN_PRODUCTS_LIST_KEY, () => loanProductsApi.list());
      close();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong updating this product."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Edit Loan Product${product ? ` - ${product.name}` : ""}`}
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
            <Button variant="success" onClick={() => setStepIdx(stepIdx + 1)}>
              Next →
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={() => void submit()}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          )}
        </div>
      }
    >
      <WizardStepper
        steps={STEPS}
        currentIndex={stepIdx}
        furthestIndex={STEPS.length - 1}
        onStepClick={setStepIdx}
      />

      {stepIdx === 0 && (
        <>
          <MField label="Name">
            <MInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </MField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Short name">
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
                    : f.currencyCode
                      ? [f.currencyCode]
                      : []
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
                    : f.repaymentFrequencyType
                      ? [f.repaymentFrequencyType]
                      : []
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
                    : f.interestRateFrequencyType
                      ? [f.interestRateFrequencyType]
                      : []
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
                    : f.amortizationType
                      ? [f.amortizationType]
                      : []
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
                    : f.interestType
                      ? [f.interestType]
                      : []
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
                    : f.interestCalculationPeriodType
                      ? [f.interestCalculationPeriodType]
                      : []
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
          {!hasChanges && (
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
              No changes yet - edit a field on an earlier step to see it here.
            </div>
          )}
          <ReviewCard title="Changes to save">
            {payload.name !== undefined && <ReviewRow label="Name" value={payload.name} />}
            {payload.shortName !== undefined && (
              <ReviewRow label="Short Name" value={payload.shortName} />
            )}
            {payload.currencyCode !== undefined && (
              <ReviewRow label="Currency" value={payload.currencyCode} />
            )}
            {payload.description !== undefined && (
              <ReviewRow label="Description" value={payload.description} />
            )}
            {payload.principal !== undefined && (
              <ReviewRow label="Principal" value={payload.principal} />
            )}
            {payload.minPrincipal !== undefined && (
              <ReviewRow label="Min Principal" value={payload.minPrincipal} />
            )}
            {payload.maxPrincipal !== undefined && (
              <ReviewRow label="Max Principal" value={payload.maxPrincipal} />
            )}
            {payload.numberOfRepayments !== undefined && (
              <ReviewRow label="Number of Repayments" value={payload.numberOfRepayments} />
            )}
            {payload.repaymentEvery !== undefined && (
              <ReviewRow label="Repay Every" value={payload.repaymentEvery} />
            )}
            {payload.repaymentFrequencyType !== undefined && (
              <ReviewRow
                label="Repayment Frequency"
                value={optionLabel(repayFreqOptions, payload.repaymentFrequencyType)}
              />
            )}
            {payload.interestRatePerPeriod !== undefined && (
              <ReviewRow label="Interest Rate" value={`${payload.interestRatePerPeriod}%`} />
            )}
            {payload.interestRateFrequencyType !== undefined && (
              <ReviewRow
                label="Interest Rate Frequency"
                value={optionLabel(rateFreqOptions, payload.interestRateFrequencyType)}
              />
            )}
            {payload.amortizationType !== undefined && (
              <ReviewRow
                label="Amortization"
                value={optionLabel(amortizationOptions, payload.amortizationType)}
              />
            )}
            {payload.interestType !== undefined && (
              <ReviewRow
                label="Interest Method"
                value={optionLabel(interestTypeOptions, payload.interestType)}
              />
            )}
            {payload.interestCalculationPeriodType !== undefined && (
              <ReviewRow
                label="Calculation Period"
                value={optionLabel(calcPeriodOptions, payload.interestCalculationPeriodType)}
              />
            )}
            {payload.accountingRule !== undefined && (
              <ReviewRow
                label="Accounting Rule"
                value={
                  ACCOUNTING_RULE_OPTIONS.find((o) => o.value === payload.accountingRule)?.label ??
                  payload.accountingRule
                }
              />
            )}
            {LOAN_GL_FIELDS.filter(
              (field) => (payload as Record<string, unknown>)[field.key] !== undefined,
            ).map((field) => (
              <ReviewRow
                key={field.key}
                label={field.label}
                value={optionLabel(glOptions, (payload as Record<string, string>)[field.key])}
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
