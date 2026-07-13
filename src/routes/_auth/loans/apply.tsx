import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Check, AlertTriangle, X } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { fontDisplay, fontMono, Panel } from "@/components/loans/ui";
import { Button } from "@/components/patterns";
import {
  clientsApi,
  loanProductsApi,
  loanAccountsApi,
  referencesApi,
  apiErrorMessage,
  type ProductDto,
  type ReferenceValueDto,
} from "@/api/backend";
import type { Client } from "@/api/clients";
import { fmtGHS, loanReportsApi, type LoanAccountCreate } from "@/api/loans";
import { refreshBackendData } from "@/api/useBackendData";

export const Route = createFileRoute("/_auth/loans/apply")({
  component: LoanApplicationPage,
});

type CollateralDraft = { collateralTypeCode: string; value: string; description: string };
type GuarantorDraft = {
  guarantorTypeCode: string;
  clientRelationshipTypeCode: string;
  /** Numeric entity id, used directly for non-"CUSTOMER" guarantor types. */
  entityId: string;
  /** For "CUSTOMER" guarantors, resolved via client search — entityId is
   * that client's fineractClientId, not our app's UUID. */
  pickedClient: Client | null;
};

function emptyCollateralDraft(): CollateralDraft {
  return { collateralTypeCode: "", value: "", description: "" };
}

function emptyGuarantorDraft(): GuarantorDraft {
  return {
    guarantorTypeCode: "CUSTOMER",
    clientRelationshipTypeCode: "",
    entityId: "",
    pickedClient: null,
  };
}

const STEPS = [
  "Borrower",
  "Loan Details",
  "Repayment",
  "Collateral & Guarantors",
  "Review",
] as const;
type Step = (typeof STEPS)[number];

const today = () => new Date().toISOString().slice(0, 10);

// LOAN_TYPE has no Fineract template values on this instance (confirmed live
// — the reference category returns an empty list even after a sync), so this
// stays a small hardcoded set of Fineract's standard loan account types
// rather than a broken dropdown.
const LOAN_TYPES = [
  { code: "individual", name: "Individual" },
  { code: "group", name: "Group" },
];

function LoanApplicationPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [furthestStepIdx, setFurthestStepIdx] = useState(0);
  const step = STEPS[stepIdx];

  // ---- Borrower ----
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productCode, setProductCode] = useState<string | null>(null);
  const [loanType, setLoanType] = useState("individual");

  const product = products.find((p) => p.code === productCode) ?? null;

  useEffect(() => {
    void loanProductsApi.listRaw().then(setProducts);
  }, []);

  useEffect(() => {
    const q = clientQuery.trim();
    if (!q || client) {
      setClientResults([]);
      return;
    }
    setSearchingClients(true);
    const timer = setTimeout(() => {
      clientsApi
        .search({ keyword: q, size: 8 })
        .then(setClientResults)
        .finally(() => setSearchingClients(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [clientQuery, client]);

  // ---- Loan details ----
  const [principal, setPrincipal] = useState("");
  const [loanTermFrequency, setLoanTermFrequency] = useState("");
  const [loanTermFrequencyType, setLoanTermFrequencyType] = useState("MONTHS");
  const [submittedOnDate, setSubmittedOnDate] = useState(today());
  const [expectedDisbursementDate, setExpectedDisbursementDate] = useState(today());

  // ---- Repayment & interest ----
  const [numberOfRepayments, setNumberOfRepayments] = useState("");
  const [repaymentEvery, setRepaymentEvery] = useState("1");
  const [repaymentFrequencyType, setRepaymentFrequencyType] = useState("MONTHS");
  const [interestRatePerPeriod, setInterestRatePerPeriod] = useState("");
  const [interestRateFrequencyType, setInterestRateFrequencyType] = useState("PER_YEAR");
  const [amortizationType, setAmortizationType] = useState("EQUAL_INSTALLMENTS");
  const [interestType, setInterestType] = useState("DECLINING_BALANCE");
  const [interestCalculationPeriodType, setInterestCalculationPeriodType] = useState("DAILY");
  const [allowPartialPeriodInterest, setAllowPartialPeriodInterest] = useState(false);

  // Reference-driven dropdown options (readable Fineract option codes — see
  // src/api/backend/references.ts for the full category list).
  const [termFreqOptions, setTermFreqOptions] = useState<ReferenceValueDto[]>([]);
  const [repayFreqOptions, setRepayFreqOptions] = useState<ReferenceValueDto[]>([]);
  const [rateFreqOptions, setRateFreqOptions] = useState<ReferenceValueDto[]>([]);
  const [amortizationOptions, setAmortizationOptions] = useState<ReferenceValueDto[]>([]);
  const [interestTypeOptions, setInterestTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [calcPeriodOptions, setCalcPeriodOptions] = useState<ReferenceValueDto[]>([]);

  const [collateralTypeOptions, setCollateralTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [guarantorTypeOptions, setGuarantorTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    void referencesApi.list("LOAN_TERM_FREQUENCY_TYPE").then(setTermFreqOptions);
    void referencesApi.list("LOAN_REPAYMENT_FREQUENCY_TYPE").then(setRepayFreqOptions);
    void referencesApi.list("LOAN_INTEREST_RATE_FREQUENCY_TYPE").then(setRateFreqOptions);
    void referencesApi.list("LOAN_AMORTIZATION_TYPE").then(setAmortizationOptions);
    void referencesApi.list("LOAN_INTEREST_TYPE").then(setInterestTypeOptions);
    void referencesApi.list("LOAN_INTEREST_CALCULATION_PERIOD_TYPE").then(setCalcPeriodOptions);
    void referencesApi.list("COLLATERAL_TYPE").then(setCollateralTypeOptions);
    void referencesApi.list("GUARANTOR_TYPE").then(setGuarantorTypeOptions);
    void referencesApi.list("CLIENT_RELATIONSHIP_TYPE").then(setRelationshipOptions);
  }, []);

  // Picking a product prefills sensible starting numbers — the user can still
  // edit every field afterward.
  function selectProduct(code: string) {
    setProductCode(code);
    const p = products.find((x) => x.code === code);
    if (!p) return;
    if (p.principal) setPrincipal(String(p.principal));
    if (p.numberOfRepayments) setNumberOfRepayments(String(p.numberOfRepayments));
    if (p.repaymentEvery) setRepaymentEvery(String(p.repaymentEvery));
    if (p.numberOfRepayments && p.repaymentEvery) {
      setLoanTermFrequency(String(p.numberOfRepayments * p.repaymentEvery));
    }
    if (p.annualNominalInterestRate != null) {
      setInterestRatePerPeriod(String(p.annualNominalInterestRate));
    }
  }

  // ---- Collateral & guarantors ----
  // Posted to /loan-accounts/{accountNo}/collaterals and .../guarantors right
  // after loan creation succeeds — these are loan-scoped endpoints, so there's
  // no accountNo to post against until create() returns one.
  const [collateralDrafts, setCollateralDrafts] = useState<CollateralDraft[]>([]);
  const [guarantorDrafts, setGuarantorDrafts] = useState<GuarantorDraft[]>([]);
  const totalCollateral = collateralDrafts.reduce((s, c) => s + (parseFloat(c.value) || 0), 0);
  const principalNum = parseFloat(principal) || 0;
  const ltv = totalCollateral > 0 ? Math.round((principalNum / totalCollateral) * 100) : 0;

  // ---- Submit ----
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const payload: LoanAccountCreate | null = useMemo(() => {
    if (!client || !productCode) return null;
    return {
      clientId: client.id,
      productCode,
      principal: parseFloat(principal) || 0,
      loanType,
      loanTermFrequency: parseInt(loanTermFrequency, 10) || 0,
      loanTermFrequencyType,
      numberOfRepayments: parseInt(numberOfRepayments, 10) || 0,
      repaymentEvery: parseInt(repaymentEvery, 10) || 0,
      repaymentFrequencyType,
      interestRatePerPeriod: parseFloat(interestRatePerPeriod) || 0,
      interestRateFrequencyType,
      amortizationType,
      interestType,
      interestCalculationPeriodType,
      submittedOnDate,
      expectedDisbursementDate,
    };
  }, [
    client,
    productCode,
    principal,
    loanType,
    loanTermFrequency,
    loanTermFrequencyType,
    numberOfRepayments,
    repaymentEvery,
    repaymentFrequencyType,
    interestRatePerPeriod,
    interestRateFrequencyType,
    amortizationType,
    interestType,
    interestCalculationPeriodType,
    submittedOnDate,
    expectedDisbursementDate,
  ]);

  const stepValid: Record<Step, boolean> = {
    Borrower: !!client && !!productCode,
    "Loan Details":
      principalNum > 0 &&
      (parseInt(loanTermFrequency, 10) || 0) > 0 &&
      !!loanTermFrequencyType &&
      !!submittedOnDate,
    Repayment:
      (parseInt(numberOfRepayments, 10) || 0) > 0 &&
      (parseInt(repaymentEvery, 10) || 0) > 0 &&
      !!repaymentFrequencyType &&
      interestRatePerPeriod !== "" &&
      !!interestRateFrequencyType &&
      !!amortizationType &&
      !!interestType &&
      !!interestCalculationPeriodType,
    "Collateral & Guarantors": true,
    Review: true,
  };

  const canGoNext = stepValid[step];

  function goToStep(idx: number) {
    if (idx > furthestStepIdx) return;
    setStepIdx(idx);
  }

  function goNext() {
    if (!canGoNext) return;
    const next = Math.min(stepIdx + 1, STEPS.length - 1);
    setStepIdx(next);
    setFurthestStepIdx((f) => Math.max(f, next));
  }

  async function handleSubmit() {
    if (!payload) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await loanAccountsApi.create(payload);
      if (!result?.accountNo) throw new Error("Backend is not reachable right now.");
      const accountNo = result.accountNo;

      // Collateral/guarantors are loan-scoped endpoints — there's no accountNo
      // to post against until the loan itself exists. A failure here doesn't
      // roll back the loan (already created); it's surfaced separately so the
      // user knows to add the item manually from the Collateral & Guarantors
      // tab instead.
      let itemFailures = 0;
      for (const c of collateralDrafts) {
        const value = parseFloat(c.value) || 0;
        if (!c.collateralTypeCode || value <= 0) continue;
        try {
          await loanAccountsApi.addCollateral(accountNo, {
            collateralTypeCode: c.collateralTypeCode,
            value,
            description: c.description.trim() || undefined,
          });
        } catch {
          itemFailures++;
        }
      }
      for (const g of guarantorDrafts) {
        const entityId =
          g.guarantorTypeCode === "CUSTOMER"
            ? g.pickedClient?.fineractClientId
            : parseInt(g.entityId, 10) || undefined;
        if (!entityId || !g.clientRelationshipTypeCode) continue;
        try {
          await loanAccountsApi.addGuarantor(accountNo, {
            guarantorTypeCode: g.guarantorTypeCode,
            clientRelationshipTypeCode: g.clientRelationshipTypeCode,
            entityId,
          });
        } catch {
          itemFailures++;
        }
      }

      if (itemFailures > 0) {
        toast.error(
          `Loan ${accountNo} submitted, but ${itemFailures} collateral/guarantor item(s) failed to attach. Add them from the Collateral & Guarantors tab.`,
        );
      } else {
        toast.success(`Loan application submitted for ${client?.name}.`);
      }
      await refreshBackendData("loans:applications-total", () =>
        loanReportsApi.applicationsTotal(),
      );
      navigate({ to: "/loans/applications" });
    } catch (err) {
      setSubmitError(apiErrorMessage(err, "Something went wrong submitting this application."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: LOAN.pageBg, minHeight: "100%", padding: 24 }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Panel>
          <div
            className="flex items-center justify-between"
            style={{ padding: "18px 24px", borderBottom: `1px solid ${LOAN.border}` }}
          >
            <div style={{ ...fontDisplay, fontSize: 18, fontWeight: 200, color: LOAN.ink }}>
              Loan Application
            </div>
            <Link
              to="/loans/applications"
              className="flex items-center gap-1"
              style={{ fontSize: 12, color: LOAN.muted }}
            >
              <X size={14} /> Cancel
            </Link>
          </div>

          {/* Stepper */}
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${STEPS.length},1fr)`,
              padding: "16px 24px",
              borderBottom: `1px solid ${LOAN.border}`,
            }}
          >
            {STEPS.map((label, i) => {
              const completed = i < stepIdx;
              const isCurrent = i === stepIdx;
              const reachable = i <= furthestStepIdx;
              const color = completed ? LOAN.green : isCurrent ? LOAN.blue : LOAN.muted;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={!reachable}
                  onClick={() => goToStep(i)}
                  className="flex flex-col items-center gap-2"
                  style={{
                    background: "transparent",
                    border: "none",
                    textAlign: "center",
                    cursor: reachable ? "pointer" : "default",
                    padding: 0,
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background: completed ? LOAN.green : isCurrent ? LOAN.blueBg : "#F1F4FA",
                      color: completed ? "#fff" : isCurrent ? LOAN.blue : LOAN.muted,
                      border: isCurrent
                        ? `1px solid ${LOAN.blueBorder}`
                        : !completed
                          ? `1px solid ${LOAN.border}`
                          : undefined,
                    }}
                  >
                    {completed ? <Check size={13} /> : i + 1}
                  </div>
                  <div style={{ fontSize: 12, color, fontWeight: isCurrent ? 700 : 300 }}>
                    {label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div style={{ padding: 24, minHeight: 420 }}>
            {step === "Borrower" && (
              <BorrowerStep
                clientQuery={clientQuery}
                setClientQuery={setClientQuery}
                clientResults={clientResults}
                searchingClients={searchingClients}
                client={client}
                setClient={setClient}
                products={products}
                productCode={productCode}
                selectProduct={selectProduct}
                loanType={loanType}
                setLoanType={setLoanType}
              />
            )}

            {step === "Loan Details" && (
              <LoanDetailsStep
                principal={principal}
                setPrincipal={setPrincipal}
                loanTermFrequency={loanTermFrequency}
                setLoanTermFrequency={setLoanTermFrequency}
                loanTermFrequencyType={loanTermFrequencyType}
                setLoanTermFrequencyType={setLoanTermFrequencyType}
                termFreqOptions={termFreqOptions}
                submittedOnDate={submittedOnDate}
                setSubmittedOnDate={setSubmittedOnDate}
                expectedDisbursementDate={expectedDisbursementDate}
                setExpectedDisbursementDate={setExpectedDisbursementDate}
                product={product}
              />
            )}

            {step === "Repayment" && (
              <RepaymentStep
                numberOfRepayments={numberOfRepayments}
                setNumberOfRepayments={setNumberOfRepayments}
                repaymentEvery={repaymentEvery}
                setRepaymentEvery={setRepaymentEvery}
                repaymentFrequencyType={repaymentFrequencyType}
                setRepaymentFrequencyType={setRepaymentFrequencyType}
                repayFreqOptions={repayFreqOptions}
                interestRatePerPeriod={interestRatePerPeriod}
                setInterestRatePerPeriod={setInterestRatePerPeriod}
                interestRateFrequencyType={interestRateFrequencyType}
                setInterestRateFrequencyType={setInterestRateFrequencyType}
                rateFreqOptions={rateFreqOptions}
                amortizationType={amortizationType}
                setAmortizationType={setAmortizationType}
                amortizationOptions={amortizationOptions}
                interestType={interestType}
                setInterestType={setInterestType}
                interestTypeOptions={interestTypeOptions}
                interestCalculationPeriodType={interestCalculationPeriodType}
                setInterestCalculationPeriodType={setInterestCalculationPeriodType}
                calcPeriodOptions={calcPeriodOptions}
                allowPartialPeriodInterest={allowPartialPeriodInterest}
                setAllowPartialPeriodInterest={setAllowPartialPeriodInterest}
              />
            )}

            {step === "Collateral & Guarantors" && (
              <CollateralStep
                collateralDrafts={collateralDrafts}
                setCollateralDrafts={setCollateralDrafts}
                collateralTypeOptions={collateralTypeOptions}
                guarantorDrafts={guarantorDrafts}
                setGuarantorDrafts={setGuarantorDrafts}
                guarantorTypeOptions={guarantorTypeOptions}
                relationshipOptions={relationshipOptions}
                ltv={ltv}
              />
            )}

            {step === "Review" && (
              <ReviewStep
                client={client}
                product={product}
                loanType={loanType}
                principal={principalNum}
                loanTermFrequency={loanTermFrequency}
                loanTermFrequencyType={loanTermFrequencyType}
                expectedDisbursementDate={expectedDisbursementDate}
                numberOfRepayments={numberOfRepayments}
                repaymentFrequencyType={repaymentFrequencyType}
                interestRatePerPeriod={interestRatePerPeriod}
                interestRateFrequencyType={interestRateFrequencyType}
                interestType={interestType}
                amortizationType={amortizationType}
                collateralDrafts={collateralDrafts}
                guarantorDrafts={guarantorDrafts}
                payload={payload}
                submitError={submitError}
              />
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 24px", borderTop: `1px solid ${LOAN.border}` }}
          >
            {stepIdx > 0 ? (
              <Button variant="outline" onClick={() => setStepIdx(stepIdx - 1)}>
                Previous
              </Button>
            ) : (
              <span />
            )}
            <div style={{ fontSize: 11, color: LOAN.muted }}>
              Step {stepIdx + 1} of {STEPS.length}
            </div>
            {step !== "Review" ? (
              <Button variant="success" onClick={goNext} disabled={!canGoNext}>
                Next →
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={() => void handleSubmit()}
                disabled={!payload || submitting}
              >
                {submitting ? "Submitting…" : "Submit Loan"}
              </Button>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ---------- Shared field primitives ----------

// Light fill (matches the search-bar treatment used elsewhere in the app)
// so an editable field box reads as an input, not a static info card like
// ReviewCard's white bordered rows.
function FieldBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${LOAN.border}`,
        borderRadius: 12,
        padding: 14,
        background: "#F5F8FE",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 300,
          color: LOAN.muted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

const boxInputCss: React.CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  padding: 0,
  fontSize: 15,
  fontWeight: 100,
  color: LOAN.ink,
  background: "transparent",
};

// Highlights the parent FieldBox's border on focus so it's obvious which
// field is active, since the box itself carries no other focus affordance.
function BoxInput({
  onFocus,
  onBlur,
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      onFocus={(e) => {
        e.currentTarget.parentElement!.style.borderColor = LOAN.navy;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.parentElement!.style.borderColor = LOAN.border;
        onBlur?.(e);
      }}
      style={{ ...boxInputCss, ...style }}
    />
  );
}

function BoxSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.currentTarget.parentElement!.style.borderColor = LOAN.navy;
      }}
      onBlur={(e) => {
        e.currentTarget.parentElement!.style.borderColor = LOAN.border;
      }}
      style={{ ...boxInputCss, fontSize: 14, cursor: "pointer" }}
    >
      {options.length === 0 && <option value={value}>{value || "—"}</option>}
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.name}
        </option>
      ))}
    </select>
  );
}

// ---------- Step 1: Borrower ----------

function BorrowerStep({
  clientQuery,
  setClientQuery,
  clientResults,
  searchingClients,
  client,
  setClient,
  products,
  productCode,
  selectProduct,
  loanType,
  setLoanType,
}: {
  clientQuery: string;
  setClientQuery: (v: string) => void;
  clientResults: Client[];
  searchingClients: boolean;
  client: Client | null;
  setClient: (c: Client | null) => void;
  products: ProductDto[];
  productCode: string | null;
  selectProduct: (code: string) => void;
  loanType: string;
  setLoanType: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Borrower</SectionLabel>
        {client ? (
          <div
            className="flex items-center justify-between mt-2"
            style={{
              padding: 12,
              background: "#F4F6FB",
              borderRadius: 10,
              border: `1px solid ${LOAN.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 300, color: LOAN.ink }}>{client.name}</div>
              <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>
                {client.clientNumber} · {client.officeName}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setClient(null);
                setClientQuery("");
              }}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="relative mt-2">
            <input
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Search clients by name or client number…"
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                border: `1px solid ${LOAN.border}`,
                borderRadius: 10,
                fontSize: 13,
                background: "#F5F8FE",
              }}
            />
            {clientQuery.trim() && (
              <div
                className="absolute z-10 bg-white"
                style={{
                  top: 44,
                  left: 0,
                  right: 0,
                  border: `1px solid ${LOAN.border}`,
                  borderRadius: 10,
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {searchingClients ? (
                  <div style={{ padding: 12, fontSize: 12, color: LOAN.muted }}>Searching…</div>
                ) : clientResults.length === 0 ? (
                  <div style={{ padding: 12, fontSize: 12, color: LOAN.muted }}>
                    No clients found.
                  </div>
                ) : (
                  clientResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setClient(c);
                        setClientQuery("");
                      }}
                      className="block w-full text-left"
                      style={{ padding: 10, borderBottom: `1px solid ${LOAN.border}` }}
                    >
                      <div style={{ fontSize: 13, color: LOAN.ink }}>{c.name}</div>
                      <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>
                        {c.clientNumber}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <SectionLabel>Loan Product</SectionLabel>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {products.map((p) => {
            const selected = p.code === productCode;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => selectProduct(p.code)}
                style={{
                  textAlign: "left",
                  border: `1px solid ${selected ? LOAN.navy : LOAN.border}`,
                  background: selected ? LOAN.blueBg : "#fff",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 100, color: LOAN.ink }}>{p.name}</div>
                <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2 }}>
                  {p.code}
                  {p.minPrincipal != null && p.maxPrincipal != null
                    ? ` · ${fmtGHS(p.minPrincipal)} – ${fmtGHS(p.maxPrincipal)}`
                    : ""}
                </div>
              </button>
            );
          })}
          {products.length === 0 && (
            <div style={{ fontSize: 12, color: LOAN.muted }}>Loading products…</div>
          )}
        </div>
      </div>

      <FieldBox label="Loan Type">
        <BoxSelect value={loanType} onChange={setLoanType} options={LOAN_TYPES} />
      </FieldBox>
    </div>
  );
}

// ---------- Step 2: Loan Details ----------

function LoanDetailsStep({
  principal,
  setPrincipal,
  loanTermFrequency,
  setLoanTermFrequency,
  loanTermFrequencyType,
  setLoanTermFrequencyType,
  termFreqOptions,
  submittedOnDate,
  setSubmittedOnDate,
  expectedDisbursementDate,
  setExpectedDisbursementDate,
  product,
}: {
  principal: string;
  setPrincipal: (v: string) => void;
  loanTermFrequency: string;
  setLoanTermFrequency: (v: string) => void;
  loanTermFrequencyType: string;
  setLoanTermFrequencyType: (v: string) => void;
  termFreqOptions: ReferenceValueDto[];
  submittedOnDate: string;
  setSubmittedOnDate: (v: string) => void;
  expectedDisbursementDate: string;
  setExpectedDisbursementDate: (v: string) => void;
  product: ProductDto | null;
}) {
  return (
    <div className="space-y-4">
      <SectionLabel>Loan Details</SectionLabel>
      {product?.minPrincipal != null && product?.maxPrincipal != null && (
        <div style={{ fontSize: 12, color: LOAN.muted }}>
          {product.name} allows {fmtGHS(product.minPrincipal)} – {fmtGHS(product.maxPrincipal)}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <FieldBox label="Principal">
          <BoxInput
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            inputMode="decimal"
          />
        </FieldBox>
        <FieldBox label="Loan Term">
          <BoxInput
            value={loanTermFrequency}
            onChange={(e) => setLoanTermFrequency(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="12"
            inputMode="numeric"
          />
        </FieldBox>
        <FieldBox label="Term Frequency">
          <BoxSelect
            value={loanTermFrequencyType}
            onChange={setLoanTermFrequencyType}
            options={termFreqOptions}
          />
        </FieldBox>
        <FieldBox label="Submitted Date">
          <BoxInput
            type="date"
            value={submittedOnDate}
            onChange={(e) => setSubmittedOnDate(e.target.value)}
          />
        </FieldBox>
      </div>
      <FieldBox label="Expected Disbursement Date">
        <BoxInput
          type="date"
          value={expectedDisbursementDate}
          onChange={(e) => setExpectedDisbursementDate(e.target.value)}
        />
      </FieldBox>
    </div>
  );
}

// ---------- Step 3: Repayment & Interest ----------

function RepaymentStep({
  numberOfRepayments,
  setNumberOfRepayments,
  repaymentEvery,
  setRepaymentEvery,
  repaymentFrequencyType,
  setRepaymentFrequencyType,
  repayFreqOptions,
  interestRatePerPeriod,
  setInterestRatePerPeriod,
  interestRateFrequencyType,
  setInterestRateFrequencyType,
  rateFreqOptions,
  amortizationType,
  setAmortizationType,
  amortizationOptions,
  interestType,
  setInterestType,
  interestTypeOptions,
  interestCalculationPeriodType,
  setInterestCalculationPeriodType,
  calcPeriodOptions,
  allowPartialPeriodInterest,
  setAllowPartialPeriodInterest,
}: {
  numberOfRepayments: string;
  setNumberOfRepayments: (v: string) => void;
  repaymentEvery: string;
  setRepaymentEvery: (v: string) => void;
  repaymentFrequencyType: string;
  setRepaymentFrequencyType: (v: string) => void;
  repayFreqOptions: ReferenceValueDto[];
  interestRatePerPeriod: string;
  setInterestRatePerPeriod: (v: string) => void;
  interestRateFrequencyType: string;
  setInterestRateFrequencyType: (v: string) => void;
  rateFreqOptions: ReferenceValueDto[];
  amortizationType: string;
  setAmortizationType: (v: string) => void;
  amortizationOptions: ReferenceValueDto[];
  interestType: string;
  setInterestType: (v: string) => void;
  interestTypeOptions: ReferenceValueDto[];
  interestCalculationPeriodType: string;
  setInterestCalculationPeriodType: (v: string) => void;
  calcPeriodOptions: ReferenceValueDto[];
  allowPartialPeriodInterest: boolean;
  setAllowPartialPeriodInterest: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Repayment Schedule</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FieldBox label="Number of Repayments">
            <BoxInput
              value={numberOfRepayments}
              onChange={(e) => setNumberOfRepayments(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="12"
              inputMode="numeric"
            />
          </FieldBox>
          <FieldBox label="Repay Every">
            <BoxInput
              value={repaymentEvery}
              onChange={(e) => setRepaymentEvery(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="1"
              inputMode="numeric"
            />
          </FieldBox>
          <FieldBox label="Repayment Frequency">
            <BoxSelect
              value={repaymentFrequencyType}
              onChange={setRepaymentFrequencyType}
              options={repayFreqOptions}
            />
          </FieldBox>
          <FieldBox label="Interest Rate (%)">
            <BoxInput
              value={interestRatePerPeriod}
              onChange={(e) => setInterestRatePerPeriod(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="30.00"
              inputMode="decimal"
            />
          </FieldBox>
        </div>
      </div>

      <div>
        <SectionLabel>Interest Configuration</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FieldBox label="Interest Frequency">
            <BoxSelect
              value={interestRateFrequencyType}
              onChange={setInterestRateFrequencyType}
              options={rateFreqOptions}
            />
          </FieldBox>
          <FieldBox label="Amortization">
            <BoxSelect
              value={amortizationType}
              onChange={setAmortizationType}
              options={amortizationOptions}
            />
          </FieldBox>
          <FieldBox label="Interest Method">
            <BoxSelect
              value={interestType}
              onChange={setInterestType}
              options={interestTypeOptions}
            />
          </FieldBox>
          <FieldBox label="Calculation Period">
            <BoxSelect
              value={interestCalculationPeriodType}
              onChange={setInterestCalculationPeriodType}
              options={calcPeriodOptions}
            />
          </FieldBox>
        </div>
      </div>

      <label className="flex items-center gap-2" style={{ fontSize: 12, color: LOAN.ink }}>
        <input
          type="checkbox"
          checked={allowPartialPeriodInterest}
          onChange={(e) => setAllowPartialPeriodInterest(e.target.checked)}
        />
        Allow Partial Period Interest Calculation
      </label>
    </div>
  );
}

// ---------- Step 4: Collateral & Guarantors ----------

function updateAt<T>(arr: T[], setter: (next: T[]) => void, i: number, patch: Partial<T>) {
  const copy = arr.slice();
  copy[i] = { ...copy[i], ...patch };
  setter(copy);
}

const simpleSelectCss: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid ${LOAN.border}`,
  borderRadius: 10,
  fontSize: 13,
  background: "#F5F8FE",
};

function CollateralStep({
  collateralDrafts,
  setCollateralDrafts,
  collateralTypeOptions,
  guarantorDrafts,
  setGuarantorDrafts,
  guarantorTypeOptions,
  relationshipOptions,
  ltv,
}: {
  collateralDrafts: CollateralDraft[];
  setCollateralDrafts: (v: CollateralDraft[]) => void;
  collateralTypeOptions: ReferenceValueDto[];
  guarantorDrafts: GuarantorDraft[];
  setGuarantorDrafts: (v: GuarantorDraft[]) => void;
  guarantorTypeOptions: ReferenceValueDto[];
  relationshipOptions: ReferenceValueDto[];
  ltv: number;
}) {
  return (
    <div className="space-y-6">
      <div
        style={{
          background: LOAN.blueBg,
          border: `1px solid ${LOAN.blueBorder}`,
          color: "#1E40AF",
          padding: 10,
          borderRadius: 10,
          fontSize: 12,
        }}
      >
        Optional — posted to Fineract right after the loan is created. Incomplete rows are skipped
        rather than blocking submission.
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionLabel>Collateral</SectionLabel>
          {collateralDrafts.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 100,
                color: ltv > 70 ? LOAN.red : LOAN.green,
                background: ltv > 70 ? LOAN.redBg : LOAN.greenBg,
                padding: "2px 10px",
                borderRadius: 999,
              }}
            >
              LTV {ltv}%{ltv > 70 ? " · over 70% cap" : ""}
            </span>
          )}
        </div>
        <div className="mt-2 space-y-2">
          {collateralDrafts.map((c, i) => (
            <div
              key={i}
              className="grid gap-2"
              style={{ gridTemplateColumns: "1fr 1fr 1.4fr auto" }}
            >
              <select
                value={c.collateralTypeCode}
                onChange={(e) =>
                  updateAt(collateralDrafts, setCollateralDrafts, i, {
                    collateralTypeCode: e.target.value,
                  })
                }
                style={simpleSelectCss}
              >
                <option value="">Type…</option>
                {collateralTypeOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
              <SimpleInput
                value={c.value}
                onChange={(v) =>
                  updateAt(collateralDrafts, setCollateralDrafts, i, {
                    value: v.replace(/[^\d.]/g, ""),
                  })
                }
                placeholder="Value"
              />
              <SimpleInput
                value={c.description}
                onChange={(v) =>
                  updateAt(collateralDrafts, setCollateralDrafts, i, { description: v })
                }
                placeholder="Description (optional)"
              />
              <button
                type="button"
                onClick={() => setCollateralDrafts(collateralDrafts.filter((_, j) => j !== i))}
                style={{ color: LOAN.muted, padding: "0 6px" }}
                aria-label="Remove collateral"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCollateralDrafts([...collateralDrafts, emptyCollateralDraft()])}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: `1px dashed ${LOAN.border}`,
              background: "transparent",
              color: LOAN.muted,
              fontSize: 12,
            }}
          >
            + Add collateral
          </button>
        </div>
      </div>

      <div>
        <SectionLabel>Guarantors</SectionLabel>
        <div className="mt-2 space-y-3">
          {guarantorDrafts.map((g, i) => (
            <GuarantorRow
              key={i}
              draft={g}
              guarantorTypeOptions={guarantorTypeOptions}
              relationshipOptions={relationshipOptions}
              onChange={(patch) => updateAt(guarantorDrafts, setGuarantorDrafts, i, patch)}
              onRemove={() => setGuarantorDrafts(guarantorDrafts.filter((_, j) => j !== i))}
            />
          ))}
          <button
            type="button"
            onClick={() => setGuarantorDrafts([...guarantorDrafts, emptyGuarantorDraft()])}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: `1px dashed ${LOAN.border}`,
              background: "transparent",
              color: LOAN.muted,
              fontSize: 12,
            }}
          >
            + Add guarantor
          </button>
        </div>
      </div>
    </div>
  );
}

function GuarantorRow({
  draft,
  guarantorTypeOptions,
  relationshipOptions,
  onChange,
  onRemove,
}: {
  draft: GuarantorDraft;
  guarantorTypeOptions: ReferenceValueDto[];
  relationshipOptions: ReferenceValueDto[];
  onChange: (patch: Partial<GuarantorDraft>) => void;
  onRemove: () => void;
}) {
  const isCustomer = draft.guarantorTypeCode === "CUSTOMER";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isCustomer || draft.pickedClient) {
      setResults([]);
      return;
    }
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      clientsApi
        .search({ keyword: q, size: 6 })
        .then(setResults)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isCustomer, draft.pickedClient]);

  return (
    <div
      style={{ border: `1px solid ${LOAN.border}`, borderRadius: 10, padding: 10 }}
      className="space-y-2"
    >
      <div className="grid grid-cols-2 gap-2">
        <select
          value={draft.guarantorTypeCode}
          onChange={(e) =>
            onChange({ guarantorTypeCode: e.target.value, pickedClient: null, entityId: "" })
          }
          style={simpleSelectCss}
        >
          {guarantorTypeOptions.length === 0 && <option value="CUSTOMER">Customer</option>}
          {guarantorTypeOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
        <select
          value={draft.clientRelationshipTypeCode}
          onChange={(e) => onChange({ clientRelationshipTypeCode: e.target.value })}
          style={simpleSelectCss}
        >
          <option value="">Relationship…</option>
          {relationshipOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      {isCustomer ? (
        draft.pickedClient ? (
          <div
            className="flex items-center justify-between"
            style={{ ...simpleSelectCss, height: "auto", padding: "8px 12px" }}
          >
            <span>{draft.pickedClient.name}</span>
            <button
              type="button"
              onClick={() => onChange({ pickedClient: null })}
              style={{ color: LOAN.blue, fontSize: 12 }}
            >
              Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <SimpleInput value={query} onChange={setQuery} placeholder="Search clients…" />
            {query.trim() && (
              <div
                className="absolute z-10 bg-white"
                style={{
                  top: 40,
                  left: 0,
                  right: 0,
                  border: `1px solid ${LOAN.border}`,
                  borderRadius: 8,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {searching ? (
                  <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>Searching…</div>
                ) : results.length === 0 ? (
                  <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>
                    No clients found.
                  </div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onChange({ pickedClient: c });
                        setQuery("");
                      }}
                      className="block w-full text-left"
                      style={{ padding: 8, borderBottom: `1px solid ${LOAN.border}` }}
                    >
                      <div style={{ fontSize: 13 }}>{c.name}</div>
                      <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>
                        {c.clientNumber}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )
      ) : (
        <SimpleInput
          value={draft.entityId}
          onChange={(v) => onChange({ entityId: v.replace(/[^\d]/g, "") })}
          placeholder={
            draft.guarantorTypeCode === "STAFF" ? "Staff numeric id" : "External entity id"
          }
        />
      )}

      <button type="button" onClick={onRemove} style={{ fontSize: 11, color: LOAN.red }}>
        Remove guarantor
      </button>
    </div>
  );
}

function SimpleInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: 38,
        padding: "0 12px",
        border: `1px solid ${LOAN.border}`,
        borderRadius: 10,
        fontSize: 13,
        background: "#F5F8FE",
      }}
    />
  );
}

// ---------- Step 5: Review ----------

function ReviewStep({
  client,
  product,
  loanType,
  principal,
  loanTermFrequency,
  loanTermFrequencyType,
  expectedDisbursementDate,
  numberOfRepayments,
  repaymentFrequencyType,
  interestRatePerPeriod,
  interestRateFrequencyType,
  interestType,
  amortizationType,
  collateralDrafts,
  guarantorDrafts,
  payload,
  submitError,
}: {
  client: Client | null;
  product: ProductDto | null;
  loanType: string;
  principal: number;
  loanTermFrequency: string;
  loanTermFrequencyType: string;
  expectedDisbursementDate: string;
  numberOfRepayments: string;
  repaymentFrequencyType: string;
  interestRatePerPeriod: string;
  interestRateFrequencyType: string;
  interestType: string;
  amortizationType: string;
  collateralDrafts: CollateralDraft[];
  guarantorDrafts: GuarantorDraft[];
  payload: LoanAccountCreate | null;
  submitError: string | null;
}) {
  return (
    <div className="space-y-5">
      <SectionLabel>Review Loan Application</SectionLabel>

      <ReviewCard title="Borrower Information">
        <ReviewRow label="Client" value={client?.name ?? "—"} />
        <ReviewRow label="Loan Product" value={product?.name ?? "—"} />
        <ReviewRow label="Loan Type" value={loanType === "group" ? "Group" : "Individual"} />
      </ReviewCard>

      <ReviewCard title="Loan Details">
        <ReviewRow label="Principal" value={fmtGHS(principal)} />
        <ReviewRow
          label="Term"
          value={`${loanTermFrequency || "—"} ${loanTermFrequencyType.toLowerCase()}`}
        />
        <ReviewRow label="Disbursement Date" value={expectedDisbursementDate} />
      </ReviewCard>

      <ReviewCard title="Repayment Plan">
        <ReviewRow label="Installments" value={numberOfRepayments || "—"} />
        <ReviewRow label="Frequency" value={repaymentFrequencyType} />
        <ReviewRow
          label="Interest Rate"
          value={`${interestRatePerPeriod || "0"}% ${interestRateFrequencyType.replace("_", " ").toLowerCase()}`}
        />
        <ReviewRow label="Method" value={interestType.replace(/_/g, " ")} />
        <ReviewRow label="Amortization" value={amortizationType.replace(/_/g, " ")} />
      </ReviewCard>

      {(collateralDrafts.length > 0 || guarantorDrafts.length > 0) && (
        <ReviewCard title="Collateral & Guarantors">
          <ReviewRow label="Collateral items" value={String(collateralDrafts.length)} />
          <ReviewRow label="Guarantors" value={String(guarantorDrafts.length)} />
        </ReviewCard>
      )}

      <div>
        <SectionLabel>Fineract Payload Preview</SectionLabel>
        <pre
          style={{
            marginTop: 8,
            background: "#0D1B3E",
            color: "#D6E4FF",
            borderRadius: 10,
            padding: 14,
            fontSize: 12,
            overflowX: "auto",
            ...fontMono,
          }}
        >
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      {submitError && (
        <div
          className="flex items-center gap-2"
          style={{
            background: LOAN.redBg,
            border: `1px solid ${LOAN.red}`,
            color: LOAN.red,
            borderRadius: 10,
            padding: 10,
            fontSize: 12,
          }}
        >
          <AlertTriangle size={14} /> {submitError}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 100, color: LOAN.ink, marginBottom: 6 }}>{title}</div>
      <div style={{ border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 4 }}>
        {children}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "8px 12px", fontSize: 13 }}
    >
      <span style={{ color: LOAN.muted }}>{label}</span>
      <span style={{ color: LOAN.ink, fontWeight: 300 }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...fontDisplay, fontSize: 15, fontWeight: 200, color: LOAN.ink }}>{children}</div>
  );
}
