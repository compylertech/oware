import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, RefreshCw, Landmark, Plus, X } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, Ava, Table, THead, Tr, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { fmtGHS, loanAccountsApi, type LoanAccountDetail } from "@/api/loans";
import { clientsApi, referencesApi, apiErrorMessage, type ReferenceValueDto } from "@/api/backend";
import { useClients } from "@/api/clients";
import type { Client } from "@/api/clients";
import { useBackendData, refreshBackendData } from "@/api/useBackendData";
import { Button, TableCard, EmptyRow } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/loans/collateral")({
  component: CollateralPage,
});

function CollateralPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loan, setLoan] = useState<LoanAccountDetail | null>(null);
  const clients = useClients();
  const client = clients.find((c) => c.id === loan?.clientId);

  async function handleLookup(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setSearching(true);
    try {
      const detail = await loanAccountsApi.detail(q);
      if (!detail) {
        setLoan(null);
        setError(`No loan found for "${q}".`);
      } else {
        setLoan(detail);
      }
    } catch (err) {
      setLoan(null);
      setError(apiErrorMessage(err, "Something went wrong looking up this loan."));
    } finally {
      setSearching(false);
    }
  }

  const guarantorsKey = loan ? `loan-guarantors:${loan.accountNo}` : "";
  const fetchGuarantors = () =>
    loan ? loanAccountsApi.guarantors(loan.accountNo) : Promise.resolve([]);
  const { data: guarantors } = useBackendData(guarantorsKey, fetchGuarantors);

  const collateralsKey = loan ? `loan-collaterals:${loan.accountNo}` : "";
  const fetchCollaterals = () =>
    loan ? loanAccountsApi.collaterals(loan.accountNo) : Promise.resolve([]);
  const { data: collaterals } = useBackendData(collateralsKey, fetchCollaterals);

  // Shared by the table (to show a readable type name) and the Add Collateral
  // dialog (to populate the type dropdown) — fetched once here.
  const [collateralTypeOptions, setCollateralTypeOptions] = useState<ReferenceValueDto[]>([]);
  useEffect(() => {
    void referencesApi.list("COLLATERAL_TYPE").then(setCollateralTypeOptions);
  }, []);
  const collateralTypeName = (code: string) =>
    collateralTypeOptions.find((o) => o.code === code)?.name ?? code;

  const [dialog, setDialog] = useState<null | "guarantor" | "collateral">(null);

  return (
    <LoansShell>
      <Panel style={{ padding: 18, marginBottom: 16 }}>
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
          Search a loan account to add collateral or a guarantor
        </div>
        <form onSubmit={(e) => void handleLookup(e)} className="flex items-stretch gap-2">
          <div
            className="flex items-center gap-2 flex-1"
            style={{
              background: "#F5F8FE",
              border: `1px solid ${LOAN.border}`,
              borderRadius: 10,
              padding: "0 12px",
              maxWidth: 420,
            }}
          >
            <Landmark size={16} color={LOAN.muted} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter loan account number"
              className="flex-1 bg-transparent outline-none"
              style={{ ...fontMono, fontSize: 13, color: LOAN.ink, height: 40 }}
            />
          </div>
          <Button
            type="submit"
            disabled={searching || !query.trim()}
            icon={
              searching ? <RefreshCw size={15} className="animate-spin" /> : <Search size={15} />
            }
          >
            {searching ? "Searching…" : "Look Up"}
          </Button>
        </form>
        {error && (
          <div
            style={{
              marginTop: 12,
              background: "#FEF3F2",
              border: "1px solid #FECDCA",
              color: "#B42318",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              maxWidth: 420,
            }}
          >
            {error}
          </div>
        )}
      </Panel>

      {!loan ? (
        <Panel style={{ padding: 48, textAlign: "center" }}>
          <Landmark size={32} color={LOAN.muted} className="mx-auto" />
          <div style={{ fontSize: 14, color: LOAN.muted, marginTop: 10 }}>
            Search a loan account above to manage its collateral and guarantors.
          </div>
        </Panel>
      ) : (
        <>
          <Panel style={{ padding: 18, marginBottom: 16 }}>
            <div className="flex items-center gap-3">
              <Ava name={client?.name ?? loan.accountNo} size={40} />
              <div>
                <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
                  {loan.accountNo}
                </div>
                <div style={{ fontSize: 12, color: LOAN.muted, marginTop: 2 }}>
                  {client?.name ?? "—"} · {loan.productName}
                </div>
              </div>
              <div className="ml-auto" style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: LOAN.muted }}>Outstanding</div>
                <div style={{ fontSize: 14, fontWeight: 100, color: LOAN.ink }}>
                  {fmtGHS(loan.totalOutstanding)}
                </div>
              </div>
            </div>
          </Panel>

          <TableCard
            title="Guarantors"
            resultLabel={`${guarantors?.length ?? 0} guarantors`}
            actions={
              <Button
                variant="success"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setDialog("guarantor")}
              >
                Add Guarantor
              </Button>
            }
          >
            <Table>
              <THead>
                <Th>Guarantor</Th>
                <Th>Type</Th>
                <Th>Relationship</Th>
                <Th>Office</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {!guarantors ? (
                  <EmptyRow colSpan={6}>Loading guarantors…</EmptyRow>
                ) : guarantors.length === 0 ? (
                  <EmptyRow colSpan={6}>No guarantors on this loan yet.</EmptyRow>
                ) : (
                  guarantors.map((g) => (
                    <Tr key={g.id} hover>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Ava name={g.name} size={28} />
                          <span style={{ fontWeight: 300 }}>{g.name}</span>
                        </div>
                      </Td>
                      <Td>{g.guarantorType}</Td>
                      <Td>{g.relationshipType}</Td>
                      <Td style={{ color: LOAN.muted }}>{g.officeName}</Td>
                      <Td style={{ color: LOAN.muted }}>{g.joinedDate || "—"}</Td>
                      <Td>
                        <StatusPill
                          label={g.active ? "Active" : "Inactive"}
                          tone={g.active ? "green" : "gray"}
                        />
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </TableCard>

          <div className="mt-4">
            <TableCard
              title="Collateral"
              resultLabel={`${collaterals?.length ?? 0} collateral items`}
              actions={
                <Button
                  variant="success"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setDialog("collateral")}
                >
                  Add Collateral
                </Button>
              }
            >
              <Table>
                <THead>
                  <Th>Type</Th>
                  <Th>Value</Th>
                  <Th>Description</Th>
                </THead>
                <tbody>
                  {!collaterals ? (
                    <EmptyRow colSpan={3}>Loading collateral…</EmptyRow>
                  ) : collaterals.length === 0 ? (
                    <EmptyRow colSpan={3}>No collateral on this loan yet.</EmptyRow>
                  ) : (
                    collaterals.map((c) => (
                      <Tr key={c.collateralId} hover>
                        <Td style={{ fontWeight: 300 }}>
                          {collateralTypeName(c.collateralTypeCode)}
                        </Td>
                        <Td>{fmtGHS(c.value)}</Td>
                        <Td style={{ color: LOAN.muted }}>{c.description || "—"}</Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableCard>
          </div>
        </>
      )}

      {dialog === "guarantor" && loan && (
        <AddGuarantorDialog
          loanAccountNo={loan.accountNo}
          onClose={() => setDialog(null)}
          onAdded={() => {
            setDialog(null);
            void refreshBackendData(guarantorsKey, fetchGuarantors);
          }}
        />
      )}
      {dialog === "collateral" && loan && (
        <AddCollateralDialog
          loanAccountNo={loan.accountNo}
          collateralTypeOptions={collateralTypeOptions}
          onClose={() => setDialog(null)}
          onAdded={() => {
            setDialog(null);
            void refreshBackendData(collateralsKey, fetchCollaterals);
          }}
        />
      )}
    </LoansShell>
  );
}

// ---------- Dialog shell ----------

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,27,62,0.45)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          border: `1px solid ${LOAN.border}`,
          borderRadius: 14,
          width: "100%",
          maxWidth: 460,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: `1px solid ${LOAN.border}` }}
        >
          <div style={{ ...fontDisplay, fontSize: 16, fontWeight: 200, color: LOAN.ink }}>
            {title}
          </div>
          <button onClick={onClose} className="cursor-pointer" style={{ color: LOAN.muted }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 300, color: LOAN.muted, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputCss: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid ${LOAN.border}`,
  borderRadius: 8,
  fontSize: 13,
  background: "#F5F8FE",
};

// ---------- Add Guarantor ----------

function AddGuarantorDialog({
  loanAccountNo,
  onClose,
  onAdded,
}: {
  loanAccountNo: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [guarantorTypeOptions, setGuarantorTypeOptions] = useState<ReferenceValueDto[]>([]);
  const [relationshipOptions, setRelationshipOptions] = useState<ReferenceValueDto[]>([]);
  useEffect(() => {
    void referencesApi.list("GUARANTOR_TYPE").then(setGuarantorTypeOptions);
    void referencesApi.list("CLIENT_RELATIONSHIP_TYPE").then(setRelationshipOptions);
  }, []);

  const [guarantorTypeCode, setGuarantorTypeCode] = useState("CUSTOMER");
  const [clientRelationshipTypeCode, setClientRelationshipTypeCode] = useState("");
  const [amount, setAmount] = useState("");
  const [entityId, setEntityId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // "CUSTOMER" guarantors are an existing client of the bank — resolve
  // entityId via the same fineractClientId used elsewhere in the app, rather
  // than asking for a raw numeric id no one would actually know.
  const isCustomer = guarantorTypeCode === "CUSTOMER";
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [pickedClient, setPickedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!isCustomer) {
      setClientResults([]);
      return;
    }
    const q = clientQuery.trim();
    if (!q || pickedClient) {
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
  }, [clientQuery, isCustomer, pickedClient]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedEntityId = isCustomer
      ? pickedClient?.fineractClientId
      : parseInt(entityId, 10) || undefined;
    if (!resolvedEntityId) {
      setErr(isCustomer ? "Search and select a client." : "Enter a valid entity id.");
      return;
    }
    if (!clientRelationshipTypeCode) {
      setErr("Select a relationship type.");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const result = await loanAccountsApi.addGuarantor(loanAccountNo, {
        guarantorTypeCode,
        clientRelationshipTypeCode,
        entityId: resolvedEntityId,
        amount: amount ? parseFloat(amount) : undefined,
      });
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success("Guarantor added.");
      onAdded();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong adding this guarantor."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Add Guarantor" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} style={{ padding: 20 }} className="space-y-4">
        <Field label="Guarantor Type">
          <select
            value={guarantorTypeCode}
            onChange={(e) => {
              setGuarantorTypeCode(e.target.value);
              setPickedClient(null);
              setEntityId("");
            }}
            style={inputCss}
          >
            {guarantorTypeOptions.length === 0 && <option value="CUSTOMER">Customer</option>}
            {guarantorTypeOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        {isCustomer ? (
          <Field label="Guarantor (existing client)">
            {pickedClient ? (
              <div
                className="flex items-center justify-between"
                style={{ ...inputCss, height: "auto", padding: "8px 12px" }}
              >
                <span>{pickedClient.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPickedClient(null);
                    setClientQuery("");
                  }}
                  style={{ color: LOAN.blue, fontSize: 12 }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  placeholder="Search clients…"
                  style={inputCss}
                />
                {clientQuery.trim() && (
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
                    {searchingClients ? (
                      <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>Searching…</div>
                    ) : clientResults.length === 0 ? (
                      <div style={{ padding: 10, fontSize: 12, color: LOAN.muted }}>
                        No clients found.
                      </div>
                    ) : (
                      clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setPickedClient(c);
                            setClientQuery("");
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
            )}
          </Field>
        ) : (
          <Field label="Entity ID">
            <input
              value={entityId}
              onChange={(e) => setEntityId(e.target.value.replace(/[^\d]/g, ""))}
              placeholder={
                guarantorTypeCode === "STAFF" ? "Staff numeric id" : "External entity id"
              }
              style={inputCss}
            />
          </Field>
        )}

        <Field label="Relationship">
          <select
            value={clientRelationshipTypeCode}
            onChange={(e) => setClientRelationshipTypeCode(e.target.value)}
            style={inputCss}
          >
            <option value="">Select…</option>
            {relationshipOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Amount guaranteed (optional)">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            style={inputCss}
          />
        </Field>

        {err && (
          <div
            style={{
              background: "#FEF3F2",
              border: "1px solid #FECDCA",
              color: "#B42318",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}

        <Button type="submit" disabled={saving} full variant="success">
          {saving ? "Saving…" : "Add Guarantor"}
        </Button>
      </form>
    </DialogShell>
  );
}

// ---------- Add Collateral ----------

function AddCollateralDialog({
  loanAccountNo,
  collateralTypeOptions,
  onClose,
  onAdded,
}: {
  loanAccountNo: string;
  collateralTypeOptions: ReferenceValueDto[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [collateralTypeCode, setCollateralTypeCode] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!collateralTypeCode && collateralTypeOptions.length > 0) {
      setCollateralTypeCode(collateralTypeOptions[0].code);
    }
  }, [collateralTypeOptions, collateralTypeCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(value);
    if (!collateralTypeCode) {
      setErr("Select a collateral type.");
      return;
    }
    if (!n || n <= 0) {
      setErr("Enter a valid value greater than zero.");
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      const result = await loanAccountsApi.addCollateral(loanAccountNo, {
        collateralTypeCode,
        value: n,
        description: description.trim() || undefined,
      });
      if (!result) throw new Error("Backend is not reachable right now.");
      toast.success("Collateral added.");
      onAdded();
    } catch (submitErr) {
      setErr(apiErrorMessage(submitErr, "Something went wrong adding this collateral."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogShell title="Add Collateral" onClose={onClose}>
      <form onSubmit={(e) => void submit(e)} style={{ padding: 20 }} className="space-y-4">
        <Field label="Collateral Type">
          <select
            value={collateralTypeCode}
            onChange={(e) => setCollateralTypeCode(e.target.value)}
            style={inputCss}
          >
            {collateralTypeOptions.length === 0 && <option value="">Loading…</option>}
            {collateralTypeOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Value">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0.00"
            style={inputCss}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional"
            style={{ ...inputCss, height: "auto", padding: 10, resize: "vertical" }}
          />
        </Field>

        {err && (
          <div
            style={{
              background: "#FEF3F2",
              border: "1px solid #FECDCA",
              color: "#B42318",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
            }}
          >
            {err}
          </div>
        )}

        <Button type="submit" disabled={saving} full variant="success">
          {saving ? "Saving…" : "Add Collateral"}
        </Button>
      </form>
    </DialogShell>
  );
}
