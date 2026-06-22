import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  SlidersHorizontal,
  GitBranch,
  Network,
  Plus,
  Info,
} from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MTextarea, MSelect, MCancelBtn, MNavyBtn } from "@/components/common/Modal";

export const Route = createFileRoute("/_auth/cooperative/configurations")({
  component: ConfigurationsPage,
});

type TabKey = "policy" | "matrix" | "bonds";

const TABS: { key: TabKey; label: string; icon: typeof SlidersHorizontal }[] = [
  { key: "policy", label: "Policy Engine", icon: SlidersHorizontal },
  { key: "matrix", label: "Approval Matrix", icon: GitBranch },
  { key: "bonds", label: "Common Bonds", icon: Network },
];

function LayerTag({ label, tone }: { label: string; tone: "governed" | "core" | "overlay" }) {
  const styles = {
    governed: { bg: "#FFFBEB", fg: "#B45309" },
    core: { bg: "#E6EBF6", fg: "#002663" },
    overlay: { bg: "#E1F5EE", fg: "#0F6E56" },
  } as const;
  const s = styles[tone];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        fontFamily: FONTS.body,
      }}
    >
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    Active: { bg: "#ECFDF3", fg: "#067647" },
    Submitted: { bg: "#FFFBEB", fg: "#B45309" },
    Draft: { bg: "#EEF1F6", fg: "#7A879F" },
  };
  const s = map[status] ?? map.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }} />
      {status}
    </span>
  );
}

function LevelPill({ level }: { level: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    L1: { bg: "#EEF2FF", fg: "#3B5BDB" },
    L2: { bg: "#EEF2FF", fg: "#3B5BDB" },
    L3: { bg: "#FFFBEB", fg: "#B45309" },
    Board: { bg: "#F5F3FF", fg: "#7C3AED" },
  };
  const s = map[level] ?? map.L1;
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {level}
    </span>
  );
}

function NavyButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: tokens.navy,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontFamily: FONTS.body,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function TableShell({ headers, rightAligned, children }: {
  headers: string[];
  rightAligned?: number[];
  children: React.ReactNode;
}) {
  const right = new Set(rightAligned ?? []);
  return (
    <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${tokens.navy}` }}>
            {headers.map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: right.has(i) ? "right" : "left",
                  padding: "11px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#7A879F",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const td: React.CSSProperties = { padding: "13px 16px", fontSize: 13, color: tokens.text };
const tdMuted: React.CSSProperties = { ...td, color: tokens.textSub };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };

function PolicyEngineTab() {
  const [mod, setMod] = useState<string>("All modules");
  const filters = ["All modules", "Loans", "Savings", "Investments", "Shares"];
  const [rows, setRows] = useState([
    { rule: "Maximum loan-to-value", module: "Loans", value: "70%", eff: "1 Jan 2026", status: "Active" },
    { rule: "Minimum membership before loan", module: "Loans", value: "6 months", eff: "1 Jan 2026", status: "Active" },
    { rule: "Savings withdrawal notice period", module: "Savings", value: "14 days", eff: "1 Jan 2026", status: "Active" },
    { rule: "Maximum loan-to-value", module: "Loans", value: "75%", eff: "1 Jul 2026", status: "Submitted" },
    { rule: "Single-issuer exposure cap", module: "Investments", value: "35%", eff: "1 Jan 2026", status: "Active" },
    { rule: "Minimum shares for dividend", module: "Shares", value: "50 shares", eff: "—", status: "Draft" },
  ]);
  const filtered = mod === "All modules" ? rows : rows.filter((r) => r.module === mod);

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ rule: "", module: "Loans", value: "", eff: "", status: "Active" });
  const save = () => {
    if (!f.rule) return;
    setRows((r) => [...r, { rule: f.rule, module: f.module, value: f.value, eff: f.eff || "—", status: f.status }]);
    setF({ rule: "", module: "Loans", value: "", eff: "", status: "Active" });
    setOpen(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          background: "#EEF2FF",
          border: "1px solid #D6E2FF",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#1E3A8A", fontSize: 13 }}>
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Policy rules are governed: changes go <strong>draft → submitted → activated</strong>,
            with activation routed through the approval matrix.
          </div>
        </div>
        <LayerTag label="Governed" tone="governed" />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 10, padding: 4, gap: 2 }}>
          {filters.map((fl) => {
            const active = mod === fl;
            return (
              <button
                key={fl}
                onClick={() => setMod(fl)}
                style={{
                  background: active ? "#EEF3FF" : "transparent",
                  color: active ? tokens.navy : tokens.textSub,
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                }}
              >
                {fl}
              </button>
            );
          })}
        </div>
        <NavyButton icon={<Plus size={14} />} label="New rule" onClick={() => setOpen(true)} />
      </div>

      <TableShell headers={["Rule", "Module", "Value", "Effective", "Status"]}>
        {filtered.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <td style={{ ...td, fontWeight: 600 }}>{r.rule}</td>
            <td style={tdMuted}>{r.module}</td>
            <td style={{ ...td, fontWeight: 700, fontFamily: FONTS.body, fontVariantNumeric: "tabular-nums" }}>{r.value}</td>
            <td style={tdMuted}>{r.eff}</td>
            <td style={td}><StatusPill status={r.status} /></td>
          </tr>
        ))}
      </TableShell>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Policy Rule"
        footer={<><MCancelBtn onClick={() => setOpen(false)} /><MNavyBtn onClick={save}>Save Rule</MNavyBtn></>}
      >
        <MField label="Rule Name"><MInput value={f.rule} onChange={(e) => setF({ ...f, rule: e.target.value })} placeholder="e.g. Maximum loan-to-value" /></MField>
        <MField label="Module"><MSelect value={f.module} onChange={(e) => setF({ ...f, module: e.target.value })} options={["Loans", "Savings", "Membership", "Shares", "General"]} /></MField>
        <MField label="Value"><MInput value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} placeholder="e.g. 70% or 5000" /></MField>
        <MField label="Effective Date"><MInput type="date" value={f.eff} onChange={(e) => setF({ ...f, eff: e.target.value })} /></MField>
        <MField label="Status"><MSelect value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} options={["Active", "Inactive", "Draft"]} /></MField>
      </Modal>
    </div>
  );
}

function ApprovalMatrixTab() {
  const [rows, setRows] = useState([
    { module: "Loans", txn: "Salary loan", band: "₵0 – ₵10,000", level: "L1", approvers: 1, status: "Active" },
    { module: "Loans", txn: "Salary loan", band: "₵10,001 – ₵50,000", level: "L2", approvers: 2, status: "Active" },
    { module: "Loans", txn: "Asset loan", band: "₵50,001 +", level: "L3", approvers: 2, status: "Active" },
    { module: "Investments", txn: "Placement", band: "₵100,000 +", level: "Board", approvers: 3, status: "Active" },
    { module: "Policy", txn: "Override", band: "any", level: "L3", approvers: 1, status: "Active" },
    { module: "Mobile money", txn: "Transfer to bank", band: "₵20,000 +", level: "L2", approvers: 1, status: "Active" },
  ]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ module: "Loans", txn: "", from: "", to: "", level: "Level 1", approvers: "1" });
  const save = () => {
    if (!f.txn) return;
    const map: Record<string, string> = { "Level 1": "L1", "Level 2": "L2", "Level 3": "L3", "Level 4": "Board" };
    const band = (f.from || f.to) ? `₵${f.from || "0"} – ₵${f.to || "∞"}` : "any";
    setRows((r) => [...r, { module: f.module, txn: f.txn, band, level: map[f.level], approvers: Number(f.approvers) || 1, status: "Active" }]);
    setF({ module: "Loans", txn: "", from: "", to: "", level: "Level 1", approvers: "1" });
    setOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <GitBranch size={18} color={tokens.navy} />
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 800, color: tokens.text }}>Approval matrix</div>
          <LayerTag label="Governed" tone="governed" />
        </div>
        <NavyButton icon={<Plus size={14} />} label="Add row" onClick={() => setOpen(true)} />
      </div>
      <p style={{ color: tokens.textSub, fontSize: 13, margin: "0 0 14px" }}>
        One matrix drives every approval in the system. Each row maps a module + transaction type + amount band to a required level and number of approvers.
      </p>

      <TableShell headers={["Module", "Transaction", "Amount band", "Level", "Approvers", "Status"]} rightAligned={[4]}>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <td style={{ ...td, fontWeight: 600 }}>{r.module}</td>
            <td style={tdMuted}>{r.txn}</td>
            <td style={{ ...td, fontFamily: FONTS.body, fontVariantNumeric: "tabular-nums" }}>{r.band}</td>
            <td style={td}><LevelPill level={r.level} /></td>
            <td style={{ ...tdRight, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.approvers}</td>
            <td style={td}><StatusPill status={r.status} /></td>
          </tr>
        ))}
      </TableShell>

      <p style={{ color: tokens.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 12 }}>
        The same approval matrix the Approvals surfaces read from — change a band here and routing updates everywhere.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Approval Row"
        maxWidth={520}
        footer={<><MCancelBtn onClick={() => setOpen(false)} /><MNavyBtn onClick={save}>Add Row</MNavyBtn></>}
      >
        <MField label="Module"><MSelect value={f.module} onChange={(e) => setF({ ...f, module: e.target.value })} options={["Loans", "Savings", "Withdrawals", "Transfers", "Shares"]} /></MField>
        <MField label="Transaction Type"><MInput value={f.txn} onChange={(e) => setF({ ...f, txn: e.target.value })} placeholder="e.g. Loan disbursement" /></MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MField label="From (GHS)"><MInput type="number" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></MField>
          <MField label="To (GHS)"><MInput type="number" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></MField>
        </div>
        <MField label="Approval Level"><MSelect value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })} options={["Level 1", "Level 2", "Level 3", "Level 4"]} /></MField>
        <MField label="Number of Approvers"><MInput type="number" min={1} max={10} value={f.approvers} onChange={(e) => setF({ ...f, approvers: e.target.value })} /></MField>
      </Modal>
    </div>
  );
}

function CommonBondsTab() {
  const [rows, setRows] = useState([
    { group: "Teachers", count: 1204, status: "Active" },
    { group: "Civil servants", count: 892, status: "Active" },
    { group: "Traders", count: 611, status: "Active" },
  ]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", desc: "", count: "0" });
  const save = () => {
    if (!f.name) return;
    setRows((r) => [...r, { group: f.name, count: Number(f.count) || 0, status: "Active" }]);
    setF({ name: "", desc: "", count: "0" });
    setOpen(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Network size={18} color={tokens.navy} />
          <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 800, color: tokens.text }}>Common-bond groups</div>
          <LayerTag label="Governed" tone="governed" />
        </div>
        <NavyButton icon={<Plus size={14} />} label="Add group" onClick={() => setOpen(true)} />
      </div>
      <p style={{ color: tokens.textSub, fontSize: 13, margin: "0 0 14px" }}>
        The cooperative grouping a member belongs to — the basis of membership eligibility. Referenced by the Clients cooperative tab when admitting and grouping members.
      </p>

      <TableShell headers={["Group", "Members", "Status"]} rightAligned={[1]}>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
            <td style={{ ...td, fontWeight: 600 }}>{r.group}</td>
            <td style={{ ...tdRight, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{r.count.toLocaleString()}</td>
            <td style={td}><StatusPill status={r.status} /></td>
          </tr>
        ))}
      </TableShell>

      <p style={{ color: tokens.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 12 }}>
        Member counts are sourced from the cooperative membership records; the financial customer lives in Fineract.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Common Bond Group"
        footer={<><MCancelBtn onClick={() => setOpen(false)} /><MNavyBtn onClick={save}>Create Group</MNavyBtn></>}
      >
        <MField label="Group Name"><MInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Teaching Staff" /></MField>
        <MField label="Description"><MTextarea rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Describe eligibility criteria" /></MField>
        <MField label="Initial Member Count"><MInput type="number" min={0} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></MField>
      </Modal>
    </div>
  );
}

function ConfigurationsPage() {
  const [tab, setTab] = useState<TabKey>("policy");

  return (
    <div style={{ background: "#EEF2F8", minHeight: "100%", padding: "24px 24px 40px", fontFamily: FONTS.body }}>
      <Link
        to="/cooperative"
        style={{
          color: tokens.navy,
          fontSize: 13,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} /> Back to Cooperative
      </Link>

      {/* Hero */}
      <div
        style={{
          marginTop: 14,
          background: "linear-gradient(135deg, #001844 0%, #002663 60%, #1a4080 100%)",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            height: 3,
            background: "linear-gradient(90deg, #1a4080, #002663, #1a4080)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />
        <div style={{ padding: "24px 28px 0", position: "relative" }}>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
            Configurations
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "4px 0 18px" }}>
            Configure policy rules, approval workflows and cooperative common bond definitions.
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map((t) => {
              const Active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: Active ? "#EEF2F8" : "transparent",
                    color: Active ? tokens.navy : "rgba(255,255,255,0.55)",
                    border: "none",
                    borderRadius: "8px 8px 0 0",
                    padding: "10px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: FONTS.body,
                    transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!Active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    if (!Active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tab === "policy" && <PolicyEngineTab />}
      {tab === "matrix" && <ApprovalMatrixTab />}
      {tab === "bonds" && <CommonBondsTab />}
    </div>
  );
}
