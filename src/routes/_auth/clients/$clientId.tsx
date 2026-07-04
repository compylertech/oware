import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, MoreVertical, Plus, Download, Pencil, Upload } from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
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
  clientsApi,
  loanAccountsApi,
  savingsAccountsApi,
  savingsProductsApi,
  type AccountDto,
  type ClientAddressDto,
  type ClientFamilyMemberDto,
  type ClientIdentifierDto,
  type ClientNoteDto,
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
  id: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
};

type FamilyRow = {
  id: string;
  name: string;
  rel: string;
  age: number;
  gender: string;
};

type IdentityRow = {
  id: string;
  type: string;
  no: string;
  status: StatusKind;
};

type NoteRow = {
  id: string;
  author: string;
  text: string;
  at: string;
};

type LoadedClientDetail = {
  client: BackendClient | null;
  savings: SavingsAccountRow[];
  transactions: TransactionRow[];
  residential: AddressRow[];
  office: AddressRow[];
  family: FamilyRow[];
  identities: IdentityRow[];
  notes: NoteRow[];
  defaultSavingsProductCode: string;
};

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

function fmtDisplayDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function prettyLabel(value?: string | null): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapSavingsAccount(account: AccountDto): SavingsAccountRow {
  const reference = account.accountNo ?? account.id;
  return {
    acc: reference,
    product: account.productName ?? account.productCode ?? "—",
    balance: account.balance ?? account.principal ?? 0,
    status: statusFrom(account.status),
    activated: fmtDisplayDate(
      account.activationDate ?? account.approvedDate ?? account.activatedOnDate,
    ),
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
    id: address.id ?? `${address.addressTypeCode ?? "address"}-${address.addressLine1 ?? ""}`,
    line1: address.addressLine1 ?? "",
    line2: address.addressLine2 ?? "",
    city: address.city ?? "",
    region: address.stateProvinceCode ?? "",
  };
}

function mapFamilyMember(member: ClientFamilyMemberDto): FamilyRow {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ") || "—";
  const relation = member.relationshipCode ? prettyLabel(member.relationshipCode) : undefined;
  return {
    id: member.id ?? name,
    name,
    rel: relation || (member.dependent ? "Dependent" : "Relative"),
    age:
      member.age ??
      (member.dateOfBirth
        ? Math.max(0, new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear())
        : 0),
    gender: prettyLabel(member.genderCode),
  };
}

function mapIdentifier(identifier: ClientIdentifierDto): IdentityRow {
  return {
    id: identifier.id ?? identifier.documentKey ?? `${identifier.documentTypeCode ?? "identifier"}`,
    type: prettyLabel(identifier.documentTypeCode) || identifier.description || "—",
    no: identifier.documentKey ?? "—",
    status: statusFrom(identifier.status),
  };
}

function mapNote(note: ClientNoteDto): NoteRow {
  return {
    id: note.id ?? note.note ?? String(Date.now()),
    author: note.createdBy ?? "System",
    text: note.note ?? "",
    at: fmtDisplayDate(note.createdOn),
  };
}

async function loadClientDetail(
  clientId: string,
  txDateFrom: string = "",
  txDateTo: string = "",
): Promise<LoadedClientDetail> {
  const [client, accounts, addresses, familyMembers, identifiers, notes, products] =
    await Promise.all([
      clientsApi.get(clientId),
      savingsAccountsApi.search({ clientId, size: 200 }),
      clientsApi.addresses(clientId),
      clientsApi.familyMembers(clientId),
      clientsApi.identifiers(clientId),
      clientsApi.notes(clientId),
      savingsProductsApi.list(),
    ]);

  const loanAccounts = await loanAccountsApi.byClient(clientId);
  void loanAccounts;

  const savings = accounts.map(mapSavingsAccount);

  const transactions = (
    await Promise.all(
      savings.map(async (account) => {
        const rows = await savingsAccountsApi.transactions(account.acc, {
          fromSubmittedDate: txDateFrom || undefined,
          toSubmittedDate: txDateTo || undefined,
        });
        return rows.map((row, index) => mapTransaction(row, account.acc, index));
      }),
    )
  ).flat();

  const residential = addresses.filter((address) => {
    const type = (address.addressTypeCode ?? "").toUpperCase();
    return type.includes("HOME") || type.includes("RESIDENTIAL") || !type;
  });
  const office = addresses.filter((address) => {
    const type = (address.addressTypeCode ?? "").toUpperCase();
    return type.includes("OFFICE");
  });

  return {
    client: client ?? null,
    savings,
    transactions,
    residential: residential.map(mapAddress),
    office: office.map(mapAddress),
    family: familyMembers.map(mapFamilyMember),
    identities: identifiers.map(mapIdentifier),
    notes: notes.map(mapNote),
    defaultSavingsProductCode: products[0]?.code ?? "",
  };
}

function ClientDetail() {
  const { clientId } = Route.useParams();
  const storeClient = useClients().find((c) => c.id === clientId) ?? null;
  const [clientState, setClientState] = useState<BackendClient | null>(storeClient ?? null);
  const client = clientState ?? storeClient ?? EMPTY_CLIENT;

  const [section, setSection] = useState<Section>("Details");
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const [savings, setSavings] = useState<SavingsAccountRow[]>([]);
  const [accountFilter, setAccountFilter] = useState<string>("All");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [residential, setResidential] = useState<AddressRow[]>([]);
  const [office, setOffice] = useState<AddressRow[]>([]);
  const [family, setFamily] = useState<FamilyRow[]>([]);
  const [identities, setIdentities] = useState<IdentityRow[]>([]);
  const [docs, setDocs] = useState([
    { name: "KYC_Form.pdf", type: "Onboarding" },
    { name: "Utility_Bill.pdf", type: "Proof of Address" },
  ]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [defaultSavingsProductCode, setDefaultSavingsProductCode] = useState("");

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

  async function reloadDetail() {
    const data = await loadClientDetail(clientId, txDateFrom, txDateTo);
    setClientState(data.client);
    setSavings(data.savings);
    setTransactions(data.transactions);
    setResidential(data.residential);
    setOffice(data.office);
    setFamily(data.family);
    setIdentities(data.identities);
    setNotes(data.notes);
    setDefaultSavingsProductCode(data.defaultSavingsProductCode);
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      const data = await loadClientDetail(clientId);
      if (!alive) return;
      setClientState(data.client);
      setSavings(data.savings);
      setTransactions(data.transactions);
      setResidential(data.residential);
      setOffice(data.office);
      setFamily(data.family);
      setIdentities(data.identities);
      setNotes(data.notes);
      setDefaultSavingsProductCode(data.defaultSavingsProductCode);
    })();
    return () => {
      alive = false;
    };
  }, [clientId, txDateFrom, txDateTo]);

  useEffect(() => {
    setTxPage(1);
  }, [accountFilter, txDateFrom, txDateTo]);

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
                    { l: "Edit Client", c: tokens.text },
                    { l: "View Transactions", c: tokens.text },
                    { l: "Close Account", c: "#D92D20" },
                  ].map((o) => (
                    <button
                      key={o.l}
                      onClick={() => setMenuOpen(false)}
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
                    <StatusPill status="Active" />
                  </Field>
                  <Field label="Admission Date" value="04 Feb 2024" />
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
                    <Mono label="Shares Held" value="250" />
                    <Mono label="Share Par Value" value="GH₵ 10.00" />
                    <Mono label="Total Share Capital" value="GH₵ 2,500.00" />
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
                    onClick={() => {
                      void (async () => {
                        const productCode =
                          defaultSavingsProductCode || (await savingsProductsApi.list())[0]?.code;
                        if (!productCode) return;
                        await savingsAccountsApi.create({
                          clientId,
                          productCode,
                          externalId: null,
                          submittedOnDate: new Date().toISOString().slice(0, 10),
                        });
                        await reloadDetail();
                      })();
                    }}
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
                            <Button variant="outline" size="sm">
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
            <>
              <TableCard
                title="Residential Address"
                actions={
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => {
                      void (async () => {
                        await clientsApi.addAddress(clientId, {
                          addressTypeCode: "HOME",
                          addressLine1: "New Street",
                          addressLine2: "",
                          city: "Accra",
                          stateProvinceCode: "Greater Accra",
                          countryCode: "GH",
                          postalCode: "",
                          active: true,
                        });
                        await reloadDetail();
                      })();
                    }}
                  >
                    Add Residential Address
                  </Button>
                }
              >
                <AddressTable rows={residential} empty="No residential address found" />
              </TableCard>
              <TableCard
                title="Office Address"
                actions={
                  <Button
                    variant="success"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => {
                      void (async () => {
                        await clientsApi.addAddress(clientId, {
                          addressTypeCode: "OFFICE",
                          addressLine1: "HQ Tower",
                          addressLine2: "Floor 3",
                          city: "Accra",
                          stateProvinceCode: "Greater Accra",
                          countryCode: "GH",
                          postalCode: "",
                          active: true,
                        });
                        await reloadDetail();
                      })();
                    }}
                  >
                    Add Office Address
                  </Button>
                }
              >
                <AddressTable rows={office} empty="No office address found" />
              </TableCard>
            </>
          )}

          {section === "Family Members" && (
            <TableCard
              title="Family Members"
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() => {
                    void (async () => {
                      await clientsApi.addFamilyMember(clientId, {
                        firstName: "New",
                        lastName: "Member",
                        dependent: true,
                        relationshipCode: "SIBLING",
                        genderCode: "FEMALE",
                      });
                      await reloadDetail();
                    })();
                  }}
                >
                  Add Family Member
                </Button>
              }
            >
              <Table>
                <TableHead cols={["Name", "Relationship", "Age", "Gender"]} />
                <tbody>
                  {family.length === 0 ? (
                    <EmptyRow cols={4} text="No family members found" />
                  ) : (
                    family.map((f) => (
                      <Tr key={f.name} hover>
                        <Td>{f.name}</Td>
                        <Td muted>{f.rel}</Td>
                        <Td muted>{f.age}</Td>
                        <Td muted>{f.gender}</Td>
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
                  onClick={() => {
                    void (async () => {
                      await clientsApi.addIdentifier(clientId, {
                        documentTypeCode: "NATIONAL_ID",
                        status: "ACTIVE",
                        documentKey: `GHA-${Math.floor(Math.random() * 900000000) + 100000000}`,
                        description: "National ID",
                      });
                      await reloadDetail();
                    })();
                  }}
                >
                  Add New Identity
                </Button>
              }
            >
              <Table>
                <TableHead cols={["Type", "Document No.", "Status"]} />
                <tbody>
                  {identities.length === 0 ? (
                    <EmptyRow cols={3} text="No identities found" />
                  ) : (
                    identities.map((i) => (
                      <Tr key={i.no} hover>
                        <Td>{i.type}</Td>
                        <Td
                          style={{
                            fontFamily: FONTS.mono,
                          }}
                        >
                          {i.no}
                        </Td>
                        <Td>
                          <StatusPill status={i.status} />
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
                      key={idx}
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
                          <span style={{ fontSize: 11, color: tokens.textMuted }}>{n.at}</span>
                        </div>
                        <p style={{ fontSize: 13, color: tokens.textSub, marginTop: 4 }}>
                          {n.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
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

function AddressTable({
  rows,
  empty,
}: {
  rows: { line1: string; line2: string; city: string; region: string }[];
  empty: string;
}) {
  return (
    <Table>
      <TableHead cols={["Line 1", "Line 2", "City", "Region", ""]} />
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow cols={5} text={empty} />
        ) : (
          rows.map((r, i) => (
            <Tr key={i} hover>
              <Td>{r.line1}</Td>
              <Td muted>{r.line2 || "—"}</Td>
              <Td muted>{r.city}</Td>
              <Td muted>{r.region}</Td>
              <Td align="right">
                <button style={{ color: tokens.textSub }} aria-label="Edit">
                  <Pencil size={14} />
                </button>
              </Td>
            </Tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
