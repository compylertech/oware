import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  MapPin,
  Users,
  ShieldCheck,
  Handshake,
  Check,
  ChevronRight,
} from "lucide-react";
import { addClient, addCoopMember, nextClientNumber, type Client } from "@/lib/mockStore";

export const Route = createFileRoute("/_auth/clients/add")({
  component: AddClientPage,
});

const NAVY = "#002663";

type StepId = 1 | 2 | 3 | 4 | 5;

const STEPS: {
  id: StepId;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Address", icon: MapPin },
  { id: 3, label: "Family Details", icon: Users },
  { id: 4, label: "Identity", icon: ShieldCheck },
  { id: 5, label: "Cooperative", icon: Handshake },
];

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  gender: string;
  mobile: string;
  altPhone: string;
  email: string;
  office: string;
  externalId: string;
  submittedOn: string;
  isStaff: boolean;
  addr1: string;
  addr2: string;
  city: string;
  postal: string;
  spouseFirst: string;
  spouseLast: string;
  dependents: string;
  qualification: string;
  docType: string;
  docNumber: string;
  docDescription: string;
  coopEnrol: boolean;
  commonBond: string;
  shareClass: string;
  initialShares: string;
};

const today = new Date().toISOString().slice(0, 10);

const INITIAL: FormState = {
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobile: "",
  altPhone: "",
  email: "",
  office: "",
  externalId: "",
  submittedOn: today,
  isStaff: false,
  addr1: "",
  addr2: "",
  city: "",
  postal: "",
  spouseFirst: "",
  spouseLast: "",
  dependents: "",
  qualification: "",
  docType: "",
  docNumber: "",
  docDescription: "",
  coopEnrol: false,
  commonBond: "",
  shareClass: "Class A",
  initialShares: "50",
};

function AddClientPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [completed, setCompleted] = useState<Set<StepId>>(new Set());
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[key as string];
        return n;
      });
    }
  }

  function validateStep(s: StepId): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.firstName.trim()) e.firstName = "First name is required";
      if (!form.lastName.trim()) e.lastName = "Last name is required";
      if (!form.mobile.trim()) e.mobile = "Mobile number is required";
      if (!form.office) e.office = "Office is required";
      if (!form.submittedOn) e.submittedOn = "Submitted date is required";
    }
    if (s === 4 && form.docType && !form.docNumber.trim()) {
      e.docNumber = "ID number is required when a document type is selected";
    }
    if (s === 5 && form.coopEnrol) {
      if (!form.commonBond) e.commonBond = "Select a common bond group";
    }
    return e;
  }

  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setCompleted((c) => new Set(c).add(step));
    setStep((s) => (s + 1) as StepId);
    setErrors({});
  }

  function goBack() {
    if (step === 1) return;
    setStep((s) => (s - 1) as StepId);
    setErrors({});
  }

  function jumpTo(target: StepId) {
    if (target === step) return;
    if (target < step || completed.has(target)) {
      setStep(target);
      setErrors({});
    }
  }

  async function submit() {
    const e = validateStep(5);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const n = nextClientNumber();
      const id = `clt-${n}`;
      const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
      const activation = new Date(form.submittedOn).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const client: Client = {
        id,
        name: fullName,
        clientNumber: `CLT-${n}`,
        externalId: form.externalId || `EXT-${n}`,
        status: "Pending",
        officeName: form.office,
        activationDate: activation,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        mobile: form.mobile,
        email: form.email,
        isStaff: form.isStaff,
      };
      addClient(client);
      if (form.coopEnrol) {
        addCoopMember({
          id: `coop-${n}`,
          clientId: id,
          commonBondGroup: form.commonBond,
          shareClass: form.shareClass,
          initialShares: Number(form.initialShares) || 0,
          status: "Pending",
        });
      }
      navigate({ to: "/clients" });
    } catch {
      setSubmitError("Something went wrong while creating the client.");
      setSubmitting(false);
    }
  }

  const StepIcon = STEPS[step - 1].icon;
  const stepLabel = STEPS[step - 1].label;

  return (
    <div style={{ background: "#F4F6FB", minHeight: "100%" }} className="p-7">
      {/* Header */}
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 cursor-pointer"
        style={{ fontSize: 13, color: "#475467", fontWeight: 500 }}
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>
      <h1
        className="mt-3"
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#101828",
          letterSpacing: "-0.01em",
        }}
      >
        Add New Client
      </h1>
      <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
        Complete the form to register a new client.
      </p>

      {/* Two-column layout */}
      <div className="mt-6 grid items-start" style={{ gridTemplateColumns: "220px 1fr", gap: 24 }}>
        {/* Step sidebar */}
        <div
          className="bg-white"
          style={{
            borderRadius: 16,
            border: "1px solid #F3F4F6",
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#9CA3AF",
              fontWeight: 600,
              marginBottom: 10,
              padding: "0 4px",
            }}
          >
            Steps
          </div>
          <div className="flex flex-col gap-1">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCurrent = s.id === step;
              const isDone = completed.has(s.id);
              const isUpcoming = !isCurrent && !isDone;
              const clickable = !isUpcoming;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => jumpTo(s.id)}
                  disabled={!clickable}
                  className="flex items-center gap-2.5 text-left transition-colors"
                  style={{
                    background: isCurrent ? NAVY : "transparent",
                    color: isCurrent ? "white" : isDone ? "#374151" : "#9CA3AF",
                    borderRadius: 10,
                    padding: "10px 10px",
                    fontSize: 13,
                    fontWeight: isCurrent ? 600 : 500,
                    cursor: clickable ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (isDone && !isCurrent) e.currentTarget.style.background = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    if (isDone && !isCurrent) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      background: isCurrent
                        ? "rgba(255,255,255,0.2)"
                        : isDone
                          ? "#D1FAE5"
                          : "#F3F4F6",
                      color: isCurrent ? "white" : isDone ? "#059669" : "#9CA3AF",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? <Check size={13} /> : s.id}
                  </span>
                  <span className="flex-1">{s.label}</span>
                  <Icon
                    size={14}
                    color={isCurrent ? "rgba(255,255,255,0.7)" : isDone ? "#059669" : "#D1D5DB"}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-white"
          style={{
            borderRadius: 16,
            border: "1px solid #F3F4F6",
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-3" style={{ padding: 28, paddingBottom: 0 }}>
            <div
              className="inline-flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(0,38,99,0.1)",
                color: NAVY,
              }}
            >
              <StepIcon size={18} color={NAVY} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#101828" }}>{stepLabel}</div>
              <div style={{ fontSize: 12, color: "#667085" }}>Step {step} of 5</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: 28, paddingTop: 20 }}>
            {step === 1 && <StepPersonal form={form} set={set} errors={errors} />}
            {step === 2 && <StepAddress form={form} set={set} />}
            {step === 3 && <StepFamily form={form} set={set} />}
            {step === 4 && <StepIdentity form={form} set={set} errors={errors} />}
            {step === 5 && <StepCoop form={form} set={set} errors={errors} />}

            {submitError && (
              <div
                className="mt-5"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: 13,
                  padding: "10px 14px",
                  borderRadius: 10,
                }}
              >
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "16px 28px",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            {step === 1 ? (
              <button
                type="button"
                onClick={() => navigate({ to: "/clients" })}
                className="cursor-pointer"
                style={{
                  border: "1px solid #E5E7EB",
                  background: "white",
                  color: "#374151",
                  padding: "9px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={goBack}
                className="cursor-pointer"
                style={{
                  border: "1px solid #E5E7EB",
                  background: "white",
                  color: "#374151",
                  padding: "9px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="cursor-pointer inline-flex items-center gap-1.5"
                style={{
                  background: NAVY,
                  color: "white",
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="cursor-pointer"
                style={{
                  background: "#047857",
                  color: "white",
                  padding: "9px 18px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  opacity: submitting ? 0.75 : 1,
                }}
              >
                {submitting ? "Saving…" : "Create Client"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- field primitives ---------- */

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#475467",
        }}
      >
        {label}
        {required && <span style={{ color: "#DC2626" }}> *</span>}
      </label>
      {children}
      {hint && !error && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: "#DC2626" }}>{error}</span>}
    </div>
  );
}

function inputStyle(error?: boolean): React.CSSProperties {
  return {
    background: error ? "#FEF2F2" : "#F9FAFB",
    border: `1px solid ${error ? "#FCA5A5" : "#E5E7EB"}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    color: "#101828",
    outline: "none",
    width: "100%",
    fontFamily: "DM Sans, sans-serif",
  };
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    error?: boolean;
  },
) {
  const { error, ...rest } = props;
  return (
    <input
      {...rest}
      style={{ ...inputStyle(error), ...(rest.style || {}) }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? "#DC2626" : "#3B82F6";
        e.currentTarget.style.boxShadow = "none";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? "#FCA5A5" : "#E5E7EB";
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle(error), cursor: "pointer" }}
    >
      <option value="">{placeholder || "Select…"}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/* ---------- step bodies ---------- */

type StepProps = {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors?: Record<string, string>;
};

function HintLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#9CA3AF",
        marginBottom: 4,
      }}
    >
      {children}
    </p>
  );
}

function StepPersonal({ form, set, errors = {} }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="First Name" required error={errors.firstName}>
          <TextInput
            placeholder="e.g. Kofi"
            value={form.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            error={!!errors.firstName}
          />
        </Field>
        <Field label="Middle Name">
          <TextInput
            placeholder="Optional"
            value={form.middleName}
            onChange={(e) => set("middleName", e.target.value)}
          />
        </Field>
        <Field label="Last Name" required error={errors.lastName}>
          <TextInput
            placeholder="e.g. Mensah"
            value={form.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            error={!!errors.lastName}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Birth">
          <TextInput type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select
            value={form.gender}
            onChange={(v) => set("gender", v)}
            options={["Male", "Female", "Other", "Prefer not to say"]}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile Number" required error={errors.mobile}>
          <TextInput
            placeholder="+233 24 000 0000"
            value={form.mobile}
            onChange={(e) => set("mobile", e.target.value)}
            error={!!errors.mobile}
          />
        </Field>
        <Field label="Alternate Phone">
          <TextInput
            placeholder="Optional"
            value={form.altPhone}
            onChange={(e) => set("altPhone", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Email Address">
        <TextInput
          type="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Office / Branch" required error={errors.office}>
          <Select
            value={form.office}
            onChange={(v) => set("office", v)}
            options={["Headoffice", "Kumasi Branch", "Tema Branch", "Takoradi Branch"]}
            error={!!errors.office}
          />
        </Field>
        <Field label="External ID">
          <TextInput
            placeholder="Optional"
            value={form.externalId}
            onChange={(e) => set("externalId", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Submitted On Date" required error={errors.submittedOn}>
        <TextInput
          type="date"
          value={form.submittedOn}
          onChange={(e) => set("submittedOn", e.target.value)}
          error={!!errors.submittedOn}
        />
      </Field>
      <label
        className="inline-flex items-center gap-2 cursor-pointer"
        style={{ fontSize: 13, color: "#374151" }}
      >
        <input
          type="checkbox"
          checked={form.isStaff}
          onChange={(e) => set("isStaff", e.target.checked)}
          className="cursor-pointer"
          style={{ width: 16, height: 16, accentColor: NAVY }}
        />
        This client is a staff member
      </label>
    </div>
  );
}

function StepAddress({ form, set }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <HintLine>All address fields are optional.</HintLine>
      <Field label="Address Line 1">
        <TextInput value={form.addr1} onChange={(e) => set("addr1", e.target.value)} />
      </Field>
      <Field label="Address Line 2">
        <TextInput value={form.addr2} onChange={(e) => set("addr2", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City / Town">
          <TextInput
            placeholder="e.g. Accra"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
          />
        </Field>
        <Field label="Postal / Digital Address">
          <TextInput
            placeholder="e.g. GA-123-4567"
            value={form.postal}
            onChange={(e) => set("postal", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}

function StepFamily({ form, set }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <HintLine>All family details are optional.</HintLine>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Spouse First Name">
          <TextInput
            value={form.spouseFirst}
            onChange={(e) => set("spouseFirst", e.target.value)}
          />
        </Field>
        <Field label="Spouse Last Name">
          <TextInput value={form.spouseLast} onChange={(e) => set("spouseLast", e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Number of Dependents">
          <TextInput
            type="number"
            min={0}
            value={form.dependents}
            onChange={(e) => set("dependents", e.target.value)}
          />
        </Field>
        <Field label="Qualification Level">
          <Select
            value={form.qualification}
            onChange={(v) => set("qualification", v)}
            options={["None", "Primary", "JHS", "SHS", "Diploma", "Degree", "Postgraduate"]}
          />
        </Field>
      </div>
    </div>
  );
}

function StepIdentity({ form, set, errors = {} }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <HintLine>If a document type is selected, an ID number is required.</HintLine>
      <Field label="Document Type">
        <Select
          value={form.docType}
          onChange={(v) => set("docType", v)}
          options={[
            "Ghana Card",
            "Passport",
            "Voter ID",
            "Driver's Licence",
            "SSNIT Card",
            "Birth Certificate",
          ]}
        />
      </Field>
      <Field label="ID Number" error={errors.docNumber}>
        <TextInput
          placeholder="e.g. GHA-123456789-0"
          value={form.docNumber}
          onChange={(e) => set("docNumber", e.target.value)}
          error={!!errors.docNumber}
        />
      </Field>
      <Field label="Description">
        <TextInput
          value={form.docDescription}
          onChange={(e) => set("docDescription", e.target.value)}
        />
      </Field>
    </div>
  );
}

function StepCoop({ form, set, errors = {} }: StepProps) {
  return (
    <div className="flex flex-col gap-4">
      <HintLine>
        Enrol this client into the cooperative member register. Members are admitted with a Pending
        status (amber) until the common-bond requirement is confirmed.
      </HintLine>
      <label
        className="flex items-center gap-3 cursor-pointer"
        style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "12px 14px",
        }}
      >
        <input
          type="checkbox"
          checked={form.coopEnrol}
          onChange={(e) => set("coopEnrol", e.target.checked)}
          className="cursor-pointer"
          style={{ width: 16, height: 16, accentColor: NAVY }}
        />
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
          Register this client as a cooperative member
        </span>
      </label>

      {form.coopEnrol && (
        <div className="flex flex-col gap-4">
          <Field label="Common Bond Group" required error={errors.commonBond}>
            <Select
              value={form.commonBond}
              onChange={(v) => set("commonBond", v)}
              options={[
                "Staff – Accra",
                "Staff – Kumasi",
                "Staff – Takoradi",
                "Management",
                "Community",
              ]}
              error={!!errors.commonBond}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Share Class">
              <Select
                value={form.shareClass}
                onChange={(v) => set("shareClass", v)}
                options={["Class A", "Class B", "Class C"]}
              />
            </Field>
            <Field label="Initial Shares Held">
              <TextInput
                type="number"
                min={0}
                value={form.initialShares}
                onChange={(e) => set("initialShares", e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
