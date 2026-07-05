import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  User,
  MapPin,
  Users,
  ShieldCheck,
  Handshake,
  Check,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { FONTS } from "@/lib/tokens";
import { Modal, MField, MInput, MSelect } from "@/components/common/Modal";
import { Button } from "@/components/patterns";
import { clientsApi, getClients, setClients } from "@/api/clients";
import {
  referencesApi,
  savingsProductsApi,
  shareProductsApi,
  shareAccountsApi,
  type ClientAccountsSummaryDto,
  type ClientAddressDto,
  type ClientAddressWriteDto,
  type ClientFamilyMemberDto,
  type ClientFamilyMemberWriteDto,
  type ClientIdentifierDto,
  type ClientIdentifierWriteDto,
  type ProductDto,
  type ReferenceValueDto,
} from "@/api/backend";

export const Route = createFileRoute("/_auth/clients/add")({
  component: AddClientPage,
  validateSearch: (search: Record<string, unknown>): { clientId?: string } => ({
    clientId: typeof search.clientId === "string" ? search.clientId : undefined,
  }),
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

const today = new Date().toISOString().slice(0, 10);

/* ---------- Personal Info form ---------- */

type PersonalForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  genderCode: string;
  mobile: string;
  email: string;
  officeCode: string;
  externalId: string;
  submittedOn: string;
  isStaff: boolean;
};

const EMPTY_PERSONAL: PersonalForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  genderCode: "",
  mobile: "",
  email: "",
  officeCode: "",
  externalId: "",
  submittedOn: today,
  isStaff: false,
};

/* ---------- Pending list item shapes ---------- */
// Each carries a client-side localId (React key + list identity) plus the
// server id once persisted. New items (id == null) POST on submit; existing
// items with dirty=true PUT; unmodified existing items are skipped.

let localIdSeq = 0;
function nextLocalId(): string {
  localIdSeq += 1;
  return `local-${localIdSeq}`;
}

type AddressItem = {
  localId: string;
  addressId?: number;
  dirty: boolean;
  addressTypeCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvinceCode: string;
  countryCode: string;
  postalCode: string;
  active: boolean;
};

type FamilyItem = {
  localId: string;
  id?: number;
  dirty: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  qualification: string;
  age: string;
  dependent: boolean;
  relationshipCode: string;
  genderCode: string;
  professionCode: string;
  maritalStatusCode: string;
  dateOfBirth: string;
};

type IdentityItem = {
  localId: string;
  id?: number;
  dirty: boolean;
  documentTypeCode: string;
  documentKey: string;
  description: string;
  status: string;
};

/* ---------- field primitives (unchanged styling) ---------- */

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
      <label style={{ fontSize: 12, fontWeight: 300, color: "#475467" }}>
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
    fontFamily: FONTS.body,
  };
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, ...rest } = props;
  return (
    <input
      {...rest}
      style={{ ...inputStyle(error), ...(rest.style || {}) }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = error ? "#DC2626" : "#3B82F6";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error ? "#FCA5A5" : "#E5E7EB";
      }}
    />
  );
}

type SelectOption = string | { value: string; label: string };

function Select({
  value,
  onChange,
  options,
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
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
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        return (
          <option key={v} value={v}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

function HintLine({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>{children}</p>;
}

/* ---------- pending item list + row ---------- */

function ItemList({ empty, children }: { empty: string; children: React.ReactNode[] }) {
  if (children.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "#9CA3AF",
          fontSize: 13,
          border: "1px dashed #E5E7EB",
          borderRadius: 10,
        }}
      >
        {empty}
      </div>
    );
  }
  return <div className="flex flex-col gap-2">{children}</div>;
}

function ItemRow({
  title,
  subtitle,
  onEdit,
  onRemove,
}: {
  title: string;
  subtitle: string;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "10px 14px",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        background: "#F9FAFB",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#101828" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button style={{ color: "#667085" }} aria-label="Edit" onClick={onEdit}>
          <Pencil size={14} />
        </button>
        <button style={{ color: "#DC2626" }} aria-label="Remove" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

function AddClientPage() {
  const navigate = useNavigate();
  const { clientId: editClientId } = Route.useSearch();
  const isEditMode = !!editClientId;

  const [step, setStep] = useState<StepId>(1);
  const [completed, setCompleted] = useState<Set<StepId>>(new Set());
  const [clientId, setClientId] = useState<string | null>(editClientId ?? null);

  const [personal, setPersonal] = useState<PersonalForm>(EMPTY_PERSONAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmCreateOpen, setConfirmCreateOpen] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEditMode);

  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [family, setFamily] = useState<FamilyItem[]>([]);
  const [identities, setIdentities] = useState<IdentityItem[]>([]);

  const [accountsSummary, setAccountsSummary] = useState<ClientAccountsSummaryDto | null>(null);
  const [shareProducts, setShareProducts] = useState<ProductDto[]>([]);
  const [shareForm, setShareForm] = useState({ productCode: "", requestedShares: "" });
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSubmitting, setShareSubmitting] = useState(false);

  // Reference lookups (loaded once, shared across steps).
  const [officeOptions, setOfficeOptions] = useState<ReferenceValueDto[]>([]);
  const [genderOptions, setGenderOptions] = useState<ReferenceValueDto[]>([]);
  const [addressTypeOptions, setAddressTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [stateOptions, setStateOptions] = useState<ReferenceValueDto[]>([]);
  const [countryOptions, setCountryOptions] = useState<ReferenceValueDto[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<ReferenceValueDto[]>([]);
  const [professionOptions, setProfessionOptions] = useState<ReferenceValueDto[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<ReferenceValueDto[]>([]);
  const [identifierTypeOptions, setIdentifierTypeOptions] = useState<ReferenceValueDto[]>([]);

  useEffect(() => {
    void referencesApi.list("OFFICE").then(setOfficeOptions);
    void referencesApi.list("GENDER").then(setGenderOptions);
    void referencesApi.list("ADDRESS_TYPE").then(setAddressTypeOptions);
    void referencesApi.list("STATE").then(setStateOptions);
    void referencesApi.list("COUNTRY").then(setCountryOptions);
    void referencesApi.list("RELATIONSHIP").then(setRelationshipOptions);
    void referencesApi.list("PROFESSION").then(setProfessionOptions);
    void referencesApi.list("MARITAL_STATUS").then(setMaritalStatusOptions);
    void referencesApi.list("CUSTOMER_IDENTIFIER").then(setIdentifierTypeOptions);
    void shareProductsApi.list().then(setShareProducts);
  }, []);

  // Edit mode: load the existing client + sub-resources and prefill everything.
  useEffect(() => {
    if (!editClientId) return;
    let alive = true;
    void (async () => {
      const [client, addr, fam, ids, summary] = await Promise.all([
        clientsApi.get(editClientId),
        clientsApi.addresses(editClientId),
        clientsApi.familyMembers(editClientId),
        clientsApi.identifiers(editClientId),
        clientsApi.accountsSummary(editClientId),
      ]);
      if (!alive) return;
      if (client) {
        setPersonal({
          firstName: client.firstName ?? "",
          middleName: client.middleName ?? "",
          lastName: client.lastName ?? "",
          dob: client.dateOfBirth ?? "",
          genderCode: client.genderCode ?? "",
          mobile: client.mobile ?? "",
          email: client.email ?? "",
          officeCode: client.officeCode ?? "",
          externalId: client.externalId ?? "",
          submittedOn: client.submittedOnDate ?? today,
          isStaff: client.isStaff ?? false,
        });
      }
      setAddresses(
        addr.map((a: ClientAddressDto) => ({
          localId: nextLocalId(),
          addressId: a.addressId,
          dirty: false,
          addressTypeCode:
            addressTypeOptions.find((o) => o.providerId === a.addressTypeId)?.code ?? "",
          addressLine1: a.addressLine1 ?? "",
          addressLine2: a.addressLine2 ?? "",
          city: a.city ?? "",
          stateProvinceCode: "",
          countryCode: "",
          postalCode: a.postalCode ?? "",
          active: a.active ?? true,
        })),
      );
      setFamily(
        fam.map((m: ClientFamilyMemberDto) => ({
          localId: nextLocalId(),
          id: m.id,
          dirty: false,
          firstName: m.firstName ?? "",
          middleName: m.middleName ?? "",
          lastName: m.lastName ?? "",
          qualification: m.qualification ?? "",
          age: m.age ? String(m.age) : "",
          dependent: m.dependent ?? false,
          relationshipCode:
            relationshipOptions.find((o) => o.providerId === m.relationshipId)?.code ?? "",
          genderCode: genderOptions.find((o) => o.providerId === m.genderId)?.code ?? "",
          professionCode:
            professionOptions.find((o) => o.providerId === m.professionId)?.code ?? "",
          maritalStatusCode:
            maritalStatusOptions.find((o) => o.providerId === m.maritalStatusId)?.code ?? "",
          dateOfBirth: m.dateOfBirth ?? "",
        })),
      );
      setIdentities(
        ids.map((i: ClientIdentifierDto) => ({
          localId: nextLocalId(),
          id: i.id,
          dirty: false,
          documentTypeCode:
            identifierTypeOptions.find((o) => o.providerId === i.documentTypeId)?.code ?? "",
          documentKey: i.documentKey ?? "",
          description: i.description ?? "",
          status: (i.status ?? "").split(".").pop() || "active",
        })),
      );
      setAccountsSummary(summary);
      setCompleted(new Set([1, 2, 3, 4, 5]));
      setLoadingExisting(false);
    })();
    return () => {
      alive = false;
    };
    // Reference option lists are fetched once above and are stable by the time
    // this runs in practice; re-running this effect on every options update
    // would refetch the client unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editClientId]);

  function setP<K extends keyof PersonalForm>(key: K, value: PersonalForm[K]) {
    setPersonal((f) => ({ ...f, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[key as string];
        return n;
      });
    }
  }

  function validatePersonal(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!personal.firstName.trim()) e.firstName = "First name is required";
    if (!personal.lastName.trim()) e.lastName = "Last name is required";
    if (!personal.mobile.trim()) e.mobile = "Mobile number is required";
    if (!personal.officeCode) e.officeCode = "Office is required";
    if (!personal.submittedOn) e.submittedOn = "Submitted date is required";
    return e;
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

  async function createOrUpdatePersonal() {
    const e = validatePersonal();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditMode && clientId) {
        await clientsApi.update(clientId, {
          officeCode: personal.officeCode,
          firstName: personal.firstName,
          middleName: personal.middleName || undefined,
          lastName: personal.lastName,
          mobileNumber: personal.mobile,
          email: personal.email || undefined,
          dateOfBirth: personal.dob || undefined,
          genderCode: personal.genderCode || undefined,
          externalId: personal.externalId || undefined,
          staff: personal.isStaff,
        });
      } else {
        const created = await clientsApi.create({
          officeCode: personal.officeCode,
          legalFormCode: "PERSON",
          firstName: personal.firstName,
          middleName: personal.middleName || null,
          lastName: personal.lastName,
          mobileNumber: personal.mobile || null,
          email: personal.email || null,
          dateOfBirth: personal.dob || null,
          genderCode: personal.genderCode || null,
          savingsProductCode: null,
          externalId: personal.externalId || null,
          submittedOnDate: personal.submittedOn,
          activationDate: personal.submittedOn,
          activeOnCreation: false,
          staff: personal.isStaff,
        });
        setClientId(created.id);
        setClients([created, ...getClients().filter((c) => c.id !== created.id)]);
      }
      setCompleted((c) => new Set(c).add(1));
      setStep(2);
    } catch {
      setSubmitError(
        isEditMode
          ? "Something went wrong while saving this client."
          : "Something went wrong while creating the client.",
      );
    } finally {
      setSubmitting(false);
      setConfirmCreateOpen(false);
    }
  }

  function onPersonalNext() {
    const e = validatePersonal();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    if (isEditMode) {
      void createOrUpdatePersonal();
    } else {
      setConfirmCreateOpen(true);
    }
  }

  /* ---------- address item modal ---------- */

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressItem | null>(null);

  function openAddAddress() {
    setAddressDraft({
      localId: nextLocalId(),
      dirty: true,
      addressTypeCode: addressTypeOptions[0]?.code ?? "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateProvinceCode: "",
      countryCode: countryOptions[0]?.code ?? "",
      postalCode: "",
      active: true,
    });
    setAddressModalOpen(true);
  }

  function saveAddressDraft() {
    if (!addressDraft || !addressDraft.addressTypeCode) return;
    setAddresses((list) => {
      const exists = list.some((a) => a.localId === addressDraft.localId);
      if (exists) return list.map((a) => (a.localId === addressDraft.localId ? addressDraft : a));
      return [...list, addressDraft];
    });
    setAddressModalOpen(false);
    setAddressDraft(null);
  }

  async function removeAddressItem(item: AddressItem) {
    if (!window.confirm("Remove this address?")) return;
    if (item.addressId != null && clientId) {
      await clientsApi.deleteAddress(clientId, item.addressId, item.addressTypeCode);
    }
    setAddresses((list) => list.filter((a) => a.localId !== item.localId));
  }

  async function submitAddresses() {
    if (!clientId) return;
    const pending = addresses.filter((a) => a.dirty);
    if (pending.length) {
      const results = await Promise.allSettled(
        pending.map((a) => {
          const body: ClientAddressWriteDto = {
            addressTypeCode: a.addressTypeCode,
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2 || null,
            city: a.city,
            stateProvinceCode: a.stateProvinceCode || null,
            countryCode: a.countryCode || null,
            postalCode: a.postalCode || null,
            active: a.active,
          };
          return a.addressId != null
            ? clientsApi.updateAddress(clientId, a.addressId, body)
            : clientsApi.addAddress(clientId, body);
        }),
      );
      if (results.some((r) => r.status === "rejected")) {
        setSubmitError("Some addresses could not be saved. Please try again.");
        return;
      }
      setAddresses((list) => list.map((a) => ({ ...a, dirty: false })));
    }
    setSubmitError(null);
    setCompleted((c) => new Set(c).add(2));
    setStep(3);
  }

  /* ---------- family item modal ---------- */

  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyDraft, setFamilyDraft] = useState<FamilyItem | null>(null);

  function openAddFamily() {
    setFamilyDraft({
      localId: nextLocalId(),
      dirty: true,
      firstName: "",
      middleName: "",
      lastName: "",
      qualification: "",
      age: "",
      dependent: false,
      relationshipCode: relationshipOptions[0]?.code ?? "",
      genderCode: genderOptions[0]?.code ?? "",
      professionCode: professionOptions[0]?.code ?? "",
      maritalStatusCode: maritalStatusOptions[0]?.code ?? "",
      dateOfBirth: "",
    });
    setFamilyModalOpen(true);
  }

  function saveFamilyDraft() {
    if (!familyDraft || !familyDraft.firstName.trim() || !familyDraft.lastName.trim()) return;
    setFamily((list) => {
      const exists = list.some((f) => f.localId === familyDraft.localId);
      if (exists) return list.map((f) => (f.localId === familyDraft.localId ? familyDraft : f));
      return [...list, familyDraft];
    });
    setFamilyModalOpen(false);
    setFamilyDraft(null);
  }

  async function removeFamilyItem(item: FamilyItem) {
    if (!window.confirm("Remove this family member?")) return;
    if (item.id != null && clientId) {
      await clientsApi.deleteFamilyMember(clientId, item.id);
    }
    setFamily((list) => list.filter((f) => f.localId !== item.localId));
  }

  async function submitFamily() {
    if (!clientId) return;
    const pending = family.filter((f) => f.dirty);
    if (pending.length) {
      const results = await Promise.allSettled(
        pending.map((f) => {
          const body: ClientFamilyMemberWriteDto = {
            firstName: f.firstName.trim(),
            middleName: f.middleName.trim() || undefined,
            lastName: f.lastName.trim(),
            qualification: f.qualification.trim() || undefined,
            age: f.age ? Number(f.age) : undefined,
            dependent: f.dependent,
            relationshipCode: f.relationshipCode || null,
            genderCode: f.genderCode || null,
            professionCode: f.professionCode || null,
            maritalStatusCode: f.maritalStatusCode || null,
            dateOfBirth: f.dateOfBirth || null,
          };
          return f.id != null
            ? clientsApi.updateFamilyMember(clientId, f.id, body)
            : clientsApi.addFamilyMember(clientId, body);
        }),
      );
      if (results.some((r) => r.status === "rejected")) {
        setSubmitError("Some family members could not be saved. Please try again.");
        return;
      }
      setFamily((list) => list.map((f) => ({ ...f, dirty: false })));
    }
    setSubmitError(null);
    setCompleted((c) => new Set(c).add(3));
    setStep(4);
  }

  /* ---------- identity item modal ---------- */

  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [identityDraft, setIdentityDraft] = useState<IdentityItem | null>(null);

  function openAddIdentity() {
    setIdentityDraft({
      localId: nextLocalId(),
      dirty: true,
      documentTypeCode: identifierTypeOptions[0]?.code ?? "",
      documentKey: "",
      description: "",
      status: "active",
    });
    setIdentityModalOpen(true);
  }

  function saveIdentityDraft() {
    if (!identityDraft || !identityDraft.documentTypeCode) return;
    setIdentities((list) => {
      const exists = list.some((i) => i.localId === identityDraft.localId);
      if (exists) return list.map((i) => (i.localId === identityDraft.localId ? identityDraft : i));
      return [...list, identityDraft];
    });
    setIdentityModalOpen(false);
    setIdentityDraft(null);
  }

  async function removeIdentityItem(item: IdentityItem) {
    if (!window.confirm("Remove this identity?")) return;
    if (item.id != null && clientId) {
      await clientsApi.deleteIdentifier(clientId, item.id);
    }
    setIdentities((list) => list.filter((i) => i.localId !== item.localId));
  }

  async function submitIdentities() {
    if (!clientId) return;
    const pending = identities.filter((i) => i.dirty);
    if (pending.length) {
      const results = await Promise.allSettled(
        pending.map((i) => {
          const body: ClientIdentifierWriteDto = {
            documentTypeCode: i.documentTypeCode,
            status: i.status,
            documentKey: i.documentKey || undefined,
            description: i.description || undefined,
          };
          return i.id != null
            ? clientsApi.updateIdentifier(clientId, i.id, body)
            : clientsApi.addIdentifier(clientId, body);
        }),
      );
      if (results.some((r) => r.status === "rejected")) {
        setSubmitError("Some identities could not be saved. Please try again.");
        return;
      }
      setIdentities((list) => list.map((i) => ({ ...i, dirty: false })));
    }
    setSubmitError(null);
    setCompleted((c) => new Set(c).add(4));
    setStep(5);
  }

  /* ---------- cooperative / shares ---------- */

  async function submitShareRequest() {
    if (!clientId || !shareForm.productCode || !shareForm.requestedShares) return;
    setShareSubmitting(true);
    setShareError(null);
    try {
      await shareAccountsApi.create({
        clientId,
        productCode: shareForm.productCode,
        requestedShares: Number(shareForm.requestedShares),
        submittedOnDate: today,
      });
      setAccountsSummary(await clientsApi.accountsSummary(clientId));
      setShareForm({ productCode: "", requestedShares: "" });
    } catch {
      setShareError(
        "The backend rejected this request — the demo share-accounts endpoint currently has a data-linking issue on some clients.",
      );
    } finally {
      setShareSubmitting(false);
    }
  }

  function finish() {
    setCompleted((c) => new Set(c).add(5));
    if (clientId) {
      navigate({ to: "/clients/$clientId", params: { clientId } });
    } else {
      navigate({ to: "/clients" });
    }
  }

  const StepIcon = STEPS[step - 1].icon;
  const stepLabel = STEPS[step - 1].label;
  const genderSelectOptions = genderOptions.map((o) => ({ value: o.code, label: o.name }));
  const officeSelectOptions = officeOptions.map((o) => ({ value: o.code, label: o.name }));

  return (
    <div style={{ background: "#F4F6FB", minHeight: "100%" }} className="p-7">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 cursor-pointer"
        style={{ fontSize: 13, color: "#475467", fontWeight: 500 }}
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>
      <h1
        className="mt-3"
        style={{ fontSize: 20, fontWeight: 200, color: "#101828", letterSpacing: "-0.01em" }}
      >
        {isEditMode ? "Edit Client" : "Add New Client"}
      </h1>
      <p style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
        {isEditMode
          ? "Update this client's information."
          : "Complete the form to register a new client."}
      </p>

      <div className="mt-6 grid items-start" style={{ gridTemplateColumns: "220px 1fr", gap: 24 }}>
        {/* Step sidebar */}
        <div
          className="bg-white"
          style={{ borderRadius: 16, border: "1px solid #F3F4F6", padding: 16 }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#9CA3AF",
              fontWeight: 300,
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
              const clickable = !isUpcoming && (s.id === 1 || clientId != null);
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
                      fontWeight: 100,
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
        <div className="bg-white" style={{ borderRadius: 16, border: "1px solid #F3F4F6" }}>
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
              <div style={{ fontSize: 14, fontWeight: 100, color: "#101828" }}>{stepLabel}</div>
              <div style={{ fontSize: 12, color: "#667085" }}>Step {step} of 5</div>
            </div>
          </div>

          <div style={{ padding: 28, paddingTop: 20 }}>
            {loadingExisting ? (
              <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                Loading client…
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="First Name" required error={errors.firstName}>
                        <TextInput
                          placeholder="e.g. Kofi"
                          value={personal.firstName}
                          onChange={(e) => setP("firstName", e.target.value)}
                          error={!!errors.firstName}
                        />
                      </Field>
                      <Field label="Middle Name">
                        <TextInput
                          placeholder="Optional"
                          value={personal.middleName}
                          onChange={(e) => setP("middleName", e.target.value)}
                        />
                      </Field>
                      <Field label="Last Name" required error={errors.lastName}>
                        <TextInput
                          placeholder="e.g. Mensah"
                          value={personal.lastName}
                          onChange={(e) => setP("lastName", e.target.value)}
                          error={!!errors.lastName}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Date of Birth">
                        <TextInput
                          type="date"
                          value={personal.dob}
                          onChange={(e) => setP("dob", e.target.value)}
                        />
                      </Field>
                      <Field label="Gender">
                        <Select
                          value={personal.genderCode}
                          onChange={(v) => setP("genderCode", v)}
                          options={genderSelectOptions}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Mobile Number" required error={errors.mobile}>
                        <TextInput
                          placeholder="+233 24 000 0000"
                          value={personal.mobile}
                          onChange={(e) => setP("mobile", e.target.value)}
                          error={!!errors.mobile}
                        />
                      </Field>
                      <Field label="Email Address">
                        <TextInput
                          type="email"
                          placeholder="name@example.com"
                          value={personal.email}
                          onChange={(e) => setP("email", e.target.value)}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Office / Branch" required error={errors.officeCode}>
                        <Select
                          value={personal.officeCode}
                          onChange={(v) => setP("officeCode", v)}
                          options={officeSelectOptions}
                          error={!!errors.officeCode}
                        />
                      </Field>
                      <Field label="External ID">
                        <TextInput
                          placeholder="Optional"
                          value={personal.externalId}
                          onChange={(e) => setP("externalId", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="Submitted On Date" required error={errors.submittedOn}>
                      <TextInput
                        type="date"
                        value={personal.submittedOn}
                        onChange={(e) => setP("submittedOn", e.target.value)}
                        error={!!errors.submittedOn}
                      />
                    </Field>
                    <label
                      className="inline-flex items-center gap-2 cursor-pointer"
                      style={{ fontSize: 13, color: "#374151" }}
                    >
                      <input
                        type="checkbox"
                        checked={personal.isStaff}
                        onChange={(e) => setP("isStaff", e.target.checked)}
                        className="cursor-pointer"
                        style={{ width: 16, height: 16, accentColor: NAVY }}
                      />
                      This client is a staff member
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <HintLine>Add one or more addresses for this client.</HintLine>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={openAddAddress}
                      >
                        Add Address
                      </Button>
                    </div>
                    <ItemList empty="No addresses added yet">
                      {addresses.map((a) => (
                        <ItemRow
                          key={a.localId}
                          title={
                            addressTypeOptions.find((o) => o.code === a.addressTypeCode)?.name ??
                            a.addressTypeCode
                          }
                          subtitle={[a.addressLine1, a.city].filter(Boolean).join(", ") || "—"}
                          onEdit={() => {
                            setAddressDraft(a);
                            setAddressModalOpen(true);
                          }}
                          onRemove={() => void removeAddressItem(a)}
                        />
                      ))}
                    </ItemList>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <HintLine>Add family members for this client (optional).</HintLine>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={openAddFamily}
                      >
                        Add Family Member
                      </Button>
                    </div>
                    <ItemList empty="No family members added yet">
                      {family.map((f) => (
                        <ItemRow
                          key={f.localId}
                          title={[f.firstName, f.lastName].filter(Boolean).join(" ") || "—"}
                          subtitle={
                            relationshipOptions.find((o) => o.code === f.relationshipCode)?.name ??
                            "—"
                          }
                          onEdit={() => {
                            setFamilyDraft(f);
                            setFamilyModalOpen(true);
                          }}
                          onRemove={() => void removeFamilyItem(f)}
                        />
                      ))}
                    </ItemList>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <HintLine>Add identity documents for this client (optional).</HintLine>
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        icon={<Plus size={13} />}
                        onClick={openAddIdentity}
                      >
                        Add Identity
                      </Button>
                    </div>
                    <ItemList empty="No identities added yet">
                      {identities.map((i) => (
                        <ItemRow
                          key={i.localId}
                          title={
                            identifierTypeOptions.find((o) => o.code === i.documentTypeCode)
                              ?.name ?? i.documentTypeCode
                          }
                          subtitle={i.documentKey || "—"}
                          onEdit={() => {
                            setIdentityDraft(i);
                            setIdentityModalOpen(true);
                          }}
                          onRemove={() => void removeIdentityItem(i)}
                        />
                      ))}
                    </ItemList>
                  </div>
                )}

                {step === 5 && (
                  <div className="flex flex-col gap-4">
                    <HintLine>
                      Request cooperative shares for this client. Existing share accounts are shown
                      below.
                    </HintLine>
                    {accountsSummary?.shareAccounts?.length ? (
                      <div className="flex flex-col gap-2">
                        {accountsSummary.shareAccounts.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              padding: "12px 14px",
                              border: "1px solid #E5E7EB",
                              borderRadius: 10,
                              background: "#F9FAFB",
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#101828" }}>
                              {s.productName} · {s.accountNo}
                            </div>
                            <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                              {s.statusValue} · {s.totalApprovedShares ?? 0} approved shares
                              {s.totalPendingForApprovalShares
                                ? `, ${s.totalPendingForApprovalShares} pending`
                                : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: 24,
                          textAlign: "center",
                          color: "#9CA3AF",
                          fontSize: 13,
                          border: "1px dashed #E5E7EB",
                          borderRadius: 10,
                        }}
                      >
                        No share accounts yet
                      </div>
                    )}

                    <div
                      className="grid grid-cols-2 gap-4 items-end"
                      style={{
                        padding: 16,
                        border: "1px solid #E5E7EB",
                        borderRadius: 10,
                      }}
                    >
                      <Field label="Share Product">
                        <Select
                          value={shareForm.productCode}
                          onChange={(v) => setShareForm((f) => ({ ...f, productCode: v }))}
                          options={shareProducts.map((p) => ({ value: p.code, label: p.name }))}
                        />
                      </Field>
                      <Field label="Requested Shares">
                        <TextInput
                          type="number"
                          min={1}
                          value={shareForm.requestedShares}
                          onChange={(e) =>
                            setShareForm((f) => ({ ...f, requestedShares: e.target.value }))
                          }
                        />
                      </Field>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          disabled={
                            shareSubmitting || !shareForm.productCode || !shareForm.requestedShares
                          }
                          onClick={() => void submitShareRequest()}
                        >
                          {shareSubmitting ? "Requesting…" : "Request Shares"}
                        </Button>
                      </div>
                    </div>
                    {shareError && (
                      <div
                        style={{
                          background: "#FEF2F2",
                          border: "1px solid #FECACA",
                          color: "#B91C1C",
                          fontSize: 13,
                          padding: "10px 14px",
                          borderRadius: 10,
                        }}
                      >
                        {shareError}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

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

          <div
            className="flex items-center justify-between"
            style={{ padding: "16px 28px", borderTop: "1px solid #E5E7EB" }}
          >
            {step === 1 ? (
              <Button type="button" onClick={() => navigate({ to: "/clients" })} variant="outline">
                Cancel
              </Button>
            ) : (
              <Button type="button" onClick={goBack} variant="outline">
                Back
              </Button>
            )}

            {step === 1 && (
              <Button
                type="button"
                onClick={onPersonalNext}
                disabled={submitting}
                variant="primary"
                iconRight={<ChevronRight size={14} />}
              >
                {submitting ? "Saving…" : "Next"}
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={() => void submitAddresses()}
                variant="primary"
                iconRight={<ChevronRight size={14} />}
              >
                Next
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                onClick={() => void submitFamily()}
                variant="primary"
                iconRight={<ChevronRight size={14} />}
              >
                Next
              </Button>
            )}
            {step === 4 && (
              <Button
                type="button"
                onClick={() => void submitIdentities()}
                variant="primary"
                iconRight={<ChevronRight size={14} />}
              >
                Next
              </Button>
            )}
            {step === 5 && (
              <Button type="button" onClick={finish} variant="success">
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm create modal */}
      <Modal
        open={confirmCreateOpen}
        onClose={() => setConfirmCreateOpen(false)}
        title="Create this client?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirmCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              size="sm"
              disabled={submitting}
              onClick={() => void createOrUpdatePersonal()}
            >
              {submitting ? "Creating…" : "Yes, create client"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "#475467" }}>
          You're about to create{" "}
          <strong>
            {personal.firstName} {personal.lastName}
          </strong>{" "}
          as a new client record. This cannot be easily undone — the remaining steps (address,
          family, identity, shares) will attach to this client once created.
        </p>
      </Modal>

      {/* Address item modal */}
      <Modal
        open={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false);
          setAddressDraft(null);
        }}
        title={addressDraft?.addressId != null ? "Edit Address" : "Add Address"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddressModalOpen(false);
                setAddressDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={saveAddressDraft}>
              Save
            </Button>
          </>
        }
      >
        {addressDraft && (
          <>
            <MField label="Address Type">
              <MSelect
                value={addressDraft.addressTypeCode}
                onChange={(e) =>
                  setAddressDraft(
                    (d) => d && { ...d, addressTypeCode: e.target.value, dirty: true },
                  )
                }
                options={addressTypeOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Address Line 1">
              <MInput
                value={addressDraft.addressLine1}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, addressLine1: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="Address Line 2">
              <MInput
                value={addressDraft.addressLine2}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, addressLine2: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="City">
              <MInput
                value={addressDraft.city}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, city: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="State/Province (optional)">
              <MSelect
                value={addressDraft.stateProvinceCode}
                onChange={(e) =>
                  setAddressDraft(
                    (d) => d && { ...d, stateProvinceCode: e.target.value, dirty: true },
                  )
                }
                options={[
                  { value: "", label: "— None —" },
                  ...stateOptions.map((o) => ({ value: o.code, label: o.name })),
                ]}
              />
            </MField>
            <MField label="Country">
              <MSelect
                value={addressDraft.countryCode}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, countryCode: e.target.value, dirty: true })
                }
                options={countryOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Postal Code">
              <MInput
                value={addressDraft.postalCode}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, postalCode: e.target.value, dirty: true })
                }
              />
            </MField>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={addressDraft.active}
                onChange={(e) =>
                  setAddressDraft((d) => d && { ...d, active: e.target.checked, dirty: true })
                }
              />
              Active
            </label>
          </>
        )}
      </Modal>

      {/* Family item modal */}
      <Modal
        open={familyModalOpen}
        onClose={() => {
          setFamilyModalOpen(false);
          setFamilyDraft(null);
        }}
        title={familyDraft?.id != null ? "Edit Family Member" : "Add Family Member"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFamilyModalOpen(false);
                setFamilyDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={saveFamilyDraft}>
              Save
            </Button>
          </>
        }
      >
        {familyDraft && (
          <>
            <MField label="First Name">
              <MInput
                value={familyDraft.firstName}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, firstName: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="Middle Name">
              <MInput
                value={familyDraft.middleName}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, middleName: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="Last Name">
              <MInput
                value={familyDraft.lastName}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, lastName: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="Qualification">
              <MInput
                value={familyDraft.qualification}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, qualification: e.target.value, dirty: true })
                }
                placeholder="e.g. Bachelors"
              />
            </MField>
            <MField label="Relationship">
              <MSelect
                value={familyDraft.relationshipCode}
                onChange={(e) =>
                  setFamilyDraft(
                    (d) => d && { ...d, relationshipCode: e.target.value, dirty: true },
                  )
                }
                options={relationshipOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Gender">
              <MSelect
                value={familyDraft.genderCode}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, genderCode: e.target.value, dirty: true })
                }
                options={genderOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Profession">
              <MSelect
                value={familyDraft.professionCode}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, professionCode: e.target.value, dirty: true })
                }
                options={professionOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Marital Status">
              <MSelect
                value={familyDraft.maritalStatusCode}
                onChange={(e) =>
                  setFamilyDraft(
                    (d) => d && { ...d, maritalStatusCode: e.target.value, dirty: true },
                  )
                }
                options={maritalStatusOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Date of Birth">
              <MInput
                type="date"
                value={familyDraft.dateOfBirth}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, dateOfBirth: e.target.value, dirty: true })
                }
              />
            </MField>
            <MField label="Age">
              <MInput
                type="number"
                value={familyDraft.age}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, age: e.target.value, dirty: true })
                }
              />
            </MField>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={familyDraft.dependent}
                onChange={(e) =>
                  setFamilyDraft((d) => d && { ...d, dependent: e.target.checked, dirty: true })
                }
              />
              Dependent
            </label>
          </>
        )}
      </Modal>

      {/* Identity item modal */}
      <Modal
        open={identityModalOpen}
        onClose={() => {
          setIdentityModalOpen(false);
          setIdentityDraft(null);
        }}
        title={identityDraft?.id != null ? "Edit Identity" : "Add Identity"}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIdentityModalOpen(false);
                setIdentityDraft(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={saveIdentityDraft}>
              Save
            </Button>
          </>
        }
      >
        {identityDraft && (
          <>
            <MField label="Document Type">
              <MSelect
                value={identityDraft.documentTypeCode}
                onChange={(e) =>
                  setIdentityDraft(
                    (d) => d && { ...d, documentTypeCode: e.target.value, dirty: true },
                  )
                }
                options={identifierTypeOptions.map((o) => ({ value: o.code, label: o.name }))}
              />
            </MField>
            <MField label="Document Number">
              <MInput
                value={identityDraft.documentKey}
                onChange={(e) =>
                  setIdentityDraft((d) => d && { ...d, documentKey: e.target.value, dirty: true })
                }
                placeholder="e.g. GHA-0987654321"
              />
            </MField>
            <MField label="Description">
              <MInput
                value={identityDraft.description}
                onChange={(e) =>
                  setIdentityDraft((d) => d && { ...d, description: e.target.value, dirty: true })
                }
                placeholder="e.g. Ghana Card"
              />
            </MField>
            <MField label="Status">
              <MSelect
                value={identityDraft.status}
                onChange={(e) =>
                  setIdentityDraft((d) => d && { ...d, status: e.target.value, dirty: true })
                }
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </MField>
          </>
        )}
      </Modal>
    </div>
  );
}
