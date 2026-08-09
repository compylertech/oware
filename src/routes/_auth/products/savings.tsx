import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/patterns";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { WizardStepper } from "@/components/products/WizardStepper";
import {
  AccountingStep,
  ACCOUNTING_RULE_OPTIONS,
  type GLField,
} from "@/components/products/AccountingStep";
import { ReviewCard, ReviewRow, optionLabel, diffField } from "@/components/products/ProductReview";
import {
  savingsProductsApi,
  referencesApi,
  apiErrorMessage,
  type ProductDto,
  type ReferenceValueDto,
  type CreateSavingsProductDto,
  type UpdateSavingsProductDto,
} from "@/api/backend";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";

export const Route = createFileRoute("/_auth/products/savings")({
  component: SavingsProductsPage,
});

const PRODUCT_COLORS = ["#3B5BDB", "#059669", "#B45309", "#7C3AED", "#DC2626"];

function toCards(products: ProductDto[]): ProductCardData[] {
  return products.map((p, i) => ({
    code: p.code,
    name: p.name,
    type: "Savings",
    typeColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
    cells: [
      {
        label: "Interest",
        value: p.nominalAnnualInterestRate != null ? `${p.nominalAnnualInterestRate}% p.a.` : "-",
      },
      {
        label: "Min opening",
        value:
          p.minRequiredOpeningBalance != null
            ? `${p.currencyCode ?? ""} ${p.minRequiredOpeningBalance.toLocaleString()}`.trim()
            : "-",
      },
      { label: "Currency", value: p.currencyCode ?? "-" },
      { label: "Code", value: p.code },
    ],
    footerLeft: p.status ?? "-",
    active: (p.status ?? "").toUpperCase() === "ACTIVE",
  }));
}

const LIST_KEY = "products:savings";

function SavingsProductsPage() {
  const { data } = useBackendData(LIST_KEY, () => savingsProductsApi.list());
  const PRODUCTS = toCards(data ?? []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);

  return (
    <div
      style={{
        background: tokens.bg,
        minHeight: "100%",
        padding: "24px 28px",
        fontFamily: FONTS.body,
      }}
    >
      <Link
        to="/products"
        style={{
          color: tokens.navy,
          fontSize: 13,
          fontWeight: 300,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} /> Back to Products
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 14,
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 100, letterSpacing: 1.2, color: tokens.textMuted }}
          >
            PRODUCTS
          </div>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 26,
              fontWeight: 200,
              color: tokens.text,
              margin: "6px 0 6px",
            }}
          >
            Savings Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Deposit product catalogue - rates, fees and withdrawal rules.
          </p>
        </div>
        <Button variant="success" icon={<Plus size={16} />} onClick={() => setOpen(true)}>
          New product
        </Button>
      </div>

      <ProductCardGrid
        products={PRODUCTS}
        onEdit={(code) => setEditing((data ?? []).find((p) => p.code === code) ?? null)}
      />

      <NewSavingsProductModal open={open} onClose={() => setOpen(false)} />
      <EditSavingsProductModal
        open={!!editing}
        onClose={() => setEditing(null)}
        product={editing}
      />
    </div>
  );
}

const STEPS = ["Basic Info", "Interest Terms", "Accounting", "Review"];

const SAVINGS_GL_FIELDS: GLField[] = [
  { key: "savingsReferenceAccountCode", label: "Savings Reference Account" },
  { key: "savingsControlAccountCode", label: "Savings Control Account" },
  { key: "interestOnSavingsAccountCode", label: "Interest on Savings Account" },
  { key: "transfersInSuspenseAccountCode", label: "Transfers in Suspense Account" },
  { key: "writeOffAccountCode", label: "Write-off Account" },
  { key: "incomeFromFeeAccountCode", label: "Income from Fees Account" },
  { key: "incomeFromPenaltyAccountCode", label: "Income from Penalty Account" },
  { key: "incomeFromInterestAccountCode", label: "Income from Interest Account" },
  { key: "overdraftPortfolioControlAccountCode", label: "Overdraft Portfolio Control Account" },
];

const defaultForm = {
  name: "",
  shortName: "",
  description: "",
  currencyCode: "GHS",
  rate: "",
  compounding: "DAILY",
  posting: "MONTHLY",
  calcType: "DAILY_BALANCE",
  daysInYear: "365_DAYS",
  minOpening: "",
  lockinFrequency: "",
  lockinType: "DAYS",
  accountingRule: "NONE",
};

function NewSavingsProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceValueDto[]>([]);
  const [compoundingOptions, setCompoundingOptions] = useState<ReferenceValueDto[]>([]);
  const [postingOptions, setPostingOptions] = useState<ReferenceValueDto[]>([]);
  const [calcTypeOptions, setCalcTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [daysInYearOptions, setDaysInYearOptions] = useState<ReferenceValueDto[]>([]);
  const [lockinTypeOptions, setLockinTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [glOptions, setGlOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void referencesApi.list("CURRENCY").then(setCurrencyOptions);
    void referencesApi.list("SAVINGS_INTEREST_COMPOUNDING_PERIOD_TYPE").then(setCompoundingOptions);
    void referencesApi.list("SAVINGS_INTEREST_POSTING_PERIOD_TYPE").then(setPostingOptions);
    void referencesApi.list("SAVINGS_INTEREST_CALCULATION_TYPE").then(setCalcTypeOptions);
    void referencesApi
      .list("SAVINGS_INTEREST_CALCULATION_DAYS_IN_YEAR_TYPE")
      .then(setDaysInYearOptions);
    void referencesApi.list("SAVINGS_LOCKIN_PERIOD_FREQUENCY_TYPE").then(setLockinTypeOptions);
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

  const needsGl = f.accountingRule !== "NONE";
  const glComplete = !needsGl || SAVINGS_GL_FIELDS.every((field) => gl[field.key]);

  const stepValid = [
    !!f.name.trim() && !!f.shortName.trim() && !!f.currencyCode,
    !!f.rate,
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

  const payload: CreateSavingsProductDto | null = useMemo(() => {
    if (!f.name.trim() || !f.shortName.trim() || !f.rate) return null;
    return {
      name: f.name.trim(),
      shortName: f.shortName.trim(),
      description: f.description.trim() || undefined,
      currencyCode: f.currencyCode,
      nominalAnnualInterestRate: parseFloat(f.rate),
      interestCompoundingPeriodType: f.compounding,
      interestPostingPeriodType: f.posting,
      interestCalculationType: f.calcType,
      interestCalculationDaysInYearType: f.daysInYear,
      minRequiredOpeningBalance: f.minOpening ? parseFloat(f.minOpening) : undefined,
      lockinPeriodFrequency: f.lockinFrequency ? parseInt(f.lockinFrequency, 10) : undefined,
      lockinPeriodFrequencyType: f.lockinFrequency ? f.lockinType : undefined,
      accountingRule: f.accountingRule,
      ...(needsGl
        ? {
            savingsReferenceAccountCode: gl.savingsReferenceAccountCode,
            savingsControlAccountCode: gl.savingsControlAccountCode,
            interestOnSavingsAccountCode: gl.interestOnSavingsAccountCode,
            transfersInSuspenseAccountCode: gl.transfersInSuspenseAccountCode,
            writeOffAccountCode: gl.writeOffAccountCode,
            incomeFromFeeAccountCode: gl.incomeFromFeeAccountCode,
            incomeFromPenaltyAccountCode: gl.incomeFromPenaltyAccountCode,
            incomeFromInterestAccountCode: gl.incomeFromInterestAccountCode,
            overdraftPortfolioControlAccountCode: gl.overdraftPortfolioControlAccountCode,
          }
        : {}),
    };
  }, [f, gl, needsGl]);

  async function submit() {
    if (!payload) return;
    setErr(null);
    setSaving(true);
    try {
      const result = await savingsProductsApi.create(payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Savings product "${result.name}" created.`);
      await refreshBackendData(LIST_KEY, () => savingsProductsApi.list());
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
      title="New Savings Product"
      maxWidth={620}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Nominal Annual Interest Rate (%) *">
              <MInput
                type="number"
                step="0.01"
                value={f.rate}
                onChange={(e) => setF({ ...f, rate: e.target.value })}
              />
            </MField>
            <MField label="Min Required Opening Balance">
              <MInput
                type="number"
                step="0.01"
                value={f.minOpening}
                onChange={(e) => setF({ ...f, minOpening: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Compounding">
              <MSelect
                value={f.compounding}
                onChange={(e) => setF({ ...f, compounding: e.target.value })}
                options={
                  compoundingOptions.length
                    ? compoundingOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["DAILY"]
                }
              />
            </MField>
            <MField label="Interest Posting">
              <MSelect
                value={f.posting}
                onChange={(e) => setF({ ...f, posting: e.target.value })}
                options={
                  postingOptions.length
                    ? postingOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["MONTHLY"]
                }
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Calculation">
              <MSelect
                value={f.calcType}
                onChange={(e) => setF({ ...f, calcType: e.target.value })}
                options={
                  calcTypeOptions.length
                    ? calcTypeOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["DAILY_BALANCE"]
                }
              />
            </MField>
            <MField label="Days in Year">
              <MSelect
                value={f.daysInYear}
                onChange={(e) => setF({ ...f, daysInYear: e.target.value })}
                options={
                  daysInYearOptions.length
                    ? daysInYearOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["365_DAYS"]
                }
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Lock-in Period (optional)">
              <MInput
                type="number"
                min={0}
                value={f.lockinFrequency}
                onChange={(e) => setF({ ...f, lockinFrequency: e.target.value })}
                placeholder="e.g. 6"
              />
            </MField>
            <MField label="Lock-in Frequency">
              <MSelect
                value={f.lockinType}
                onChange={(e) => setF({ ...f, lockinType: e.target.value })}
                options={
                  lockinTypeOptions.length
                    ? lockinTypeOptions.map((o) => ({ value: o.code, label: o.name }))
                    : ["DAYS"]
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
          glFields={SAVINGS_GL_FIELDS}
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

          <ReviewCard title="Interest Terms">
            <ReviewRow label="Nominal Annual Interest Rate" value={f.rate ? `${f.rate}%` : "-"} />
            <ReviewRow
              label="Min Required Opening Balance"
              value={f.minOpening ? `${f.currencyCode} ${f.minOpening}` : "-"}
            />
            <ReviewRow label="Compounding" value={optionLabel(compoundingOptions, f.compounding)} />
            <ReviewRow label="Posting" value={optionLabel(postingOptions, f.posting)} />
            <ReviewRow label="Calculation" value={optionLabel(calcTypeOptions, f.calcType)} />
            <ReviewRow label="Days in Year" value={optionLabel(daysInYearOptions, f.daysInYear)} />
            <ReviewRow
              label="Lock-in Period"
              value={
                f.lockinFrequency
                  ? `${f.lockinFrequency} ${optionLabel(lockinTypeOptions, f.lockinType).toLowerCase()}`
                  : "-"
              }
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
              SAVINGS_GL_FIELDS.map((field) => (
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

const EDIT_STEPS = ["Basic Info", "Interest Terms", "Accounting", "Review"];

function editFormFromProduct(p: ProductDto) {
  return {
    name: p.name ?? "",
    shortName: p.shortName ?? "",
    description: p.description ?? "",
    currencyCode: p.currencyCode ?? "",
    rate: p.nominalAnnualInterestRate != null ? String(p.nominalAnnualInterestRate) : "",
    compounding: p.interestCompoundingPeriodType ?? "",
    posting: p.interestPostingPeriodType ?? "",
    calcType: p.interestCalculationType ?? "",
    daysInYear: p.interestCalculationDaysInYearType ?? "",
    minOpening: p.minRequiredOpeningBalance != null ? String(p.minRequiredOpeningBalance) : "",
    lockinFrequency: p.lockinPeriodFrequency != null ? String(p.lockinPeriodFrequency) : "",
    lockinType: p.lockinPeriodFrequencyType ?? "",
    accountingRule: p.accountingRule ?? "NONE",
  };
}

function glFromProduct(p: ProductDto): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of SAVINGS_GL_FIELDS) {
    out[field.key] = (p as unknown as Record<string, string | null | undefined>)[field.key] ?? "";
  }
  return out;
}

function EditSavingsProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDto | null;
}) {
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceValueDto[]>([]);
  const [compoundingOptions, setCompoundingOptions] = useState<ReferenceValueDto[]>([]);
  const [postingOptions, setPostingOptions] = useState<ReferenceValueDto[]>([]);
  const [calcTypeOptions, setCalcTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [daysInYearOptions, setDaysInYearOptions] = useState<ReferenceValueDto[]>([]);
  const [lockinTypeOptions, setLockinTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [glOptions, setGlOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void referencesApi.list("CURRENCY").then(setCurrencyOptions);
    void referencesApi.list("SAVINGS_INTEREST_COMPOUNDING_PERIOD_TYPE").then(setCompoundingOptions);
    void referencesApi.list("SAVINGS_INTEREST_POSTING_PERIOD_TYPE").then(setPostingOptions);
    void referencesApi.list("SAVINGS_INTEREST_CALCULATION_TYPE").then(setCalcTypeOptions);
    void referencesApi
      .list("SAVINGS_INTEREST_CALCULATION_DAYS_IN_YEAR_TYPE")
      .then(setDaysInYearOptions);
    void referencesApi.list("SAVINGS_LOCKIN_PERIOD_FREQUENCY_TYPE").then(setLockinTypeOptions);
    void referencesApi.list("GL_ACCOUNT").then(setGlOptions);
  }, [open]);

  const [stepIdx, setStepIdx] = useState(0);
  const [baseline, setBaseline] = useState(() => editFormFromProduct({} as ProductDto));
  const [f, setF] = useState(baseline);
  const [glBaseline, setGlBaseline] = useState<Record<string, string>>({});
  const [gl, setGl] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !product) return;
    const seeded = editFormFromProduct(product);
    const seededGl = glFromProduct(product);
    setBaseline(seeded);
    setF(seeded);
    setGlBaseline(seededGl);
    setGl(seededGl);
    setStepIdx(0);
    setErr(null);
  }, [open, product]);

  function close() {
    setErr(null);
    setStepIdx(0);
    onClose();
  }

  const payload: UpdateSavingsProductDto = useMemo(() => {
    const body: UpdateSavingsProductDto = {
      name: diffField(baseline.name, f.name),
      shortName: diffField(baseline.shortName, f.shortName),
      description: diffField(baseline.description, f.description),
      currencyCode: diffField(baseline.currencyCode, f.currencyCode),
      interestCompoundingPeriodType: diffField(baseline.compounding, f.compounding),
      interestPostingPeriodType: diffField(baseline.posting, f.posting),
      interestCalculationType: diffField(baseline.calcType, f.calcType),
      interestCalculationDaysInYearType: diffField(baseline.daysInYear, f.daysInYear),
      lockinPeriodFrequencyType: diffField(baseline.lockinType, f.lockinType),
      accountingRule: diffField(baseline.accountingRule, f.accountingRule),
    };
    const rateDiff = diffField(baseline.rate, f.rate);
    if (rateDiff !== undefined) body.nominalAnnualInterestRate = parseFloat(rateDiff);
    const minDiff = diffField(baseline.minOpening, f.minOpening);
    if (minDiff !== undefined) body.minRequiredOpeningBalance = parseFloat(minDiff);
    const lockinDiff = diffField(baseline.lockinFrequency, f.lockinFrequency);
    if (lockinDiff !== undefined) body.lockinPeriodFrequency = parseInt(lockinDiff, 10);
    for (const field of SAVINGS_GL_FIELDS) {
      const glDiff = diffField(glBaseline[field.key] ?? "", gl[field.key] ?? "");
      if (glDiff !== undefined) (body as Record<string, unknown>)[field.key] = glDiff;
    }
    for (const key of Object.keys(body) as (keyof UpdateSavingsProductDto)[]) {
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
      const result = await savingsProductsApi.update(product.code, payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Savings product "${result.name}" updated.`);
      await refreshBackendData(LIST_KEY, () => savingsProductsApi.list());
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
      title={`Edit Savings Product${product ? ` - ${product.name}` : ""}`}
      maxWidth={620}
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
          {stepIdx < EDIT_STEPS.length - 1 ? (
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
        steps={EDIT_STEPS}
        currentIndex={stepIdx}
        furthestIndex={EDIT_STEPS.length - 1}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Nominal Annual Interest Rate (%)">
              <MInput
                type="number"
                step="0.01"
                value={f.rate}
                onChange={(e) => setF({ ...f, rate: e.target.value })}
              />
            </MField>
            <MField label="Min Required Opening Balance">
              <MInput
                type="number"
                step="0.01"
                value={f.minOpening}
                onChange={(e) => setF({ ...f, minOpening: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Compounding">
              <MSelect
                value={f.compounding}
                onChange={(e) => setF({ ...f, compounding: e.target.value })}
                options={
                  compoundingOptions.length
                    ? compoundingOptions.map((o) => ({ value: o.code, label: o.name }))
                    : f.compounding
                      ? [f.compounding]
                      : []
                }
              />
            </MField>
            <MField label="Interest Posting">
              <MSelect
                value={f.posting}
                onChange={(e) => setF({ ...f, posting: e.target.value })}
                options={
                  postingOptions.length
                    ? postingOptions.map((o) => ({ value: o.code, label: o.name }))
                    : f.posting
                      ? [f.posting]
                      : []
                }
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Interest Calculation">
              <MSelect
                value={f.calcType}
                onChange={(e) => setF({ ...f, calcType: e.target.value })}
                options={
                  calcTypeOptions.length
                    ? calcTypeOptions.map((o) => ({ value: o.code, label: o.name }))
                    : f.calcType
                      ? [f.calcType]
                      : []
                }
              />
            </MField>
            <MField label="Days in Year">
              <MSelect
                value={f.daysInYear}
                onChange={(e) => setF({ ...f, daysInYear: e.target.value })}
                options={
                  daysInYearOptions.length
                    ? daysInYearOptions.map((o) => ({ value: o.code, label: o.name }))
                    : f.daysInYear
                      ? [f.daysInYear]
                      : []
                }
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Lock-in Period">
              <MInput
                type="number"
                min={0}
                value={f.lockinFrequency}
                onChange={(e) => setF({ ...f, lockinFrequency: e.target.value })}
                placeholder="e.g. 6"
              />
            </MField>
            <MField label="Lock-in Frequency">
              <MSelect
                value={f.lockinType}
                onChange={(e) => setF({ ...f, lockinType: e.target.value })}
                options={
                  lockinTypeOptions.length
                    ? lockinTypeOptions.map((o) => ({ value: o.code, label: o.name }))
                    : f.lockinType
                      ? [f.lockinType]
                      : ["DAYS"]
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
          glFields={SAVINGS_GL_FIELDS}
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
            {payload.nominalAnnualInterestRate !== undefined && (
              <ReviewRow
                label="Nominal Annual Interest Rate"
                value={`${payload.nominalAnnualInterestRate}%`}
              />
            )}
            {payload.minRequiredOpeningBalance !== undefined && (
              <ReviewRow
                label="Min Required Opening Balance"
                value={`${payload.currencyCode ?? f.currencyCode} ${payload.minRequiredOpeningBalance}`}
              />
            )}
            {payload.interestCompoundingPeriodType !== undefined && (
              <ReviewRow
                label="Compounding"
                value={optionLabel(compoundingOptions, payload.interestCompoundingPeriodType)}
              />
            )}
            {payload.interestPostingPeriodType !== undefined && (
              <ReviewRow
                label="Posting"
                value={optionLabel(postingOptions, payload.interestPostingPeriodType)}
              />
            )}
            {payload.interestCalculationType !== undefined && (
              <ReviewRow
                label="Calculation"
                value={optionLabel(calcTypeOptions, payload.interestCalculationType)}
              />
            )}
            {payload.interestCalculationDaysInYearType !== undefined && (
              <ReviewRow
                label="Days in Year"
                value={optionLabel(daysInYearOptions, payload.interestCalculationDaysInYearType)}
              />
            )}
            {payload.lockinPeriodFrequency !== undefined && (
              <ReviewRow label="Lock-in Period" value={payload.lockinPeriodFrequency} />
            )}
            {payload.lockinPeriodFrequencyType !== undefined && (
              <ReviewRow
                label="Lock-in Frequency"
                value={optionLabel(lockinTypeOptions, payload.lockinPeriodFrequencyType)}
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
            {SAVINGS_GL_FIELDS.filter(
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
