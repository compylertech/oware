import { useMemo, useState } from "react";
import { X, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { fontDisplay, fontMono, NavyBtn, OutlineBtn } from "./ui";
import { WIZARD_PRODUCTS, fmtGHS } from "@/lib/loanMock";

type Collateral = { asset: string; type: string; valuation: number };
type Guarantor = { name: string; relation: string; amount: number; coop: boolean };

export function NewApplicationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [clientNo, setClientNo] = useState("");
  const [productIdx, setProductIdx] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [purpose, setPurpose] = useState("");
  const [tenure, setTenure] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [branch, setBranch] = useState("Accra Main");
  const [officer, setOfficer] = useState("A.Owusu");
  const [collateral, setCollateral] = useState<Collateral[]>([]);
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);

  if (!open) return null;
  const product = productIdx != null ? WIZARD_PRODUCTS[productIdx] : null;

  const exceeds = !!product && amount > product.max;
  const totalCollat = collateral.reduce((s, c) => s + (c.valuation || 0), 0);
  const ltv =
    product?.secured && totalCollat > 0 ? Math.round((amount / totalCollat) * 100) : 0;

  const eligibility = useMemo(() => {
    const checks: { label: string; ok: boolean; value: string }[] = [
      {
        label: "Amount within product cap",
        ok: !exceeds && amount > 0,
        value: product ? `${fmtGHS(amount)} / ${fmtGHS(product.max)}` : "—",
      },
      {
        label: "Tenure set",
        ok: tenure > 0,
        value: tenure ? `${tenure} months` : "missing",
      },
      {
        label: "Officer assigned",
        ok: !!officer,
        value: officer || "missing",
      },
      {
        label: "Collateral coverage (≤70% LTV)",
        ok: !product?.secured || (collateral.length > 0 && ltv <= 70),
        value: product?.secured ? (collateral.length > 0 ? `${ltv}% LTV` : "no collateral") : "n/a",
      },
      {
        label: "Guarantor(s) attached",
        ok: !product?.secured || guarantors.length > 0,
        value: `${guarantors.length} attached`,
      },
    ];
    const failures = checks.filter((c) => !c.ok).length;
    let outcome: "Eligible" | "Needs review" | "Ineligible" = "Eligible";
    if (failures >= 3) outcome = "Ineligible";
    else if (failures > 0) outcome = "Needs review";
    return { checks, outcome };
  }, [exceeds, amount, product, tenure, officer, collateral, ltv, guarantors]);

  const step1OK = !!name && !!product && amount > 0 && !exceeds;
  const step2OK = tenure > 0 && rate > 0;
  const canContinue =
    (step === 1 && step1OK) ||
    (step === 2 && step2OK) ||
    step === 3 ||
    (step === 4 && eligibility.outcome !== "Ineligible");

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setName("");
      setClientNo("");
      setProductIdx(null);
      setAmount(0);
      setPurpose("");
      setTenure(0);
      setRate(0);
      setCollateral([]);
      setGuarantors([]);
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(16,33,73,0.25)" }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full flex-col bg-white"
        style={{
          width: 560,
          borderLeft: `1px solid ${LOAN.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6"
          style={{ height: 64, borderBottom: `1px solid ${LOAN.border}` }}
        >
          <div style={{ ...fontDisplay, fontSize: 18, fontWeight: 800, color: LOAN.ink }}>
            New loan application
          </div>
          <button onClick={close} style={{ background: "transparent", border: "none", color: LOAN.muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="grid gap-2 px-6" style={{ gridTemplateColumns: "repeat(4,1fr)", padding: "16px 24px", borderBottom: `1px solid ${LOAN.border}` }}>
          {["Applicant & product", "Terms", "Collateral & guarantors", "Review"].map((label, i) => {
            const idx = i + 1;
            const completed = idx < step;
            const current = idx === step;
            const color = completed ? LOAN.navy : current ? LOAN.blue : LOAN.muted;
            const bg = completed ? LOAN.navy : current ? LOAN.blue : "#E6EAF2";
            return (
              <div key={label}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      background: completed ? LOAN.navy : current ? LOAN.blueBg : "#F1F4FA",
                      color: completed ? "#fff" : color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      border: current ? `1px solid ${LOAN.blueBorder}` : undefined,
                    }}
                  >
                    {completed ? <Check size={12} /> : idx}
                  </div>
                  <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ height: 4, borderRadius: 999, background: bg }} />
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ background: "#fff" }}>
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Applicant name">
                <Input value={name} onChange={setName} placeholder="Search clients…" />
              </Field>
              <Field label="Member / client no.">
                <Input value={clientNo} onChange={setClientNo} placeholder="CL-00124" mono />
              </Field>
              <div>
                <Label>Loan product</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {WIZARD_PRODUCTS.map((p, i) => {
                    const selected = i === productIdx;
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          setProductIdx(i);
                          setTenure(p.tenure);
                          setRate(p.rateValue);
                        }}
                        style={{
                          textAlign: "left",
                          border: `1px solid ${selected ? LOAN.navy : LOAN.border}`,
                          background: selected ? LOAN.blueBg : "#fff",
                          borderRadius: 10,
                          padding: 10,
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: LOAN.ink }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 2 }}>
                          {p.rate} · {p.secured ? "secured" : "unsecured"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Amount (GH₵)">
                <Input
                  value={amount ? String(amount) : ""}
                  onChange={(v) => setAmount(Number(v.replace(/[^\d]/g, "")) || 0)}
                  placeholder="0"
                />
                {exceeds && (
                  <div style={{ color: LOAN.red, fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                    Exceeds product max ({fmtGHS(product!.max)})
                  </div>
                )}
              </Field>
              <Field label="Purpose">
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    border: `1px solid ${LOAN.border}`,
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
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
                Defaults prefilled from {product?.name ?? "selected product"}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tenure (months)">
                  <Input value={String(tenure)} onChange={(v) => setTenure(Number(v) || 0)} />
                </Field>
                <Field label="Interest rate (%)">
                  <Input value={String(rate)} onChange={(v) => setRate(Number(v) || 0)} />
                </Field>
                <Field label="Branch">
                  <Select value={branch} onChange={setBranch} options={["Accra Main", "Kumasi Central", "Takoradi", "Tema"]} />
                </Field>
                <Field label="Loan officer">
                  <Select value={officer} onChange={setOfficer} options={["A.Owusu", "K.Asante", "V.Yeboah", "D.Quaidoo"]} />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Collateral</Label>
                  {product?.secured && collateral.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
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
                  {collateral.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input value={c.asset} onChange={(v) => updateAt(collateral, setCollateral, i, { asset: v })} placeholder="Asset" />
                      <Input value={c.type} onChange={(v) => updateAt(collateral, setCollateral, i, { type: v })} placeholder="Type" />
                      <Input value={c.valuation ? String(c.valuation) : ""} onChange={(v) => updateAt(collateral, setCollateral, i, { valuation: Number(v.replace(/[^\d]/g, "")) || 0 })} placeholder="Valuation" />
                    </div>
                  ))}
                  <button
                    onClick={() => setCollateral([...collateral, { asset: "", type: "", valuation: 0 }])}
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
                <Label>Guarantors</Label>
                <div className="mt-2 space-y-2">
                  {guarantors.map((g, i) => (
                    <div key={i} className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={g.name} onChange={(v) => updateAt(guarantors, setGuarantors, i, { name: v })} placeholder="Name" />
                        <Input value={g.relation} onChange={(v) => updateAt(guarantors, setGuarantors, i, { relation: v })} placeholder="Relationship" />
                        <Input value={g.amount ? String(g.amount) : ""} onChange={(v) => updateAt(guarantors, setGuarantors, i, { amount: Number(v.replace(/[^\d]/g, "")) || 0 })} placeholder="Amount" />
                      </div>
                      <label className="flex items-center gap-2" style={{ fontSize: 12, color: LOAN.muted }}>
                        <input type="checkbox" checked={g.coop} onChange={(e) => updateAt(guarantors, setGuarantors, i, { coop: e.target.checked })} />
                        <ShieldCheck size={12} /> Co-op member
                      </label>
                    </div>
                  ))}
                  <button
                    onClick={() => setGuarantors([...guarantors, { name: "", relation: "", amount: 0, coop: false }])}
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
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div style={{ border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 800, color: LOAN.ink }}>
                  {name || "—"}
                </div>
                <div style={{ fontSize: 12, color: LOAN.muted }}>
                  <span style={fontMono}>{clientNo || "CL-—"}</span> · {branch}
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <SummaryRow label="Product" value={product?.name ?? "—"} />
                  <SummaryRow label="Amount" value={fmtGHS(amount)} />
                  <SummaryRow label="Tenure" value={`${tenure} months`} />
                  <SummaryRow label="Rate" value={`${rate}%`} />
                  <SummaryRow label="Officer" value={officer} />
                  <SummaryRow label="Collateral" value={collateral.length ? `${collateral.length} items · ${fmtGHS(totalCollat)}` : "—"} />
                  <SummaryRow label="Guarantors" value={String(guarantors.length)} />
                </div>
                {purpose && (
                  <div style={{ marginTop: 10, fontSize: 12, fontStyle: "italic", color: LOAN.muted }}>
                    "{purpose}"
                  </div>
                )}
              </div>

              <div style={{ border: `1px solid ${LOAN.border}`, borderRadius: 12, padding: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: LOAN.ink }}>Eligibility</div>
                  <OutcomePill outcome={eligibility.outcome} />
                </div>
                <div className="space-y-1.5">
                  {eligibility.checks.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-center justify-between"
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: c.ok ? "transparent" : "#FFFAF9",
                        fontSize: 12,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {c.ok ? (
                          <Check size={14} color={LOAN.green} />
                        ) : (
                          <AlertTriangle size={14} color={LOAN.red} />
                        )}
                        <span style={{ color: LOAN.ink }}>{c.label}</span>
                      </div>
                      <span style={{ color: LOAN.muted, fontWeight: 600 }}>{c.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: LOAN.muted }}>
                  Eligible → ready for approval queue. Needs review → routed for override approval. Ineligible → resolve failures first.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6"
          style={{ height: 64, borderTop: `1px solid ${LOAN.border}`, background: "#fff" }}
        >
          {step > 1 ? (
            <OutlineBtn onClick={() => setStep(step - 1)}>Back</OutlineBtn>
          ) : (
            <span />
          )}
          <div style={{ fontSize: 11, color: LOAN.muted }}>Step {step} of 4</div>
          {step < 4 ? (
            <NavyBtn onClick={() => setStep(step + 1)} disabled={!canContinue}>
              Continue
            </NavyBtn>
          ) : (
            <NavyBtn onClick={close} disabled={eligibility.outcome === "Ineligible"}>
              {eligibility.outcome === "Needs review" ? "Submit for approval" : "Submit application"}
            </NavyBtn>
          )}
        </div>
      </div>
    </div>
  );
}

function updateAt<T>(arr: T[], setter: (next: T[]) => void, i: number, patch: Partial<T>) {
  const copy = arr.slice();
  copy[i] = { ...copy[i], ...patch };
  setter(copy);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 600, color: LOAN.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
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
        ...(mono ? fontMono : {}),
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 38,
        padding: "0 12px",
        border: `1px solid ${LOAN.border}`,
        borderRadius: 10,
        fontSize: 13,
        background: "#fff",
      }}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: LOAN.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: LOAN.ink, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: "Eligible" | "Needs review" | "Ineligible" }) {
  const map = {
    Eligible: { c: LOAN.green, b: LOAN.greenBg },
    "Needs review": { c: LOAN.amber, b: LOAN.amberBg },
    Ineligible: { c: LOAN.red, b: LOAN.redBg },
  } as const;
  const s = map[outcome];
  return (
    <span
      style={{
        background: s.b,
        color: s.c,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {outcome}
    </span>
  );
}
