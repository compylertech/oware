import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { Button } from "@/components/patterns";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { WizardStepper } from "@/components/products/WizardStepper";
import {
  AccountingStep,
  ACCOUNTING_RULE_OPTIONS,
  type GLField,
} from "@/components/products/AccountingStep";
import { ReviewCard, ReviewRow, optionLabel, diffField } from "@/components/products/ProductReview";
import {
  shareProductsApi,
  referencesApi,
  apiErrorMessage,
  type ProductDto,
  type ReferenceValueDto,
  type CreateShareProductDto,
  type UpdateShareProductDto,
} from "@/api/backend";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";

export const Route = createFileRoute("/_auth/products/shares")({
  component: ShareProductsPage,
});

const SHARE_LIST_KEY = "products:shares";
const PRODUCT_COLORS = ["#3B5BDB", "#059669", "#B45309", "#7C3AED", "#DC2626"];

function toShareProductCards(products: ProductDto[]): ProductCardData[] {
  return products.map((p, i) => ({
    code: p.code,
    name: p.name,
    type: "Shares",
    typeColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length],
    cells: [
      {
        label: "Unit Price",
        value: p.unitPrice != null ? `${p.currencyCode ?? ""} ${p.unitPrice}`.trim() : "—",
      },
      { label: "Currency", value: p.currencyCode ?? "—" },
      { label: "Code", value: p.code },
      { label: "Status", value: p.status ?? "—" },
    ],
    footerLeft: p.status ?? "—",
    active: (p.status ?? "").toUpperCase() === "ACTIVE",
  }));
}

function ShareProductsPage() {
  const { data } = useBackendData(SHARE_LIST_KEY, () => shareProductsApi.list());
  const PRODUCTS = toShareProductCards(data ?? []);
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
            Share Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Share product catalogue — pricing, lock-in rules and GL mappings.
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

      <NewShareProductModal open={open} onClose={() => setOpen(false)} />
      <EditShareProductModal open={!!editing} onClose={() => setEditing(null)} product={editing} />
    </div>
  );
}

const SHARE_STEPS = ["Basic Info", "Share Terms", "Accounting", "Review"];

const SHARE_GL_FIELDS: GLField[] = [
  { key: "shareReferenceAccountCode", label: "Share Reference Account" },
  { key: "shareSuspenseAccountCode", label: "Share Suspense Account" },
  { key: "shareEquityAccountCode", label: "Share Equity Account" },
  { key: "incomeFromFeeAccountCode", label: "Income from Fees Account" },
];

const shareDefaultForm = {
  name: "",
  shortName: "",
  description: "",
  currencyCode: "GHS",
  totalShares: "",
  nominalShares: "",
  minimumShares: "",
  maximumShares: "",
  unitPrice: "",
  lockinFrequency: "",
  lockinType: "DAYS",
  accountingRule: "NONE",
};

function NewShareProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceValueDto[]>([]);
  const [lockinTypeOptions, setLockinTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [glOptions, setGlOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void referencesApi.list("CURRENCY").then(setCurrencyOptions);
    void referencesApi.list("SHARE_LOCKIN_PERIOD_FREQUENCY_TYPE").then(setLockinTypeOptions);
    void referencesApi.list("GL_ACCOUNT").then(setGlOptions);
  }, [open]);

  const [stepIdx, setStepIdx] = useState(0);
  const [furthestStepIdx, setFurthestStepIdx] = useState(0);
  const [f, setF] = useState(shareDefaultForm);
  const [gl, setGl] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function close() {
    setErr(null);
    setStepIdx(0);
    setFurthestStepIdx(0);
    setF(shareDefaultForm);
    setGl({});
    onClose();
  }

  const totalShares = parseInt(f.totalShares, 10);
  const nominalShares = parseInt(f.nominalShares, 10);
  const unitPrice = parseFloat(f.unitPrice);
  const termsValid =
    !!totalShares &&
    totalShares > 0 &&
    !!nominalShares &&
    nominalShares > 0 &&
    !!unitPrice &&
    unitPrice > 0;

  const needsGl = f.accountingRule !== "NONE";
  const glComplete = !needsGl || SHARE_GL_FIELDS.every((field) => gl[field.key]);

  const stepValid = [
    !!f.name.trim() &&
      !!f.shortName.trim() &&
      f.shortName.trim().length <= 4 &&
      !!f.description.trim() &&
      !!f.currencyCode,
    termsValid,
    glComplete,
    true,
  ];
  const canGoNext = stepValid[stepIdx];

  function goNext() {
    if (!canGoNext) return;
    const next = Math.min(stepIdx + 1, SHARE_STEPS.length - 1);
    setStepIdx(next);
    setFurthestStepIdx((v) => Math.max(v, next));
  }

  const payload: CreateShareProductDto | null = useMemo(() => {
    if (!f.name.trim() || !f.shortName.trim() || !f.description.trim() || !termsValid) return null;
    return {
      name: f.name.trim(),
      shortName: f.shortName.trim(),
      description: f.description.trim(),
      currencyCode: f.currencyCode,
      totalShares,
      nominalShares,
      minimumShares: f.minimumShares ? parseInt(f.minimumShares, 10) : undefined,
      maximumShares: f.maximumShares ? parseInt(f.maximumShares, 10) : undefined,
      unitPrice,
      lockinPeriodFrequency: f.lockinFrequency ? parseInt(f.lockinFrequency, 10) : undefined,
      lockinPeriodFrequencyType: f.lockinFrequency ? f.lockinType : undefined,
      accountingRule: f.accountingRule,
      ...(needsGl
        ? {
            shareReferenceAccountCode: gl.shareReferenceAccountCode,
            shareSuspenseAccountCode: gl.shareSuspenseAccountCode,
            shareEquityAccountCode: gl.shareEquityAccountCode,
            incomeFromFeeAccountCode: gl.incomeFromFeeAccountCode,
          }
        : {}),
    };
  }, [f, gl, needsGl, termsValid, totalShares, nominalShares, unitPrice]);

  async function submit() {
    if (!payload) return;
    setErr(null);
    setSaving(true);
    try {
      const result = await shareProductsApi.create(payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Share product "${result.name}" created.`);
      await refreshBackendData(SHARE_LIST_KEY, () => shareProductsApi.list());
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
      title="New Share Product"
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
          {stepIdx < SHARE_STEPS.length - 1 ? (
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
        steps={SHARE_STEPS}
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
            <MField label="Short name * (max 4 chars)">
              <MInput
                value={f.shortName}
                maxLength={4}
                onChange={(e) => setF({ ...f, shortName: e.target.value.toUpperCase() })}
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
          <MField label="Description *">
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
            <MField label="Total Shares">
              <MInput
                type="number"
                min={1}
                value={f.totalShares}
                onChange={(e) => setF({ ...f, totalShares: e.target.value })}
              />
            </MField>
            <MField label="Nominal Shares">
              <MInput
                type="number"
                min={1}
                value={f.nominalShares}
                onChange={(e) => setF({ ...f, nominalShares: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Minimum Shares (optional)">
              <MInput
                type="number"
                min={0}
                value={f.minimumShares}
                onChange={(e) => setF({ ...f, minimumShares: e.target.value })}
              />
            </MField>
            <MField label="Maximum Shares (optional)">
              <MInput
                type="number"
                min={0}
                value={f.maximumShares}
                onChange={(e) => setF({ ...f, maximumShares: e.target.value })}
              />
            </MField>
          </div>
          <MField label="Unit Price">
            <MInput
              type="number"
              step="0.01"
              value={f.unitPrice}
              onChange={(e) => setF({ ...f, unitPrice: e.target.value })}
            />
          </MField>
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
          glFields={SHARE_GL_FIELDS}
          glValues={gl}
          onGlChange={(key, value) => setGl({ ...gl, [key]: value })}
          glOptions={glOptions}
        />
      )}

      {stepIdx === 3 && (
        <div className="space-y-4">
          <ReviewCard title="Basic Info">
            <ReviewRow label="Name" value={f.name || "—"} />
            <ReviewRow label="Short Name" value={f.shortName || "—"} />
            <ReviewRow label="Currency" value={f.currencyCode} />
            <ReviewRow label="Description" value={f.description || "—"} />
          </ReviewCard>

          <ReviewCard title="Share Terms">
            <ReviewRow label="Total Shares" value={f.totalShares || "—"} />
            <ReviewRow label="Nominal Shares" value={f.nominalShares || "—"} />
            <ReviewRow
              label="Share Range"
              value={
                f.minimumShares || f.maximumShares
                  ? `${f.minimumShares || "—"} – ${f.maximumShares || "—"}`
                  : "—"
              }
            />
            <ReviewRow
              label="Unit Price"
              value={f.unitPrice ? `${f.currencyCode} ${f.unitPrice}` : "—"}
            />
            <ReviewRow
              label="Lock-in Period"
              value={
                f.lockinFrequency
                  ? `${f.lockinFrequency} ${optionLabel(lockinTypeOptions, f.lockinType).toLowerCase()}`
                  : "—"
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
              SHARE_GL_FIELDS.map((field) => (
                <ReviewRow
                  key={field.key}
                  label={field.label}
                  value={gl[field.key] ? optionLabel(glOptions, gl[field.key]) : "—"}
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

const EDIT_SHARE_STEPS = ["Basic Info", "Share Terms", "Accounting", "Review"];

function editShareFormFromProduct(p: ProductDto) {
  return {
    name: p.name ?? "",
    shortName: p.shortName ?? "",
    description: p.description ?? "",
    currencyCode: p.currencyCode ?? "",
    totalShares: p.totalShares != null ? String(p.totalShares) : "",
    nominalShares: p.nominalShares != null ? String(p.nominalShares) : "",
    minimumShares: p.minimumShares != null ? String(p.minimumShares) : "",
    maximumShares: p.maximumShares != null ? String(p.maximumShares) : "",
    unitPrice: p.unitPrice != null ? String(p.unitPrice) : "",
    lockinFrequency: p.lockinPeriodFrequency != null ? String(p.lockinPeriodFrequency) : "",
    lockinType: p.lockinPeriodFrequencyType ?? "",
    accountingRule: p.accountingRule ?? "NONE",
  };
}

function glFromShareProduct(p: ProductDto): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of SHARE_GL_FIELDS) {
    out[field.key] = (p as unknown as Record<string, string | null | undefined>)[field.key] ?? "";
  }
  return out;
}

function EditShareProductModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDto | null;
}) {
  const [currencyOptions, setCurrencyOptions] = useState<ReferenceValueDto[]>([]);
  const [lockinTypeOptions, setLockinTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [glOptions, setGlOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    if (!open) return;
    void referencesApi.list("CURRENCY").then(setCurrencyOptions);
    void referencesApi.list("SHARE_LOCKIN_PERIOD_FREQUENCY_TYPE").then(setLockinTypeOptions);
    void referencesApi.list("GL_ACCOUNT").then(setGlOptions);
  }, [open]);

  const [stepIdx, setStepIdx] = useState(0);
  const [baseline, setBaseline] = useState(() => editShareFormFromProduct({} as ProductDto));
  const [f, setF] = useState(baseline);
  const [glBaseline, setGlBaseline] = useState<Record<string, string>>({});
  const [gl, setGl] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !product) return;
    const seeded = editShareFormFromProduct(product);
    const seededGl = glFromShareProduct(product);
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

  const payload: UpdateShareProductDto = useMemo(() => {
    const body: UpdateShareProductDto = {
      name: diffField(baseline.name, f.name),
      shortName: diffField(baseline.shortName, f.shortName),
      description: diffField(baseline.description, f.description),
      currencyCode: diffField(baseline.currencyCode, f.currencyCode),
      lockinPeriodFrequencyType: diffField(baseline.lockinType, f.lockinType),
      accountingRule: diffField(baseline.accountingRule, f.accountingRule),
    };
    const totalDiff = diffField(baseline.totalShares, f.totalShares);
    if (totalDiff !== undefined) body.totalShares = parseInt(totalDiff, 10);
    const nominalDiff = diffField(baseline.nominalShares, f.nominalShares);
    if (nominalDiff !== undefined) body.nominalShares = parseInt(nominalDiff, 10);
    const minDiff = diffField(baseline.minimumShares, f.minimumShares);
    if (minDiff !== undefined) body.minimumShares = parseInt(minDiff, 10);
    const maxDiff = diffField(baseline.maximumShares, f.maximumShares);
    if (maxDiff !== undefined) body.maximumShares = parseInt(maxDiff, 10);
    const priceDiff = diffField(baseline.unitPrice, f.unitPrice);
    if (priceDiff !== undefined) body.unitPrice = parseFloat(priceDiff);
    const lockinDiff = diffField(baseline.lockinFrequency, f.lockinFrequency);
    if (lockinDiff !== undefined) body.lockinPeriodFrequency = parseInt(lockinDiff, 10);
    for (const field of SHARE_GL_FIELDS) {
      const glDiff = diffField(glBaseline[field.key] ?? "", gl[field.key] ?? "");
      if (glDiff !== undefined) (body as Record<string, unknown>)[field.key] = glDiff;
    }
    for (const key of Object.keys(body) as (keyof UpdateShareProductDto)[]) {
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
      const result = await shareProductsApi.update(product.code, payload);
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success(`Share product "${result.name}" updated.`);
      await refreshBackendData(SHARE_LIST_KEY, () => shareProductsApi.list());
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
      title={`Edit Share Product${product ? ` — ${product.name}` : ""}`}
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
          {stepIdx < EDIT_SHARE_STEPS.length - 1 ? (
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
        steps={EDIT_SHARE_STEPS}
        currentIndex={stepIdx}
        furthestIndex={EDIT_SHARE_STEPS.length - 1}
        onStepClick={setStepIdx}
      />

      {stepIdx === 0 && (
        <>
          <MField label="Name">
            <MInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </MField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Short name (max 4 chars)">
              <MInput
                value={f.shortName}
                maxLength={4}
                onChange={(e) => setF({ ...f, shortName: e.target.value.toUpperCase() })}
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
            <MField label="Total Shares">
              <MInput
                type="number"
                min={0}
                value={f.totalShares}
                onChange={(e) => setF({ ...f, totalShares: e.target.value })}
              />
            </MField>
            <MField label="Nominal Shares">
              <MInput
                type="number"
                min={0}
                value={f.nominalShares}
                onChange={(e) => setF({ ...f, nominalShares: e.target.value })}
              />
            </MField>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MField label="Minimum Shares">
              <MInput
                type="number"
                min={0}
                value={f.minimumShares}
                onChange={(e) => setF({ ...f, minimumShares: e.target.value })}
              />
            </MField>
            <MField label="Maximum Shares">
              <MInput
                type="number"
                min={0}
                value={f.maximumShares}
                onChange={(e) => setF({ ...f, maximumShares: e.target.value })}
              />
            </MField>
          </div>
          <MField label="Unit Price">
            <MInput
              type="number"
              step="0.01"
              value={f.unitPrice}
              onChange={(e) => setF({ ...f, unitPrice: e.target.value })}
            />
          </MField>
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
          glFields={SHARE_GL_FIELDS}
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
              No changes yet — edit a field on an earlier step to see it here.
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
            {payload.totalShares !== undefined && (
              <ReviewRow label="Total Shares" value={payload.totalShares} />
            )}
            {payload.nominalShares !== undefined && (
              <ReviewRow label="Nominal Shares" value={payload.nominalShares} />
            )}
            {payload.minimumShares !== undefined && (
              <ReviewRow label="Minimum Shares" value={payload.minimumShares} />
            )}
            {payload.maximumShares !== undefined && (
              <ReviewRow label="Maximum Shares" value={payload.maximumShares} />
            )}
            {payload.unitPrice !== undefined && (
              <ReviewRow
                label="Unit Price"
                value={`${payload.currencyCode ?? f.currencyCode} ${payload.unitPrice}`}
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
            {SHARE_GL_FIELDS.filter(
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
