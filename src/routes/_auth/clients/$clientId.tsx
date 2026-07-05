import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, MoreVertical, Plus, Download, Pencil, Trash2, Upload } from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import { Modal, MField, MInput, MSelect } from "@/components/common/Modal";
import {
  EmptyRow as PatternEmptyRow,
  Table,
  TableCard,
  Td,
  Th,
  THead,
  Tr,
  Button,
  DateRangeFilter,
} from "@/components/patterns";
import { isDisplayDateInRange } from "@/lib/dateFilters";
import { FONTS, tokens, cardShadow } from "@/lib/tokens";
import { useClients, type Client as BackendClient } from "@/api/clients";
import {
  apiErrorMessage,
  clientsApi,
  referencesApi,
  savingsAccountsApi,
  savingsProductsApi,
  shareProductsApi,
  type ClientAddressDto,
  type ClientAddressWriteDto,
  type ClientFamilyMemberDto,
  type ClientFamilyMemberWriteDto,
  type ClientIdentifierDto,
  type ClientIdentifierWriteDto,
  type ClientNoteDto,
  type ProductDto,
  type ReferenceValueDto,
  type SavingsAccountSummaryDto,
  type TransactionDto,
} from "@/api/backend";

export const Route = createFileRoute("/_auth/clients/$clientId")({
  component: ClientDetail,
});

// ---- Mock client list (matches /clients page seed) ----
const OFFICES = ["Accra Main", "Kumasi", "Takoradi", "Head Office"];
const CLIENT_SEED = [
  ["Kwame Mensah", "Active", 0],
  ["Akosua Owusu", "Active", 1],
  ["Yaw Boateng", "Pending", 2],
  ["Ama Asantewaa", "Active", 3],
  ["Kojo Annan", "Active", 0],
  ["Efua Sutherland", "Pending", 1],
  ["Kwesi Appiah", "Active", 2],
  ["Adwoa Safo", "Active", 3],
  ["Nana Akufo", "Pending", 0],
  ["Abena Pokuaa", "Active", 1],
  ["Kofi Nyantakyi", "Active", 2],
  ["Esi Bondzie", "Pending", 3],
].map(([name, status, off], i) => {
  const n = String(i + 1).padStart(4, "0");
  const d = new Date(2024, (i * 2) % 12, ((i * 5) % 27) + 1);
  return {
    id: `clt-${n}`,
    name: name as string,
    clientNumber: `CLT-${n}`,
    externalId: `EXT-${n}`,
    status: status as "Active" | "Pending",
    officeName: OFFICES[off as number],
    activationDate: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    mobile: `+233 24 ${String(100 + i).padStart(3, "0")} ${String(2000 + i * 7).slice(-4)}`,
    email: `${(name as string).toLowerCase().replace(/\s+/g, ".")}@chelseabank.gh`,
    isStaff: i % 5 === 0,
  };
});

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---- shared UI helpers ----
function SectionCard({
  title,
  accent = tokens.navy,
  actions,
  children,
  layerTag,
}: {
  title: string;
  accent?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  layerTag?: string;
}) {
  return (
    <div
      className="bg-white"
      style={{
        borderRadius: 14,
        border: `1px solid ${tokens.border}`,
        boxShadow: cardShadow,
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          padding: "15px 22px",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              width: 16,
              height: 3,
              borderRadius: 2,
              background: accent,
              display: "inline-block",
            }}
          />
          <h3
            style={{
              fontFamily: FONTS.body,
              fontSize: 11,
              fontWeight: 100,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: tokens.text,
            }}
          >
            {title}
          </h3>
          {layerTag && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 100,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: tokens.teal,
                background: tokens.tealBg,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {layerTag}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div style={{ padding: 22 }}>{children}</div>
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <THead>
      {cols.map((c) => (
        <Th key={c}>{c}</Th>
      ))}
    </THead>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return <PatternEmptyRow colSpan={cols}>{text}</PatternEmptyRow>;
}

type Section =
  | "Details"
  | "Transactions"
  | "Address"
  | "Family Members"
  | "Identities"
  | "Documents"
  | "Notes";

const SECTIONS: Section[] = [
  "Details",
  "Transactions",
  "Address",
  "Family Members",
  "Identities",
  "Documents",
  "Notes",
];

const CLIENT_DETAIL_TX_PAGE_SIZE = 10;

type SavingsAccountRow = {
  acc: string;
  product: string;
  balance: number;
  status: StatusKind;
  activated: string;
};

type TransactionRow = {
  id: string;
  date: string;
  type: "Credit" | "Debit";
  amount: number;
  balance: number;
  ref: string;
  narration: string;
  acc: string;
};

type AddressRow = {
  addressId?: number;
  addressTypeId?: number;
  stateProvinceId?: number;
  countryId?: number;
  type: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  active: boolean;
};

type FamilyRow = {
  id?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  qualification: string;
  relationshipId?: number;
  relationship: string;
  genderId?: number;
  gender: string;
  professionId?: number;
  profession: string;
  maritalStatusId?: number;
  maritalStatus: string;
  dateOfBirth: string;
  mobile: string;
  age: number;
  dependent: boolean;
};

type IdentityRow = {
  id?: number;
  documentTypeId?: number;
  type: string;
  no: string;
  description: string;
  status: StatusKind;
  statusCode: string;
};

type NoteRow = {
  id?: number;
  author: string;
  text: string;
  at: string;
};

type SharePosition = {
  sharesHeld: number;
  parValue: number;
  totalCapital: number;
  productName: string;
  status: StatusKind;
  admissionDate: string;
};

// Everything about a client except transactions, which are date/filter
// dependent and comparatively cheap to refetch — kept out of the cacheable
// bundle below so changing the transactions date filter never has to redo
// the client/addresses/family/identities/notes/share-position fetch.
type LoadedClientCore = {
  client: BackendClient | null;
  savings: SavingsAccountRow[];
  addresses: AddressRow[];
  family: FamilyRow[];
  identities: IdentityRow[];
  notes: NoteRow[];
  savingsProducts: ProductDto[];
  sharePosition: SharePosition | null;
};

// Module-level cache keyed by clientId, shared across every mount of this
// route for the lifetime of the page (cleared on full reload). Revisiting a
// client (e.g. navigating away and back) hydrates instantly from here instead
// of re-issuing the same handful of GET requests. Every write path
// (reloadDetail) refreshes this entry, so it never goes stale after our own
// mutations — it can only go stale if the record changes from elsewhere
// (another tab/user) without us reloading, which is an acceptable tradeoff
// for a same-session cache.
const clientDetailCache = new Map<string, LoadedClientCore>();

const EMPTY_CLIENT: BackendClient = {
  id: "",
  name: "",
  clientNumber: "",
  externalId: "",
  status: "Pending",
  officeName: "",
  activationDate: "—",
};

function statusFrom(value?: string): StatusKind {
  const normalized = (value ?? "").toUpperCase();
  if (normalized.includes("ACTIVE")) return "Active";
  if (normalized.includes("PENDING")) return "Pending";
  if (normalized.includes("CLOSED")) return "Inactive";
  if (normalized.includes("REJECT")) return "Rejected";
  if (normalized.includes("REVERSED")) return "Reversed";
  if (normalized.includes("DRAFT")) return "Draft";
  return "Inactive";
}

/** Fineract identifier status arrives as "clientIdentifierStatusType.active" /
 * "…inactive" — statusFrom's substring match would wrongly read "inactive" as
 * "Active" (it ends with "active"), so take the exact segment after the dot. */
function identifierStatusFrom(value?: string): StatusKind {
  const tail = (value ?? "").split(".").pop() ?? "";
  const normalized = tail.toUpperCase();
  if (normalized === "INACTIVE") return "Inactive";
  if (normalized === "ACTIVE") return "Active";
  return statusFrom(value);
}

function fmtDisplayDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function mapSavingsAccount(account: SavingsAccountSummaryDto): SavingsAccountRow {
  return {
    acc: account.accountNo ?? String(account.id),
    product: account.productName ?? "—",
    balance: account.accountBalance ?? 0,
    status: statusFrom(account.statusValue ?? account.statusCode),
    activated: fmtDisplayDate(account.activatedOnDate ?? account.submittedOnDate),
  };
}

function mapTransaction(tx: TransactionDto, accountRef: string, index: number): TransactionRow {
  const typeSource = tx.type ?? tx.transactionTypeValue ?? tx.transactionTypeCode ?? "Credit";
  const type = /debit|withdrawal/i.test(typeSource) ? "Debit" : "Credit";
  const reference = typeof tx.id === "string" ? tx.id : String(tx.id);
  return {
    id: `${accountRef}-${reference}-${index}`,
    date: fmtDisplayDate(tx.date ?? tx.transactionDate),
    type,
    amount: tx.amount ?? 0,
    balance: tx.runningBalance ?? 0,
    ref: reference,
    narration: tx.note ?? tx.type ?? "—",
    acc: accountRef,
  };
}

function mapAddress(address: ClientAddressDto): AddressRow {
  return {
    addressId: address.addressId,
    addressTypeId: address.addressTypeId,
    stateProvinceId: address.stateProvinceId,
    countryId: address.countryId,
    type: address.addressType ?? "—",
    line1: address.addressLine1 ?? "",
    line2: address.addressLine2 ?? "",
    city: address.city ?? "",
    region: address.stateName ?? "",
    country: address.countryName ?? "",
    postalCode: address.postalCode ?? "",
    active: address.active ?? false,
  };
}

function mapFamilyMember(member: ClientFamilyMemberDto): FamilyRow {
  const firstName = member.firstName ?? "";
  const middleName = member.middleName ?? "";
  const lastName = member.lastName ?? "";
  return {
    id: member.id,
    firstName,
    middleName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || "—",
    qualification: member.qualification ?? "",
    relationshipId: member.relationshipId,
    relationship: member.relationship ?? "—",
    genderId: member.genderId,
    gender: member.gender ?? "—",
    professionId: member.professionId,
    profession: member.profession ?? "—",
    maritalStatusId: member.maritalStatusId,
    maritalStatus: member.maritalStatus ?? "—",
    dateOfBirth: member.dateOfBirth ?? "",
    mobile: member.mobileNumber ?? "",
    age:
      member.age ??
      (member.dateOfBirth
        ? Math.max(0, new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear())
        : 0),
    dependent: member.dependent ?? false,
  };
}

function mapIdentifier(identifier: ClientIdentifierDto): IdentityRow {
  const statusTail = (identifier.status ?? "").split(".").pop() ?? "";
  return {
    id: identifier.id,
    documentTypeId: identifier.documentTypeId,
    type: identifier.documentTypeName ?? "—",
    no: identifier.documentKey ?? "—",
    description: identifier.description ?? "",
    status: identifierStatusFrom(identifier.status),
    statusCode: statusTail.toLowerCase() || "active",
  };
}

function mapNote(note: ClientNoteDto): NoteRow {
  return {
    id: note.id,
    author: note.createdByUsername ?? note.updatedByUsername ?? "System",
    text: note.note ?? "",
    at: fmtDisplayDate(note.createdOn),
  };
}

async function loadClientDetailCore(clientId: string): Promise<LoadedClientCore> {
  const [client, summary, addresses, familyMembers, identifiers, notes, products] =
    await Promise.all([
      clientsApi.get(clientId),
      clientsApi.accountsSummary(clientId),
      clientsApi.addresses(clientId),
      clientsApi.familyMembers(clientId),
      clientsApi.identifiers(clientId),
      clientsApi.notes(clientId),
      savingsProductsApi.list(),
    ]);

  const savings = (summary.savingsAccounts ?? []).map(mapSavingsAccount);

  const shareAccount = summary.shareAccounts?.[0];
  let sharePosition: SharePosition | null = null;
  if (shareAccount) {
    const shareProduct = shareAccount.productId
      ? await shareProductsApi.get(shareAccount.productId).catch(() => undefined)
      : undefined;
    const parValue = shareProduct?.unitPrice ?? 0;
    const sharesHeld = shareAccount.totalApprovedShares ?? 0;
    sharePosition = {
      sharesHeld,
      parValue,
      totalCapital: sharesHeld * parValue,
      productName: shareAccount.productName ?? shareProduct?.name ?? "Shares",
      status: statusFrom(shareAccount.statusValue ?? shareAccount.statusCode),
      admissionDate: fmtDisplayDate(shareAccount.activatedOnDate ?? shareAccount.submittedOnDate),
    };
  }

  return {
    client: client ?? null,
    savings,
    addresses: addresses.map(mapAddress),
    family: familyMembers.map(mapFamilyMember),
    identities: identifiers.map(mapIdentifier),
    notes: notes.map(mapNote),
    savingsProducts: products,
    sharePosition,
  };
}

/**
 * Fetch transactions for a set of already-loaded savings accounts. Split out
 * from the core bundle above so changing the date filter (or a plain
 * re-render) only re-issues these calls, not the whole client fetch.
 */
async function loadTransactionsFor(
  savings: SavingsAccountRow[],
  txDateFrom: string,
  txDateTo: string,
): Promise<TransactionRow[]> {
  // Use allSettled: a single account whose transactions endpoint 404s (seen
  // live for a just-created account not yet fully synced) must not blank out
  // the whole page — every other account's data, and the account list itself,
  // should still render.
  const results = await Promise.allSettled(
    savings.map(async (account) => {
      const rows = await savingsAccountsApi.transactions(account.acc, {
        fromSubmittedDate: txDateFrom || undefined,
        toSubmittedDate: txDateTo || undefined,
      });
      return rows.map((row, index) => mapTransaction(row, account.acc, index));
    }),
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

function ClientDetail() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const storeClient = useClients().find((c) => c.id === clientId) ?? null;
  const [clientState, setClientState] = useState<BackendClient | null>(storeClient ?? null);
  const client = clientState ?? storeClient ?? EMPTY_CLIENT;

  const [section, setSection] = useState<Section>("Details");
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [closingAccount, setClosingAccount] = useState(false);
  const [closureReasonCode, setClosureReasonCode] = useState("");
  const [closureReasonOptions, setClosureReasonOptions] = useState<ReferenceValueDto[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const [savings, setSavings] = useState<SavingsAccountRow[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("All");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [identities, setIdentities] = useState<IdentityRow[]>([]);
  const [docs, setDocs] = useState([
    { name: "KYC_Form.pdf", type: "Onboarding" },
    { name: "Utility_Bill.pdf", type: "Proof of Address" },
  ]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteDraft, setEditingNoteDraft] = useState("");
  const [savingsProducts, setSavingsProducts] = useState<ProductDto[]>([]);
  const [sharePosition, setSharePosition] = useState<SharePosition | null>(null);
  const [addressTypeOptions, setAddressTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [stateOptions, setStateOptions] = useState<ReferenceValueDto[]>([]);
  const [countryOptions, setCountryOptions] = useState<ReferenceValueDto[]>([]);

  const [createAcctOpen, setCreateAcctOpen] = useState(false);
  const [createAcctForm, setCreateAcctForm] = useState({ productCode: "", externalId: "" });

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<{
    addressId?: number;
    addressTypeCode: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateProvinceCode: string;
    countryCode: string;
    postalCode: string;
    active: boolean;
  }>({
    addressTypeCode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvinceCode: "",
    countryCode: "",
    postalCode: "",
    active: true,
  });

  const [relationshipOptions, setRelationshipOptions] = useState<ReferenceValueDto[]>([]);
  const [genderOptions, setGenderOptions] = useState<ReferenceValueDto[]>([]);
  const [professionOptions, setProfessionOptions] = useState<ReferenceValueDto[]>([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState<ReferenceValueDto[]>([]);

  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyForm, setFamilyForm] = useState<{
    id?: number;
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
  }>({
    firstName: "",
    middleName: "",
    lastName: "",
    qualification: "",
    age: "",
    dependent: false,
    relationshipCode: "",
    genderCode: "",
    professionCode: "",
    maritalStatusCode: "",
    dateOfBirth: "",
  });

  const [identifierTypeOptions, setIdentifierTypeOptions] = useState<ReferenceValueDto[]>([]);

  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [identityForm, setIdentityForm] = useState<{
    id?: number;
    documentTypeCode: string;
    documentKey: string;
    description: string;
    status: string;
  }>({
    documentTypeCode: "",
    documentKey: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setClientState(storeClient ?? null);
  }, [storeClient]);

  useEffect(() => {
    let alive = true;
    void referencesApi.list("ADDRESS_TYPE").then((opts) => {
      if (alive) setAddressTypeOptions(opts);
    });
    void referencesApi.list("STATE").then((opts) => {
      if (alive) setStateOptions(opts);
    });
    void referencesApi.list("COUNTRY").then((opts) => {
      if (alive) setCountryOptions(opts);
    });
    void referencesApi.list("RELATIONSHIP").then((opts) => {
      if (alive) setRelationshipOptions(opts);
    });
    void referencesApi.list("GENDER").then((opts) => {
      if (alive) setGenderOptions(opts);
    });
    void referencesApi.list("PROFESSION").then((opts) => {
      if (alive) setProfessionOptions(opts);
    });
    void referencesApi.list("MARITAL_STATUS").then((opts) => {
      if (alive) setMaritalStatusOptions(opts);
    });
    void referencesApi.list("CUSTOMER_IDENTIFIER").then((opts) => {
      if (alive) setIdentifierTypeOptions(opts);
    });
    void referencesApi.list("CLIENT_CLOSURE_REASON").then((opts) => {
      if (alive) setClosureReasonOptions(opts);
    });
    return () => {
      alive = false;
    };
  }, []);

  function applyCore(core: LoadedClientCore) {
    setClientState(core.client);
    setSavings(core.savings);
    setAddresses(core.addresses);
    setFamily(core.family);
    setIdentities(core.identities);
    setNotes(core.notes);
    setSavingsProducts(core.savingsProducts);
    setSharePosition(core.sharePosition);
  }

  /** Always hits the backend and refreshes the cache — call after any mutation. */
  async function reloadDetail() {
    const core = await loadClientDetailCore(clientId);
    clientDetailCache.set(clientId, core);
    applyCore(core);
    setTransactions(await loadTransactionsFor(core.savings, txDateFrom, txDateTo));
  }

  async function closeAccount() {
    if (!closureReasonCode) return;
    setClosingAccount(true);
    try {
      await clientsApi.close(clientId, closureReasonCode);
      const refreshed = await clientsApi.get(clientId);
      if (refreshed) setClientState(refreshed);
      toast.success("Account closed.");
      setConfirmCloseOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setClosingAccount(false);
    }
  }

  // Tracks which client's core bundle is currently reflected in state, so that
  // a txDateFrom/txDateTo change (same client) only refetches transactions
  // instead of re-running the cache lookup / core fetch below.
  const loadedCoreClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      let core: LoadedClientCore;
      if (loadedCoreClientIdRef.current === clientId) {
        // Same client as last run (only the date filter changed) — the cache
        // is guaranteed to hold this entry since we set it when the ref was
        // last updated below.
        core = clientDetailCache.get(clientId)!;
      } else {
        const cached = clientDetailCache.get(clientId);
        core = cached ?? (await loadClientDetailCore(clientId));
        if (!alive) return;
        clientDetailCache.set(clientId, core);
        applyCore(core);
        loadedCoreClientIdRef.current = clientId;
      }
      const transactions = await loadTransactionsFor(core.savings, txDateFrom, txDateTo);
      if (alive) setTransactions(transactions);
    })();
    return () => {
      alive = false;
    };
  }, [clientId, txDateFrom, txDateTo]);

  useEffect(() => {
    setTxPage(1);
  }, [accountFilter, txDateFrom, txDateTo]);

  function viewAccountTransactions(accountRef: string) {
    setAccountFilter(accountRef);
    setSection("Transactions");
  }

  function openCreateAccount() {
    setCreateAcctForm({ productCode: savingsProducts[0]?.code ?? "", externalId: "" });
    setCreateAcctOpen(true);
  }

  async function submitCreateAccount() {
    if (!createAcctForm.productCode) return;
    await savingsAccountsApi.create({
      clientId,
      productCode: createAcctForm.productCode,
      externalId: createAcctForm.externalId.trim() || null,
      // Hidden from the UI per spec — the backend requires it, so we send today's date.
      submittedOnDate: new Date().toISOString().slice(0, 10),
    });
    setCreateAcctOpen(false);
    await reloadDetail();
  }

  function openAddAddress() {
    setAddressForm({
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

  function openEditAddress(row: AddressRow) {
    const matchedType = addressTypeOptions.find((o) => o.providerId === row.addressTypeId);
    const matchedState = stateOptions.find((o) => o.providerId === row.stateProvinceId);
    const matchedCountry = countryOptions.find((o) => o.providerId === row.countryId);
    setAddressForm({
      addressId: row.addressId,
      addressTypeCode: matchedType?.code ?? addressTypeOptions[0]?.code ?? "",
      addressLine1: row.line1,
      addressLine2: row.line2,
      city: row.city,
      stateProvinceCode: matchedState?.code ?? "",
      countryCode: matchedCountry?.code ?? countryOptions[0]?.code ?? "",
      postalCode: row.postalCode,
      active: row.active,
    });
    setAddressModalOpen(true);
  }

  async function submitAddressForm() {
    if (!addressForm.addressTypeCode) return;
    const body: ClientAddressWriteDto = {
      addressTypeCode: addressForm.addressTypeCode,
      addressLine1: addressForm.addressLine1,
      addressLine2: addressForm.addressLine2 || null,
      city: addressForm.city,
      stateProvinceCode: addressForm.stateProvinceCode || null,
      countryCode: addressForm.countryCode || null,
      postalCode: addressForm.postalCode || null,
      active: addressForm.active,
    };
    if (addressForm.addressId != null) {
      await clientsApi.updateAddress(clientId, addressForm.addressId, body);
    } else {
      await clientsApi.addAddress(clientId, body);
    }
    setAddressModalOpen(false);
    await reloadDetail();
  }

  function openAddFamily() {
    setFamilyForm({
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

  function openEditFamily(row: FamilyRow) {
    const matchedRelationship = relationshipOptions.find(
      (o) => o.providerId === row.relationshipId,
    );
    const matchedGender = genderOptions.find((o) => o.providerId === row.genderId);
    const matchedProfession = professionOptions.find((o) => o.providerId === row.professionId);
    const matchedMaritalStatus = maritalStatusOptions.find(
      (o) => o.providerId === row.maritalStatusId,
    );
    setFamilyForm({
      id: row.id,
      firstName: row.firstName,
      middleName: row.middleName,
      lastName: row.lastName,
      qualification: row.qualification,
      age: row.age ? String(row.age) : "",
      dependent: row.dependent,
      relationshipCode: matchedRelationship?.code ?? relationshipOptions[0]?.code ?? "",
      genderCode: matchedGender?.code ?? genderOptions[0]?.code ?? "",
      professionCode: matchedProfession?.code ?? professionOptions[0]?.code ?? "",
      maritalStatusCode: matchedMaritalStatus?.code ?? maritalStatusOptions[0]?.code ?? "",
      dateOfBirth: row.dateOfBirth,
    });
    setFamilyModalOpen(true);
  }

  async function submitFamilyForm() {
    if (!familyForm.firstName.trim() || !familyForm.lastName.trim()) return;
    const body: ClientFamilyMemberWriteDto = {
      firstName: familyForm.firstName.trim(),
      middleName: familyForm.middleName.trim() || undefined,
      lastName: familyForm.lastName.trim(),
      qualification: familyForm.qualification.trim() || undefined,
      age: familyForm.age ? Number(familyForm.age) : undefined,
      dependent: familyForm.dependent,
      relationshipCode: familyForm.relationshipCode || null,
      genderCode: familyForm.genderCode || null,
      professionCode: familyForm.professionCode || null,
      maritalStatusCode: familyForm.maritalStatusCode || null,
      dateOfBirth: familyForm.dateOfBirth || null,
    };
    if (familyForm.id != null) {
      await clientsApi.updateFamilyMember(clientId, familyForm.id, body);
    } else {
      await clientsApi.addFamilyMember(clientId, body);
    }
    setFamilyModalOpen(false);
    await reloadDetail();
  }

  function openAddIdentity() {
    setIdentityForm({
      documentTypeCode: identifierTypeOptions[0]?.code ?? "",
      documentKey: "",
      description: "",
      status: "active",
    });
    setIdentityModalOpen(true);
  }

  function openEditIdentity(row: IdentityRow) {
    const matchedType = identifierTypeOptions.find((o) => o.providerId === row.documentTypeId);
    setIdentityForm({
      id: row.id,
      documentTypeCode: matchedType?.code ?? identifierTypeOptions[0]?.code ?? "",
      documentKey: row.no === "—" ? "" : row.no,
      description: row.description,
      status: row.statusCode,
    });
    setIdentityModalOpen(true);
  }

  async function submitIdentityForm() {
    if (!identityForm.documentTypeCode) return;
    const body: ClientIdentifierWriteDto = {
      documentTypeCode: identityForm.documentTypeCode,
      status: identityForm.status,
      documentKey: identityForm.documentKey || undefined,
      description: identityForm.description || undefined,
    };
    if (identityForm.id != null) {
      await clientsApi.updateIdentifier(clientId, identityForm.id, body);
    } else {
      await clientsApi.addIdentifier(clientId, body);
    }
    setIdentityModalOpen(false);
    await reloadDetail();
  }

  async function removeAddress(row: AddressRow) {
    if (row.addressId == null) return;
    const matchedType = addressTypeOptions.find((o) => o.providerId === row.addressTypeId);
    if (!matchedType?.code) return;
    if (!window.confirm("Delete this address? This cannot be undone.")) return;
    await clientsApi.deleteAddress(clientId, row.addressId, matchedType.code);
    await reloadDetail();
  }

  async function removeFamilyMember(row: FamilyRow) {
    if (row.id == null) return;
    if (!window.confirm("Remove this family member? This cannot be undone.")) return;
    await clientsApi.deleteFamilyMember(clientId, row.id);
    await reloadDetail();
  }

  async function removeIdentity(row: IdentityRow) {
    if (row.id == null) return;
    if (!window.confirm("Delete this identity? This cannot be undone.")) return;
    await clientsApi.deleteIdentifier(clientId, row.id);
    await reloadDetail();
  }

  function startEditNote(row: NoteRow) {
    if (row.id == null) return;
    setEditingNoteId(row.id);
    setEditingNoteDraft(row.text);
  }

  function cancelEditNote() {
    setEditingNoteId(null);
    setEditingNoteDraft("");
  }

  async function saveEditNote() {
    if (editingNoteId == null || !editingNoteDraft.trim()) return;
    await clientsApi.updateNote(clientId, editingNoteId, { note: editingNoteDraft.trim() });
    setEditingNoteId(null);
    setEditingNoteDraft("");
    await reloadDetail();
  }

  async function removeNote(row: NoteRow) {
    if (row.id == null) return;
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    await clientsApi.deleteNote(clientId, row.id);
    await reloadDetail();
  }

  const txRows = transactions.filter(
    (t) =>
      (accountFilter === "All" || t.acc === accountFilter) &&
      isDisplayDateInRange(t.date, txDateFrom, txDateTo),
  );
  const txTotalPages = Math.max(1, Math.ceil(txRows.length / CLIENT_DETAIL_TX_PAGE_SIZE));
  const txCurrentPage = Math.min(txPage, txTotalPages);
  const txPageRows = txRows.slice(
    (txCurrentPage - 1) * CLIENT_DETAIL_TX_PAGE_SIZE,
    txCurrentPage * CLIENT_DETAIL_TX_PAGE_SIZE,
  );

  return (
    <div ref={rootRef} style={{ background: tokens.bg, minHeight: "100%" }} className="p-7">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 mb-4"
        style={{ fontSize: 13, color: tokens.textSub, fontWeight: 500 }}
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      {/* Header card */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #002663 0%, #002663 55%, #1a4080 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: tokens.gold,
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage: "radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative" style={{ padding: "26px 28px 0" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.1)",
                  border: `2px solid ${tokens.gold}`,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontFamily: FONTS.body,
                  fontWeight: 100,
                  fontSize: 22,
                }}
              >
                {initials(client.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 20,
                      fontWeight: 100,
                      color: "white",
                    }}
                  >
                    {client.name}
                  </h1>
                  {client.isStaff && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 100,
                        letterSpacing: "0.12em",
                        color: tokens.gold,
                        border: `1px solid ${tokens.gold}`,
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      STAFF
                    </span>
                  )}
                </div>
                <div style={{ color: "rgba(186,210,255,0.85)", fontSize: 12, marginTop: 3 }}>
                  {client.officeName}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <StatusPill status={client.status} variant="onDark" />
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  padding: 6,
                  color: "white",
                }}
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <div
                  className="absolute z-10 bg-white"
                  style={{
                    top: 36,
                    right: 0,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 8,

                    minWidth: 180,
                    padding: 4,
                  }}
                >
                  {[
                    {
                      l: "Edit Client",
                      c: tokens.text,
                      onClick: () => navigate({ to: "/clients/add", search: { clientId } }),
                    },
                    {
                      l: "View Transactions",
                      c: tokens.text,
                      onClick: () => setSection("Transactions"),
                    },
                    {
                      l: "Close Account",
                      c: "#D92D20",
                      onClick: () => {
                        setClosureReasonCode("");
                        setConfirmCloseOpen(true);
                      },
                    },
                  ].map((o) => (
                    <button
                      key={o.l}
                      onClick={() => {
                        o.onClick?.();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left hover:bg-slate-50"
                      style={{ padding: "8px 10px", borderRadius: 6, fontSize: 13, color: o.c }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div
            className="mt-6 grid grid-cols-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            {[
              { l: "Client No.", v: client.clientNumber, mono: true },
              { l: "External ID", v: client.externalId, mono: true },
              { l: "Activation Date", v: client.activationDate },
              { l: "Mobile Number", v: client.mobile },
              { l: "Email", v: client.email, link: true },
            ].map((f, i) => (
              <div
                key={f.l}
                style={{
                  padding: "16px 18px",
                  borderRight: i < 4 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div
                  style={{
                    color: "rgba(186,210,255,0.7)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 300,
                  }}
                >
                  {f.l}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    color: f.link ? "#9BC0FF" : "white",
                    fontFamily: f.mono ? FONTS.mono : FONTS.body,
                    cursor: f.link ? "pointer" : "default",
                  }}
                >
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 flex gap-6 items-start">
        {/* Side nav */}
        <div
          className="bg-white"
          style={{
            width: 172,
            flexShrink: 0,
            borderRadius: 14,
            border: `1px solid ${tokens.border}`,
            boxShadow: cardShadow,
            padding: 8,
          }}
        >
          {SECTIONS.map((s) => {
            const active = section === s;
            return (
              <button
                key={s}
                onClick={() => setSection(s)}
                className="block w-full text-left relative transition-colors"
                style={{
                  padding: "10px 12px 10px 14px",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? tokens.navy : tokens.textSub,
                  background: active ? "#EEF3FF" : "transparent",
                  borderRadius: 8,
                  marginBottom: 2,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "#F5F8FE";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: 2,
                      background: tokens.navy,
                    }}
                  />
                )}
                {s}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">
          {section === "Details" && (
            <>
              <SectionCard
                title="Cooperative Membership"
                accent={tokens.teal}
                layerTag="Cooperative"
              >
                <div className="grid grid-cols-3 gap-5">
                  <Field label="Common Bond">
                    <span
                      style={{
                        fontSize: 12,
                        color: tokens.teal,
                        background: tokens.tealBg,
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontWeight: 300,
                      }}
                    >
                      Civil Service
                    </span>
                  </Field>
                  <Field label="Membership Status">
                    <StatusPill status={sharePosition?.status ?? "Pending"} />
                  </Field>
                  <Field label="Admission Date" value={sharePosition?.admissionDate ?? "—"} />
                </div>
                <div
                  style={{
                    marginTop: 18,
                    padding: 12,
                    borderRadius: 10,
                    background: tokens.tealBg,
                    border: `1px solid rgba(15,110,86,0.15)`,
                    fontSize: 12,
                    color: tokens.teal,
                  }}
                >
                  Eligible for cooperative loan products and dividend distributions.
                </div>
                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 10,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontWeight: 100,
                      color: tokens.textMuted,
                      marginBottom: 10,
                    }}
                  >
                    Share Position
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    <Mono
                      label="Shares Held"
                      value={sharePosition ? String(sharePosition.sharesHeld) : "—"}
                    />
                    <Mono
                      label="Share Par Value"
                      value={
                        sharePosition
                          ? `GH₵ ${sharePosition.parValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"
                      }
                    />
                    <Mono
                      label="Total Share Capital"
                      value={
                        sharePosition
                          ? `GH₵ ${sharePosition.totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"
                      }
                    />
                  </div>
                </div>
              </SectionCard>

              <TableCard
                title="Savings Accounts"
                actions={
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={openCreateAccount}
                  >
                    Create Account
                  </Button>
                }
              >
                <Table>
                  <TableHead
                    cols={["Account No.", "Product", "Balance", "Status", "Activated", ""]}
                  />
                  <tbody>
                    {savings.length === 0 ? (
                      <EmptyRow cols={6} text="No savings accounts found" />
                    ) : (
                      savings.map((a) => (
                        <Tr key={a.acc} hover>
                          <Td
                            numeric
                            style={{
                              fontFamily: FONTS.mono,
                            }}
                          >
                            {a.acc}
                          </Td>
                          <Td>{a.product}</Td>
                          <Td
                            numeric
                            style={{
                              fontFamily: FONTS.mono,
                            }}
                          >
                            GH₵ {a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Td>
                          <Td>
                            <StatusPill status={a.status} />
                          </Td>
                          <Td muted>{a.activated}</Td>
                          <Td align="right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewAccountTransactions(a.acc)}
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableCard>
            </>
          )}

          {section === "Transactions" && (
            <TableCard
              title="Transactions"
              filters={
                <DateRangeFilter
                  from={txDateFrom}
                  to={txDateTo}
                  onFromChange={(value) => {
                    setTxDateFrom(value);
                    setTxPage(1);
                  }}
                  onToChange={(value) => {
                    setTxDateTo(value);
                    setTxPage(1);
                  }}
                />
              }
              actions={
                <select
                  value={accountFilter}
                  onChange={(e) => {
                    setAccountFilter(e.target.value);
                    setTxPage(1);
                  }}
                  style={{
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: tokens.text,
                    background: "white",
                  }}
                >
                  <option value="All">All Accounts</option>
                  {savings.map((s) => (
                    <option key={s.acc} value={s.acc}>
                      {s.acc} — {s.product}
                    </option>
                  ))}
                </select>
              }
              pagination={{
                page: txCurrentPage,
                totalPages: txTotalPages,
                totalItems: txRows.length,
                itemLabel: "transactions",
                onPageChange: setTxPage,
              }}
            >
              <Table>
                <TableHead
                  cols={["Date", "Narration", "Debit", "Credit", "Balance", "Reference"]}
                />
                <tbody>
                  {txRows.length === 0 ? (
                    <EmptyRow cols={6} text="No transactions found" />
                  ) : (
                    txPageRows.map((t) => {
                      const isCredit = t.type === "Credit";
                      return (
                        <Tr key={t.ref} hover>
                          <Td muted>{t.date}</Td>
                          <Td>{t.narration}</Td>
                          <Td
                            numeric
                            style={{
                              fontFamily: FONTS.body,
                              fontWeight: 100,
                            }}
                          >
                            {!isCredit
                              ? `GH₵ ${t.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}`
                              : ""}
                          </Td>
                          <Td
                            numeric
                            style={{
                              fontFamily: FONTS.body,
                              fontWeight: 100,
                            }}
                          >
                            {isCredit
                              ? `GH₵ ${t.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}`
                              : ""}
                          </Td>
                          <Td
                            numeric
                            style={{
                              fontFamily: FONTS.body,
                              fontWeight: 500,
                            }}
                          >
                            GH₵ {t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </Td>
                          <Td
                            muted
                            style={{
                              fontFamily: FONTS.mono,
                              fontSize: 12,
                            }}
                          >
                            {t.ref}
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </tbody>
              </Table>
            </TableCard>
          )}

          {section === "Address" && (
            <TableCard
              title="Addresses"
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={openAddAddress}
                >
                  Add Address
                </Button>
              }
            >
              <Table>
                <TableHead cols={["Type", "Line 1", "Line 2", "City", "Region", "Status", ""]} />
                <tbody>
                  {addresses.length === 0 ? (
                    <EmptyRow cols={7} text="No addresses found" />
                  ) : (
                    addresses.map((a, i) => (
                      <Tr key={a.addressId ?? `${a.type}-${a.line1}-${i}`} hover>
                        <Td>{a.type}</Td>
                        <Td>{a.line1}</Td>
                        <Td muted>{a.line2 || "—"}</Td>
                        <Td muted>{a.city || "—"}</Td>
                        <Td muted>{a.region || "—"}</Td>
                        <Td>
                          <StatusPill status={a.active ? "Active" : "Inactive"} />
                        </Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Edit"
                              onClick={() => openEditAddress(a)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Delete"
                              onClick={() => void removeAddress(a)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          )}

          {section === "Family Members" && (
            <TableCard
              title="Family Members"
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={openAddFamily}
                >
                  Add Family Member
                </Button>
              }
            >
              <Table>
                <TableHead
                  cols={[
                    "Name",
                    "Relationship",
                    "Gender",
                    "Age",
                    "Dependent",
                    "Marital Status",
                    "Profession",
                    "",
                  ]}
                />
                <tbody>
                  {family.length === 0 ? (
                    <EmptyRow cols={8} text="No family members found" />
                  ) : (
                    family.map((f, i) => (
                      <Tr key={f.id ?? `${f.name}-${i}`} hover>
                        <Td>{f.name}</Td>
                        <Td muted>{f.relationship}</Td>
                        <Td muted>{f.gender}</Td>
                        <Td muted>{f.age}</Td>
                        <Td muted>{f.dependent ? "Yes" : "No"}</Td>
                        <Td muted>{f.maritalStatus}</Td>
                        <Td muted>{f.profession}</Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Edit"
                              onClick={() => openEditFamily(f)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Delete"
                              onClick={() => void removeFamilyMember(f)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          )}

          {section === "Identities" && (
            <TableCard
              title="Identities"
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={openAddIdentity}
                >
                  Add New Identity
                </Button>
              }
            >
              <Table>
                <TableHead cols={["Type", "Document No.", "Description", "Status", ""]} />
                <tbody>
                  {identities.length === 0 ? (
                    <EmptyRow cols={5} text="No identities found" />
                  ) : (
                    identities.map((i, idx) => (
                      <Tr key={i.id ?? `${i.type}-${i.no}-${idx}`} hover>
                        <Td>{i.type}</Td>
                        <Td
                          style={{
                            fontFamily: FONTS.mono,
                          }}
                        >
                          {i.no}
                        </Td>
                        <Td muted>{i.description || "—"}</Td>
                        <Td>
                          <StatusPill status={i.status} />
                        </Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Edit"
                              onClick={() => openEditIdentity(i)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              style={{ color: tokens.textSub }}
                              aria-label="Delete"
                              onClick={() => void removeIdentity(i)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          )}

          {section === "Documents" && (
            <SectionCard
              title="Documents"
              accent={tokens.navy}
              actions={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Upload size={13} />}
                  onClick={() => setDocs((d) => [...d, { name: "New_Doc.pdf", type: "Other" }])}
                >
                  Upload
                </Button>
              }
            >
              {docs.length === 0 ? (
                <div
                  style={{
                    padding: 36,
                    textAlign: "center",
                    color: tokens.textMuted,
                    fontSize: 13,
                  }}
                >
                  No documents found
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between"
                      style={{
                        padding: "12px 14px",
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: tokens.text, fontWeight: 500 }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
                          {d.type}
                        </div>
                      </div>
                      <button style={{ color: tokens.textSub }} aria-label="Download">
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {section === "Notes" && (
            <SectionCard title="Notes" accent={tokens.accent}>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note about this client…"
                rows={3}
                style={{
                  width: "100%",
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 13,
                  color: tokens.text,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: FONTS.body,
                }}
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => {
                    void (async () => {
                      if (!noteDraft.trim()) return;
                      await clientsApi.addNote(clientId, { note: noteDraft.trim() });
                      setNoteDraft("");
                      await reloadDetail();
                    })();
                  }}
                >
                  Add Note
                </Button>
              </div>
              <div className="mt-5 space-y-3">
                {notes.length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: tokens.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No notes yet
                  </div>
                ) : (
                  notes.map((n, idx) => (
                    <div
                      key={n.id ?? idx}
                      className="flex items-start gap-3"
                      style={{
                        padding: 14,
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 999,
                          background: "#E0E9FF",
                          color: tokens.navy,
                          fontFamily: FONTS.body,
                          fontWeight: 100,
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {initials(n.author)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 12, fontWeight: 300, color: tokens.text }}>
                            {n.author}
                          </span>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 11, color: tokens.textMuted }}>{n.at}</span>
                            {editingNoteId !== n.id && (
                              <>
                                <button
                                  style={{ color: tokens.textSub }}
                                  aria-label="Edit note"
                                  onClick={() => startEditNote(n)}
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  style={{ color: tokens.textSub }}
                                  aria-label="Delete note"
                                  onClick={() => void removeNote(n)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingNoteId === n.id ? (
                          <div className="mt-2">
                            <textarea
                              value={editingNoteDraft}
                              onChange={(e) => setEditingNoteDraft(e.target.value)}
                              rows={2}
                              style={{
                                width: "100%",
                                border: `1px solid ${tokens.border}`,
                                borderRadius: 8,
                                padding: 10,
                                fontSize: 13,
                                color: tokens.text,
                                outline: "none",
                                resize: "vertical",
                                fontFamily: FONTS.body,
                              }}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={cancelEditNote}>
                                Cancel
                              </Button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => void saveEditNote()}
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p style={{ fontSize: 13, color: tokens.textSub, marginTop: 4 }}>
                            {n.text}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <Modal
        open={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        title="Close account?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmCloseOpen(false)}
              disabled={closingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void closeAccount()}
              disabled={closingAccount || !closureReasonCode}
            >
              {closingAccount ? "Closing…" : "Close Account"}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: tokens.textSub }}>
          Are you sure you want to close <strong>{client.name}</strong>'s account? This cannot be
          undone.
        </p>
        <MField label="Closure Reason">
          <MSelect
            value={closureReasonCode}
            onChange={(e) => setClosureReasonCode(e.target.value)}
            options={[
              { value: "", label: "Select a reason…" },
              ...closureReasonOptions.map((o) => ({ value: o.code, label: o.name })),
            ]}
          />
        </MField>
      </Modal>

      <Modal
        open={createAcctOpen}
        onClose={() => setCreateAcctOpen(false)}
        title="Create Savings Account"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateAcctOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={() => void submitCreateAccount()}>
              Create Account
            </Button>
          </>
        }
      >
        <MField label="Savings Product">
          <MSelect
            value={createAcctForm.productCode}
            onChange={(e) => setCreateAcctForm((f) => ({ ...f, productCode: e.target.value }))}
            options={savingsProducts.map((p) => ({ value: p.code, label: p.name }))}
          />
        </MField>
        <MField label="External ID (optional)">
          <MInput
            value={createAcctForm.externalId}
            onChange={(e) => setCreateAcctForm((f) => ({ ...f, externalId: e.target.value }))}
            placeholder="e.g. core-banking reference"
          />
        </MField>
      </Modal>

      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title={addressForm.addressId != null ? "Edit Address" : "Add Address"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={() => void submitAddressForm()}>
              {addressForm.addressId != null ? "Save Changes" : "Add Address"}
            </Button>
          </>
        }
      >
        <MField label="Address Type">
          <MSelect
            value={addressForm.addressTypeCode}
            onChange={(e) => setAddressForm((f) => ({ ...f, addressTypeCode: e.target.value }))}
            options={addressTypeOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Address Line 1">
          <MInput
            value={addressForm.addressLine1}
            onChange={(e) => setAddressForm((f) => ({ ...f, addressLine1: e.target.value }))}
          />
        </MField>
        <MField label="Address Line 2">
          <MInput
            value={addressForm.addressLine2}
            onChange={(e) => setAddressForm((f) => ({ ...f, addressLine2: e.target.value }))}
          />
        </MField>
        <MField label="City">
          <MInput
            value={addressForm.city}
            onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
          />
        </MField>
        <MField label="State/Province (optional)">
          <MSelect
            value={addressForm.stateProvinceCode}
            onChange={(e) => setAddressForm((f) => ({ ...f, stateProvinceCode: e.target.value }))}
            options={[
              { value: "", label: "— None —" },
              ...stateOptions.map((o) => ({ value: o.code, label: o.name })),
            ]}
          />
        </MField>
        <MField label="Country">
          <MSelect
            value={addressForm.countryCode}
            onChange={(e) => setAddressForm((f) => ({ ...f, countryCode: e.target.value }))}
            options={countryOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Postal Code">
          <MInput
            value={addressForm.postalCode}
            onChange={(e) => setAddressForm((f) => ({ ...f, postalCode: e.target.value }))}
          />
        </MField>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={addressForm.active}
            onChange={(e) => setAddressForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Active
        </label>
      </Modal>

      <Modal
        open={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        title={familyForm.id != null ? "Edit Family Member" : "Add Family Member"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFamilyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={() => void submitFamilyForm()}>
              {familyForm.id != null ? "Save Changes" : "Add Family Member"}
            </Button>
          </>
        }
      >
        <MField label="First Name">
          <MInput
            value={familyForm.firstName}
            onChange={(e) => setFamilyForm((f) => ({ ...f, firstName: e.target.value }))}
          />
        </MField>
        <MField label="Middle Name">
          <MInput
            value={familyForm.middleName}
            onChange={(e) => setFamilyForm((f) => ({ ...f, middleName: e.target.value }))}
          />
        </MField>
        <MField label="Last Name">
          <MInput
            value={familyForm.lastName}
            onChange={(e) => setFamilyForm((f) => ({ ...f, lastName: e.target.value }))}
          />
        </MField>
        <MField label="Qualification">
          <MInput
            value={familyForm.qualification}
            onChange={(e) => setFamilyForm((f) => ({ ...f, qualification: e.target.value }))}
            placeholder="e.g. Bachelors"
          />
        </MField>
        <MField label="Relationship">
          <MSelect
            value={familyForm.relationshipCode}
            onChange={(e) => setFamilyForm((f) => ({ ...f, relationshipCode: e.target.value }))}
            options={relationshipOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Gender">
          <MSelect
            value={familyForm.genderCode}
            onChange={(e) => setFamilyForm((f) => ({ ...f, genderCode: e.target.value }))}
            options={genderOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Profession">
          <MSelect
            value={familyForm.professionCode}
            onChange={(e) => setFamilyForm((f) => ({ ...f, professionCode: e.target.value }))}
            options={professionOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Marital Status">
          <MSelect
            value={familyForm.maritalStatusCode}
            onChange={(e) => setFamilyForm((f) => ({ ...f, maritalStatusCode: e.target.value }))}
            options={maritalStatusOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Date of Birth">
          <MInput
            type="date"
            value={familyForm.dateOfBirth}
            onChange={(e) => setFamilyForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          />
        </MField>
        <MField label="Age">
          <MInput
            type="number"
            value={familyForm.age}
            onChange={(e) => setFamilyForm((f) => ({ ...f, age: e.target.value }))}
          />
        </MField>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={familyForm.dependent}
            onChange={(e) => setFamilyForm((f) => ({ ...f, dependent: e.target.checked }))}
          />
          Dependent
        </label>
      </Modal>

      <Modal
        open={identityModalOpen}
        onClose={() => setIdentityModalOpen(false)}
        title={identityForm.id != null ? "Edit Identity" : "Add New Identity"}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIdentityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={() => void submitIdentityForm()}>
              {identityForm.id != null ? "Save Changes" : "Add New Identity"}
            </Button>
          </>
        }
      >
        <MField label="Document Type">
          <MSelect
            value={identityForm.documentTypeCode}
            onChange={(e) => setIdentityForm((f) => ({ ...f, documentTypeCode: e.target.value }))}
            options={identifierTypeOptions.map((o) => ({ value: o.code, label: o.name }))}
          />
        </MField>
        <MField label="Document Number">
          <MInput
            value={identityForm.documentKey}
            onChange={(e) => setIdentityForm((f) => ({ ...f, documentKey: e.target.value }))}
            placeholder="e.g. GHA-0987654321"
          />
        </MField>
        <MField label="Description">
          <MInput
            value={identityForm.description}
            onChange={(e) => setIdentityForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="e.g. Ghana Card"
          />
        </MField>
        <MField label="Status">
          <MSelect
            value={identityForm.status}
            onChange={(e) => setIdentityForm((f) => ({ ...f, status: e.target.value }))}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </MField>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 100,
          color: tokens.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children ?? <div style={{ fontSize: 13, color: tokens.text, fontWeight: 500 }}>{value}</div>}
    </div>
  );
}

function Mono({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 100,
          color: tokens.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 14,
          color: tokens.text,
          fontWeight: 300,
        }}
      >
        {value}
      </div>
    </div>
  );
}
