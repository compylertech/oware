import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  Download,
  Pencil,
  Upload,
} from "lucide-react";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import { tokens, cardShadow } from "@/lib/tokens";

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
              fontFamily: "Sora, sans-serif",
              fontSize: 11,
              fontWeight: 700,
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
                fontWeight: 700,
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

function GhostBtn({
  children,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{
        border: `1px solid ${tokens.border}`,
        background: "white",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: tokens.textSub,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F8FE")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

function SolidBtn({
  children,
  onClick,
  icon: Icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5"
      style={{
        background: tokens.navy,
        color: "white",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: "#F8FAFC" }}>
        {cols.map((c) => (
          <th
            key={c}
            style={{
              textAlign: "left",
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: tokens.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        style={{
          padding: 36,
          textAlign: "center",
          fontSize: 13,
          color: tokens.textMuted,
        }}
      >
        {text}
      </td>
    </tr>
  );
}

// ---- mock sub-data ----
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

function ClientDetail() {
  const { clientId } = Route.useParams();
  const client = useMemo(
    () => CLIENT_SEED.find((c) => c.id === clientId) ?? CLIENT_SEED[0],
    [clientId],
  );

  const [section, setSection] = useState<Section>("Details");
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // mock sub data
  const [savings, setSavings] = useState([
    {
      acc: "1001234567",
      product: "Easy Saver",
      balance: 12450.75,
      status: "Active" as StatusKind,
      activated: "12 Mar 2024",
    },
    {
      acc: "1001234890",
      product: "Susu Plus",
      balance: 3200.0,
      status: "Active" as StatusKind,
      activated: "04 Aug 2024",
    },
  ]);
  const [accountFilter, setAccountFilter] = useState<string>("All");
  const transactions = [
    { date: "18 Jun 2026", type: "Credit", amount: 500, balance: 12950.75, ref: "TRX-0091", acc: "1001234567" },
    { date: "15 Jun 2026", type: "Debit", amount: 120, balance: 12450.75, ref: "TRX-0088", acc: "1001234567" },
    { date: "10 Jun 2026", type: "Credit", amount: 2000, balance: 3200, ref: "TRX-0075", acc: "1001234890" },
  ];
  const txRows = transactions.filter((t) => accountFilter === "All" || t.acc === accountFilter);

  const [residential, setResidential] = useState([
    { line1: "12 Independence Ave", line2: "East Legon", city: "Accra", region: "Greater Accra" },
  ]);
  const [office, setOffice] = useState<typeof residential>([]);

  const [family, setFamily] = useState([
    { name: "Akua Mensah", rel: "Spouse", age: 34, gender: "Female" },
    { name: "Kwesi Mensah", rel: "Son", age: 8, gender: "Male" },
  ]);

  const [identities, setIdentities] = useState([
    { type: "Ghana Card", no: "GHA-7239201-3", status: "Active" as StatusKind },
    { type: "Passport", no: "G2398872", status: "Pending" as StatusKind },
  ]);

  const [docs, setDocs] = useState([
    { name: "KYC_Form.pdf", type: "Onboarding" },
    { name: "Utility_Bill.pdf", type: "Proof of Address" },
  ]);

  const [notes, setNotes] = useState([
    { author: "Daniel Q.", text: "Client requested mobile banking upgrade.", at: "20 Jun 2026" },
  ]);
  const [noteDraft, setNoteDraft] = useState("");

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
          background:
            "linear-gradient(135deg, #002663 0%, #002663 55%, #1a4080 100%)",
          
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: tokens.gold }} />
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
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {initials(client.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    style={{
                      fontFamily: "Sora, sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {client.name}
                  </h1>
                  {client.isStaff && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
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
                    fontWeight: 600,
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
                    fontFamily: f.mono ? "DM Mono, monospace" : "DM Sans, sans-serif",
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
                        fontWeight: 600,
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
                      fontWeight: 700,
                      color: tokens.textMuted,
                      marginBottom: 10,
                    }}
                  >
                    Share Position
                  </div>
                  <div className="grid grid-cols-3 gap-5">
                    <Mono label="Shares Held" value="250" />
                    <Mono label="Share Par Value" value="GHS 10.00" />
                    <Mono label="Total Share Capital" value="GHS 2,500.00" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title="Savings Accounts"
                accent={tokens.gold}
                actions={
                  <SolidBtn
                    icon={Plus}
                    onClick={() =>
                      setSavings((s) => [
                        ...s,
                        {
                          acc: `100${Math.floor(Math.random() * 9000000)}`,
                          product: "New Saver",
                          balance: 0,
                          status: "Pending",
                          activated: new Date().toLocaleDateString("en-GB"),
                        },
                      ])
                    }
                  >
                    Create Account
                  </SolidBtn>
                }
              >
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <TableHead cols={["Account No.", "Product", "Balance", "Status", "Activated", ""]} />
                  <tbody>
                    {savings.length === 0 ? (
                      <EmptyRow cols={6} text="No savings accounts found" />
                    ) : (
                      savings.map((a) => (
                        <tr key={a.acc} style={{ borderTop: `1px solid #F0F3F8` }}>
                          <td style={{ padding: 14, fontFamily: "DM Mono, monospace", fontSize: 13, color: tokens.text }}>
                            {a.acc}
                          </td>
                          <td style={{ padding: 14, fontSize: 13, color: tokens.text }}>{a.product}</td>
                          <td style={{ padding: 14, fontFamily: "DM Mono, monospace", fontSize: 13, color: tokens.text }}>
                            GHS {a.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: 14 }}>
                            <StatusPill status={a.status} />
                          </td>
                          <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{a.activated}</td>
                          <td style={{ padding: 14, textAlign: "right" }}>
                            <GhostBtn>View</GhostBtn>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </SectionCard>
            </>
          )}

          {section === "Transactions" && (
            <SectionCard
              title="Transactions"
              accent={tokens.accent}
              actions={
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
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
            >
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <TableHead cols={["Date", "Type", "Amount", "Balance", "Reference"]} />
                <tbody>
                  {txRows.length === 0 ? (
                    <EmptyRow cols={5} text="No transactions found" />
                  ) : (
                    txRows.map((t) => {
                      const isCredit = t.type === "Credit";
                      return (
                        <tr key={t.ref} style={{ borderTop: `1px solid #F0F3F8` }}>
                          <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{t.date}</td>
                          <td style={{ padding: 14 }}>
                            <StatusPill status={isCredit ? "Credit" : "Debit"} />
                          </td>
                          <td
                            style={{
                              padding: 14,
                              fontFamily: "DM Mono, monospace",
                              fontSize: 13,
                              color: isCredit ? "#067647" : "#D92D20",
                              fontWeight: 600,
                            }}
                          >
                            {isCredit ? "+" : "−"} GHS {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: 14, fontFamily: "DM Mono, monospace", fontSize: 13, color: tokens.text }}>
                            GHS {t.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: 14, fontFamily: "DM Mono, monospace", fontSize: 12, color: tokens.textSub }}>
                            {t.ref}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </SectionCard>
          )}

          {section === "Address" && (
            <>
              <SectionCard
                title="Residential Address"
                accent={tokens.navy}
                actions={
                  <GhostBtn
                    icon={Plus}
                    onClick={() =>
                      setResidential((r) => [
                        ...r,
                        { line1: "New Street", line2: "", city: "Accra", region: "Greater Accra" },
                      ])
                    }
                  >
                    Add
                  </GhostBtn>
                }
              >
                <AddressTable rows={residential} empty="No residential address found" />
              </SectionCard>
              <SectionCard
                title="Office Address"
                accent={tokens.navy}
                actions={
                  <GhostBtn
                    icon={Plus}
                    onClick={() =>
                      setOffice((r) => [
                        ...r,
                        { line1: "HQ Tower", line2: "Floor 3", city: "Accra", region: "Greater Accra" },
                      ])
                    }
                  >
                    Add
                  </GhostBtn>
                }
              >
                <AddressTable rows={office} empty="No office address found" />
              </SectionCard>
            </>
          )}

          {section === "Family Members" && (
            <SectionCard
              title="Family Members"
              accent={tokens.accent}
              actions={
                <GhostBtn
                  icon={Plus}
                  onClick={() =>
                    setFamily((f) => [...f, { name: "New Member", rel: "Sibling", age: 25, gender: "Female" }])
                  }
                >
                  Add
                </GhostBtn>
              }
            >
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <TableHead cols={["Name", "Relationship", "Age", "Gender"]} />
                <tbody>
                  {family.length === 0 ? (
                    <EmptyRow cols={4} text="No family members found" />
                  ) : (
                    family.map((f) => (
                      <tr key={f.name} style={{ borderTop: `1px solid #F0F3F8` }}>
                        <td style={{ padding: 14, fontSize: 13, color: tokens.text }}>{f.name}</td>
                        <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{f.rel}</td>
                        <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{f.age}</td>
                        <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{f.gender}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SectionCard>
          )}

          {section === "Identities" && (
            <SectionCard
              title="Identities"
              accent={tokens.gold}
              actions={
                <GhostBtn
                  icon={Plus}
                  onClick={() =>
                    setIdentities((i) => [...i, { type: "Driver's License", no: "DL-99812", status: "Pending" }])
                  }
                >
                  Add
                </GhostBtn>
              }
            >
              <table className="w-full" style={{ borderCollapse: "collapse" }}>
                <TableHead cols={["Type", "Document No.", "Status"]} />
                <tbody>
                  {identities.length === 0 ? (
                    <EmptyRow cols={3} text="No identities found" />
                  ) : (
                    identities.map((i) => (
                      <tr key={i.no} style={{ borderTop: `1px solid #F0F3F8` }}>
                        <td style={{ padding: 14, fontSize: 13, color: tokens.text }}>{i.type}</td>
                        <td style={{ padding: 14, fontFamily: "DM Mono, monospace", fontSize: 13, color: tokens.text }}>
                          {i.no}
                        </td>
                        <td style={{ padding: 14 }}>
                          <StatusPill status={i.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SectionCard>
          )}

          {section === "Documents" && (
            <SectionCard
              title="Documents"
              accent={tokens.navy}
              actions={
                <SolidBtn
                  icon={Upload}
                  onClick={() => setDocs((d) => [...d, { name: "New_Doc.pdf", type: "Other" }])}
                >
                  Upload
                </SolidBtn>
              }
            >
              {docs.length === 0 ? (
                <div style={{ padding: 36, textAlign: "center", color: tokens.textMuted, fontSize: 13 }}>
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
                        <div style={{ fontSize: 13, color: tokens.text, fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{d.type}</div>
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
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
              <div className="flex justify-end mt-2">
                <SolidBtn
                  onClick={() => {
                    if (!noteDraft.trim()) return;
                    setNotes((n) => [
                      { author: "Daniel Q.", text: noteDraft.trim(), at: new Date().toLocaleDateString("en-GB") },
                      ...n,
                    ]);
                    setNoteDraft("");
                  }}
                >
                  Add Note
                </SolidBtn>
              </div>
              <div className="mt-5 space-y-3">
                {notes.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: tokens.textMuted, fontSize: 13 }}>
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
                          fontFamily: "Sora, sans-serif",
                          fontWeight: 700,
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
                          <span style={{ fontSize: 12, fontWeight: 600, color: tokens.text }}>{n.author}</span>
                          <span style={{ fontSize: 11, color: tokens.textMuted }}>{n.at}</span>
                        </div>
                        <p style={{ fontSize: 13, color: tokens.textSub, marginTop: 4 }}>{n.text}</p>
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

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 700,
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
          fontWeight: 700,
          color: tokens.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "DM Mono, monospace", fontSize: 14, color: tokens.text, fontWeight: 600 }}>
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
    <table className="w-full" style={{ borderCollapse: "collapse" }}>
      <TableHead cols={["Line 1", "Line 2", "City", "Region", ""]} />
      <tbody>
        {rows.length === 0 ? (
          <EmptyRow cols={5} text={empty} />
        ) : (
          rows.map((r, i) => (
            <tr key={i} style={{ borderTop: `1px solid #F0F3F8` }}>
              <td style={{ padding: 14, fontSize: 13, color: tokens.text }}>{r.line1}</td>
              <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{r.line2 || "—"}</td>
              <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{r.city}</td>
              <td style={{ padding: 14, fontSize: 13, color: tokens.textSub }}>{r.region}</td>
              <td style={{ padding: 14, textAlign: "right" }}>
                <button style={{ color: tokens.textSub }} aria-label="Edit">
                  <Pencil size={14} />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
