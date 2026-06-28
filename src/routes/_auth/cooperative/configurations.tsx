import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  SlidersHorizontal,
  GitBranch,
  Network,
  Plus,
  Info,
  Landmark,
  Target,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { Button, SectionCard, Table, TableCard, Td, Th, THead, Tr } from "@/components/patterns";

export const Route = createFileRoute("/_auth/cooperative/configurations")({
  component: ConfigurationsPage,
});

type TabKey = "policy" | "matrix" | "bonds" | "governance" | "strategic" | "compliance";
type TabGroup = "Operations" | "Governance & Strategy";

const TAB_GROUPS: TabGroup[] = ["Operations", "Governance & Strategy"];

const TABS: { key: TabKey; label: string; icon: typeof SlidersHorizontal; group: TabGroup }[] = [
  { key: "policy", label: "Policy Engine", icon: SlidersHorizontal, group: "Operations" },
  { key: "matrix", label: "Approval Matrix", icon: GitBranch, group: "Operations" },
  { key: "bonds", label: "Common Bonds", icon: Network, group: "Operations" },
  { key: "governance", label: "Governance Settings", icon: Landmark, group: "Governance & Strategy" },
  { key: "strategic", label: "Strategic Plan", icon: Target, group: "Governance & Strategy" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, group: "Governance & Strategy" },
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
        fontWeight: 100,
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
    Draft: { bg: "#EEF1F6", fg: "#5B6A86" },
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
        fontWeight: 100,
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
        fontWeight: 100,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      {level}
    </span>
  );
}

function TableShell({
  headers,
  rightAligned,
  children,
}: {
  headers: string[];
  rightAligned?: number[];
  children: React.ReactNode;
}) {
  const right = new Set(rightAligned ?? []);
  return (
    <TableCard>
      <Table>
        <THead>
          {headers.map((h, i) => (
            <Th
              key={h}
              align={right.has(i) ? "right" : "left"}
              style={{
                padding: "11px 16px",
                fontSize: 11,
                fontWeight: 100,
                color: "#5B6A86",
              }}
            >
              {h}
            </Th>
          ))}
        </THead>
        <tbody>{children}</tbody>
      </Table>
    </TableCard>
  );
}

const td: React.CSSProperties = { padding: "13px 16px", fontSize: 13, color: tokens.text };
const tdMuted: React.CSSProperties = { ...td, color: tokens.textSub };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };

function PolicyEngineTab() {
  const [mod, setMod] = useState<string>("All modules");
  const filters = ["All modules", "Loans", "Savings", "Investments", "Shares"];
  const [rows, setRows] = useState([
    {
      rule: "Maximum loan-to-value",
      module: "Loans",
      value: "70%",
      eff: "1 Jan 2026",
      status: "Active",
    },
    {
      rule: "Minimum membership before loan",
      module: "Loans",
      value: "6 months",
      eff: "1 Jan 2026",
      status: "Active",
    },
    {
      rule: "Savings withdrawal notice period",
      module: "Savings",
      value: "14 days",
      eff: "1 Jan 2026",
      status: "Active",
    },
    {
      rule: "Maximum loan-to-value",
      module: "Loans",
      value: "75%",
      eff: "1 Jul 2026",
      status: "Submitted",
    },
    {
      rule: "Single-issuer exposure cap",
      module: "Investments",
      value: "35%",
      eff: "1 Jan 2026",
      status: "Active",
    },
    {
      rule: "Minimum shares for dividend",
      module: "Shares",
      value: "50 shares",
      eff: "—",
      status: "Draft",
    },
  ]);
  const filtered = mod === "All modules" ? rows : rows.filter((r) => r.module === mod);

  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ rule: "", module: "Loans", value: "", eff: "", status: "Active" });
  const save = () => {
    if (!f.rule) return;
    setRows((r) => [
      ...r,
      { rule: f.rule, module: f.module, value: f.value, eff: f.eff || "—", status: f.status },
    ]);
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
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            color: "#1E3A8A",
            fontSize: 13,
          }}
        >
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Policy rules are governed: changes go <strong>draft → submitted → activated</strong>,
            with activation routed through the approval matrix.
          </div>
        </div>
        <LayerTag label="Governed" tone="governed" />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#fff",
            border: `1px solid ${tokens.border}`,
            borderRadius: 10,
            padding: 4,
            gap: 2,
          }}
        >
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
                  fontWeight: 100,
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                }}
              >
                {fl}
              </button>
            );
          })}
        </div>
        <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          New rule
        </Button>
      </div>

      <TableShell headers={["Rule", "Module", "Value", "Effective", "Status"]}>
        {filtered.map((r, i) => (
          <Tr key={i} hover>
            <Td style={{ ...td, fontWeight: 300 }}>{r.rule}</Td>
            <Td style={tdMuted}>{r.module}</Td>
            <Td
              style={{
                ...td,
                fontWeight: 100,
                fontFamily: FONTS.body,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r.value}
            </Td>
            <Td style={tdMuted}>{r.eff}</Td>
            <Td style={td}>
              <StatusPill status={r.status} />
            </Td>
          </Tr>
        ))}
      </TableShell>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Policy Rule"
        footer={
          <>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        <MField label="Rule Name">
          <MInput
            value={f.rule}
            onChange={(e) => setF({ ...f, rule: e.target.value })}
            placeholder="e.g. Maximum loan-to-value"
          />
        </MField>
        <MField label="Module">
          <MSelect
            value={f.module}
            onChange={(e) => setF({ ...f, module: e.target.value })}
            options={["Loans", "Savings", "Membership", "Shares", "General"]}
          />
        </MField>
        <MField label="Value">
          <MInput
            value={f.value}
            onChange={(e) => setF({ ...f, value: e.target.value })}
            placeholder="e.g. 70% or 5000"
          />
        </MField>
        <MField label="Effective Date">
          <MInput type="date" value={f.eff} onChange={(e) => setF({ ...f, eff: e.target.value })} />
        </MField>
        <MField label="Status">
          <MSelect
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value })}
            options={["Active", "Inactive", "Draft"]}
          />
        </MField>
      </Modal>
    </div>
  );
}

function ApprovalMatrixTab() {
  const [rows, setRows] = useState([
    {
      module: "Loans",
      txn: "Salary loan",
      band: "₵0 – ₵10,000",
      level: "L1",
      approvers: 1,
      status: "Active",
    },
    {
      module: "Loans",
      txn: "Salary loan",
      band: "₵10,001 – ₵50,000",
      level: "L2",
      approvers: 2,
      status: "Active",
    },
    {
      module: "Loans",
      txn: "Asset loan",
      band: "₵50,001 +",
      level: "L3",
      approvers: 2,
      status: "Active",
    },
    {
      module: "Investments",
      txn: "Placement",
      band: "₵100,000 +",
      level: "Board",
      approvers: 3,
      status: "Active",
    },
    { module: "Policy", txn: "Override", band: "any", level: "L3", approvers: 1, status: "Active" },
    {
      module: "Mobile money",
      txn: "Transfer to bank",
      band: "₵20,000 +",
      level: "L2",
      approvers: 1,
      status: "Active",
    },
  ]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    module: "Loans",
    txn: "",
    from: "",
    to: "",
    level: "Level 1",
    approvers: "1",
  });
  const save = () => {
    if (!f.txn) return;
    const map: Record<string, string> = {
      "Level 1": "L1",
      "Level 2": "L2",
      "Level 3": "L3",
      "Level 4": "Board",
    };
    const band = f.from || f.to ? `₵${f.from || "0"} – ₵${f.to || "∞"}` : "any";
    setRows((r) => [
      ...r,
      {
        module: f.module,
        txn: f.txn,
        band,
        level: map[f.level],
        approvers: Number(f.approvers) || 1,
        status: "Active",
      },
    ]);
    setF({ module: "Loans", txn: "", from: "", to: "", level: "Level 1", approvers: "1" });
    setOpen(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <GitBranch size={18} color={tokens.navy} />
          <div
            style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 200, color: tokens.text }}
          >
            Approval matrix
          </div>
          <LayerTag label="Governed" tone="governed" />
        </div>
        <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          Add Approval Matrix
        </Button>
      </div>
      <p style={{ color: tokens.textSub, fontSize: 13, margin: "0 0 14px" }}>
        One matrix drives every approval in the system. Each row maps a module + transaction type +
        amount band to a required level and number of approvers.
      </p>

      <TableShell
        headers={["Module", "Transaction", "Amount band", "Level", "Approvers", "Status"]}
        rightAligned={[4]}
      >
        {rows.map((r, i) => (
          <Tr key={i} hover>
            <Td style={{ ...td, fontWeight: 300 }}>{r.module}</Td>
            <Td style={tdMuted}>{r.txn}</Td>
            <Td style={{ ...td, fontFamily: FONTS.body, fontVariantNumeric: "tabular-nums" }}>
              {r.band}
            </Td>
            <Td style={td}>
              <LevelPill level={r.level} />
            </Td>
            <Td style={{ ...tdRight, fontWeight: 100, fontVariantNumeric: "tabular-nums" }}>
              {r.approvers}
            </Td>
            <Td style={td}>
              <StatusPill status={r.status} />
            </Td>
          </Tr>
        ))}
      </TableShell>

      <p style={{ color: tokens.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 12 }}>
        The same approval matrix the Approvals surfaces read from — change a band here and routing
        updates everywhere.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Approval Row"
        maxWidth={520}
        footer={
          <>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        <MField label="Module">
          <MSelect
            value={f.module}
            onChange={(e) => setF({ ...f, module: e.target.value })}
            options={["Loans", "Savings", "Withdrawals", "Transfers", "Shares"]}
          />
        </MField>
        <MField label="Transaction Type">
          <MInput
            value={f.txn}
            onChange={(e) => setF({ ...f, txn: e.target.value })}
            placeholder="e.g. Loan disbursement"
          />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MField label="From (GH₵)">
            <MInput
              type="number"
              value={f.from}
              onChange={(e) => setF({ ...f, from: e.target.value })}
            />
          </MField>
          <MField label="To (GH₵)">
            <MInput
              type="number"
              value={f.to}
              onChange={(e) => setF({ ...f, to: e.target.value })}
            />
          </MField>
        </div>
        <MField label="Approval Level">
          <MSelect
            value={f.level}
            onChange={(e) => setF({ ...f, level: e.target.value })}
            options={["Level 1", "Level 2", "Level 3", "Level 4"]}
          />
        </MField>
        <MField label="Number of Approvers">
          <MInput
            type="number"
            min={1}
            max={10}
            value={f.approvers}
            onChange={(e) => setF({ ...f, approvers: e.target.value })}
          />
        </MField>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <Network size={18} color={tokens.navy} />
          <div
            style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 200, color: tokens.text }}
          >
            Common-bond groups
          </div>
          <LayerTag label="Governed" tone="governed" />
        </div>
        <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          Add group
        </Button>
      </div>
      <p style={{ color: tokens.textSub, fontSize: 13, margin: "0 0 14px" }}>
        The cooperative grouping a member belongs to — the basis of membership eligibility.
        Referenced by the Clients cooperative tab when admitting and grouping members.
      </p>

      <TableShell headers={["Group", "Members", "Status"]} rightAligned={[1]}>
        {rows.map((r, i) => (
          <Tr key={i} hover>
            <Td style={{ ...td, fontWeight: 300 }}>{r.group}</Td>
            <Td style={{ ...tdRight, fontWeight: 100, fontVariantNumeric: "tabular-nums" }}>
              {r.count.toLocaleString()}
            </Td>
            <Td style={td}>
              <StatusPill status={r.status} />
            </Td>
          </Tr>
        ))}
      </TableShell>

      <p style={{ color: tokens.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 12 }}>
        Member counts are sourced from the cooperative membership records; the financial customer
        lives in Fineract.
      </p>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Common Bond Group"
        footer={
          <>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={save}>
              Create Group
            </Button>
          </>
        }
      >
        <MField label="Group Name">
          <MInput
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="e.g. Teaching Staff"
          />
        </MField>
        <MField label="Description">
          <MTextarea
            rows={3}
            value={f.desc}
            onChange={(e) => setF({ ...f, desc: e.target.value })}
            placeholder="Describe eligibility criteria"
          />
        </MField>
        <MField label="Initial Member Count">
          <MInput
            type="number"
            min={0}
            value={f.count}
            onChange={(e) => setF({ ...f, count: e.target.value })}
          />
        </MField>
      </Modal>
    </div>
  );
}

function GovernanceSettingsTab() {
  const [board, setBoard] = useState({
    size: "7",
    term: "3",
    quorum: "60",
    frequency: "Monthly",
    attendance: "75",
  });

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [agm, setAgm] = useState({ month: "March", noticeDays: "21" });

  type Committee = { name: string; required: "Required" | "Optional" };
  const [committees, setCommittees] = useState<Committee[]>([
    { name: "Loans Committee", required: "Required" },
    { name: "Supervisory Committee", required: "Required" },
    { name: "Vetting Committee", required: "Required" },
    { name: "Other Committees", required: "Optional" },
  ]);

  const [open, setOpen] = useState(false);
  const [nc, setNc] = useState<Committee>({ name: "", required: "Required" });
  const addCommittee = () => {
    if (!nc.name.trim()) return;
    setCommittees((c) => [...c, { name: nc.name.trim(), required: nc.required }]);
    setNc({ name: "", required: "Required" });
    setOpen(false);
  };
  const setRequired = (i: number, required: Committee["required"]) =>
    setCommittees((c) => c.map((row, idx) => (idx === i ? { ...row, required } : row)));
  const removeCommittee = (i: number) =>
    setCommittees((c) => c.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            color: "#92400E",
            fontSize: 13,
          }}
        >
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Derived directly from <strong>Bye Laws Section 4</strong>. These define the board and
            committee structure and are not critical for the daily operations of the union.
          </div>
        </div>
        <LayerTag label="Bye Laws" tone="governed" />
      </div>

      <SectionCard title="Board Module" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <MField label="Board Size">
            <MInput
              type="number"
              min={0}
              value={board.size}
              onChange={(e) => setBoard({ ...board, size: e.target.value })}
            />
          </MField>
          <MField label="Board Term (years)">
            <MInput
              type="number"
              min={0}
              value={board.term}
              onChange={(e) => setBoard({ ...board, term: e.target.value })}
            />
          </MField>
          <MField label="Quorum Percentage (%)">
            <MInput
              type="number"
              min={0}
              max={100}
              value={board.quorum}
              onChange={(e) => setBoard({ ...board, quorum: e.target.value })}
            />
          </MField>
          <MField label="Meeting Frequency">
            <MSelect
              value={board.frequency}
              onChange={(e) => setBoard({ ...board, frequency: e.target.value })}
              options={["Weekly", "Monthly", "Quarterly", "Bi-annually", "Annually"]}
            />
          </MField>
          <MField label="Attendance Threshold (%)">
            <MInput
              type="number"
              min={0}
              max={100}
              value={board.attendance}
              onChange={(e) => setBoard({ ...board, attendance: e.target.value })}
            />
          </MField>
        </div>
      </SectionCard>

      <SectionCard title="Annual General Meeting" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <MField label="AGM Month">
            <MSelect
              value={agm.month}
              onChange={(e) => setAgm({ ...agm, month: e.target.value })}
              options={MONTHS}
            />
          </MField>
          <MField label="Notice Period (days)">
            <MInput
              type="number"
              min={0}
              value={agm.noticeDays}
              onChange={(e) => setAgm({ ...agm, noticeDays: e.target.value })}
            />
          </MField>
        </div>
      </SectionCard>

      <TableCard
        title="Committees"
        actions={
          <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add committee
          </Button>
        }
      >
        <Table>
          <THead>
            <Th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 100, color: "#5B6A86" }}>
              Committee
            </Th>
            <Th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 100, color: "#5B6A86" }}>
              Required
            </Th>
            <Th
              align="right"
              style={{ padding: "11px 16px", fontSize: 11, fontWeight: 100, color: "#5B6A86" }}
            >
              {""}
            </Th>
          </THead>
          <tbody>
            {committees.map((c, i) => (
              <Tr key={`${c.name}-${i}`} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{c.name}</Td>
                <Td style={td}>
                  <MSelect
                    value={c.required}
                    onChange={(e) => setRequired(i, e.target.value as Committee["required"])}
                    options={["Required", "Optional"]}
                    style={{ maxWidth: 160 }}
                  />
                </Td>
                <Td style={tdRight}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => removeCommittee(i)}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button variant="success" onClick={() => toast.success("Governance settings saved")}>
          Save changes
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Committee"
        footer={
          <>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={addCommittee}>
              Add Committee
            </Button>
          </>
        }
      >
        <MField label="Committee Name">
          <MInput
            value={nc.name}
            onChange={(e) => setNc({ ...nc, name: e.target.value })}
            placeholder="e.g. Education Committee"
          />
        </MField>
        <MField label="Required">
          <MSelect
            value={nc.required}
            onChange={(e) => setNc({ ...nc, required: e.target.value as Committee["required"] })}
            options={["Required", "Optional"]}
          />
        </MField>
      </Modal>
    </div>
  );
}

function StrategicPlanTab() {
  const SOURCES = ["Strategic Plan", "Manual Entry", "Computed"];
  const UNITS = ["%", "GH₵", "Ratio", "Count"];
  const FREQUENCIES = ["Monthly", "Quarterly", "Annual"];
  const DIRECTIONS = ["Higher", "Lower"] as const;
  type Direction = (typeof DIRECTIONS)[number];
  type Kpi = {
    name: string;
    target: string;
    unit: string;
    frequency: string;
    source: string;
    direction: Direction;
  };
  const seed = (name: string, target: string, direction: Direction = "Higher"): Kpi => ({
    name,
    target,
    unit: "%",
    frequency: "Monthly",
    source: "Strategic Plan",
    direction,
  });
  const [kpis, setKpis] = useState<Kpi[]>([
    seed("Membership Growth", "10"),
    seed("Savings Growth", "15"),
    seed("Asset Growth", "12"),
    seed("Delinquency Ratio", "5", "Lower"),
    seed("ROA", "3"),
    seed("Liquidity Ratio", "20"),
  ]);

  const blankKpi: Kpi = {
    name: "",
    target: "",
    unit: "%",
    frequency: "Monthly",
    source: "Strategic Plan",
    direction: "Higher",
  };
  const [open, setOpen] = useState(false);
  const [nk, setNk] = useState<Kpi>(blankKpi);
  const addKpi = () => {
    if (!nk.name.trim()) return;
    setKpis((k) => [...k, { ...nk, name: nk.name.trim() }]);
    setNk(blankKpi);
    setOpen(false);
  };
  const update = (i: number, patch: Partial<Kpi>) =>
    setKpis((k) => k.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeKpi = (i: number) => setKpis((k) => k.filter((_, idx) => idx !== i));

  // ----- Capture & dashboard state (Monthly Capture -> Variance -> Board Dashboard) -----
  type View = "targets" | "capture" | "dashboard";
  const [view, setView] = useState<View>("targets");
  const PERIODS = ["Jun 2026", "May 2026", "Apr 2026", "Mar 2026"];
  const [period, setPeriod] = useState(PERIODS[0]);
  // actuals[period][kpiName] = captured value
  const [actuals, setActuals] = useState<Record<string, Record<string, string>>>({
    "Jun 2026": {
      "Membership Growth": "8",
      "Savings Growth": "16",
      "Asset Growth": "11",
      "Delinquency Ratio": "6",
      ROA: "3.2",
      "Liquidity Ratio": "19",
    },
  });
  const actualFor = (name: string) => actuals[period]?.[name] ?? "";
  const setActual = (name: string, value: string) =>
    setActuals((a) => ({ ...a, [period]: { ...(a[period] ?? {}), [name]: value } }));
  const variance = (k: Kpi) => {
    const t = parseFloat(k.target);
    const a = parseFloat(actualFor(k.name));
    if (!isFinite(t) || !isFinite(a) || t === 0) return null;
    const pct = ((a - t) / Math.abs(t)) * 100;
    const onTrack = k.direction === "Higher" ? a >= t : a <= t;
    return { actual: a, pct, onTrack };
  };
  const onTrackCount = kpis.filter((k) => variance(k)?.onTrack).length;
  const capturedCount = kpis.filter((k) => actualFor(k.name) !== "").length;

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
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            color: "#1E3A8A",
            fontSize: 13,
          }}
        >
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Strategic KPIs make the system intelligent enough to administer the entire union — they
            feed dashboards and board reporting against the cooperative's strategic plan.
          </div>
        </div>
        <LayerTag label="Strategic" tone="overlay" />
      </div>

      <div
        style={{
          display: "inline-flex",
          background: "#fff",
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          padding: 4,
          gap: 2,
          marginBottom: 16,
        }}
      >
        {(
          [
            { key: "targets", label: "Targets" },
            { key: "capture", label: "Monthly Capture" },
            { key: "dashboard", label: "Board Dashboard" },
          ] as { key: View; label: string }[]
        ).map((o) => {
          const active = view === o.key;
          return (
            <button
              key={o.key}
              onClick={() => setView(o.key)}
              style={{
                background: active ? "#EEF3FF" : "transparent",
                color: active ? tokens.navy : tokens.textSub,
                border: "none",
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: active ? 300 : 100,
                cursor: "pointer",
                fontFamily: FONTS.body,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {view === "targets" && (
        <>
          <TableCard
            title="Strategic KPIs"
            actions={
              <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
                Add KPI
              </Button>
            }
          >
        <Table>
          <THead>
            {["KPI", "Target", "Unit", "Better when", "Frequency", "Source", ""].map((h, hi) => (
              <Th
                key={h || hi}
                align={hi === 6 ? "right" : "left"}
                style={{ padding: "11px 16px", fontSize: 11, fontWeight: 100, color: "#5B6A86" }}
              >
                {h}
              </Th>
            ))}
          </THead>
          <tbody>
            {kpis.map((k, i) => (
              <Tr key={`${k.name}-${i}`} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{k.name}</Td>
                <Td style={td}>
                  <MInput
                    type="number"
                    value={k.target}
                    onChange={(e) => update(i, { target: e.target.value })}
                    style={{ maxWidth: 100, fontVariantNumeric: "tabular-nums" }}
                  />
                </Td>
                <Td style={td}>
                  <MSelect
                    value={k.unit}
                    onChange={(e) => update(i, { unit: e.target.value })}
                    options={UNITS}
                    style={{ maxWidth: 100 }}
                  />
                </Td>
                <Td style={td}>
                  <MSelect
                    value={k.direction}
                    onChange={(e) => update(i, { direction: e.target.value as Direction })}
                    options={[...DIRECTIONS]}
                    style={{ maxWidth: 110 }}
                  />
                </Td>
                <Td style={td}>
                  <MSelect
                    value={k.frequency}
                    onChange={(e) => update(i, { frequency: e.target.value })}
                    options={FREQUENCIES}
                    style={{ maxWidth: 140 }}
                  />
                </Td>
                <Td style={td}>
                  <MSelect
                    value={k.source}
                    onChange={(e) => update(i, { source: e.target.value })}
                    options={SOURCES}
                    style={{ maxWidth: 180 }}
                  />
                </Td>
                <Td style={tdRight}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => removeKpi(i)}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              variant="success"
              onClick={() => toast.success("Strategic plan settings saved")}
            >
              Save changes
            </Button>
          </div>
        </>
      )}

      {view === "capture" && (
        <>
          <TableCard
            title="Monthly Capture"
            actions={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: tokens.textSub }}>Period</span>
                <MSelect
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  options={PERIODS}
                  style={{ maxWidth: 150 }}
                />
              </div>
            }
          >
            <Table>
              <THead>
                {["KPI", "Target", "Actual", "Unit"].map((h, hi) => (
                  <Th
                    key={h}
                    align={hi === 3 ? "right" : "left"}
                    style={{
                      padding: "11px 16px",
                      fontSize: 11,
                      fontWeight: 100,
                      color: "#5B6A86",
                    }}
                  >
                    {h}
                  </Th>
                ))}
              </THead>
              <tbody>
                {kpis.map((k, i) => (
                  <Tr key={`${k.name}-${i}`} hover>
                    <Td style={{ ...td, fontWeight: 300 }}>{k.name}</Td>
                    <Td style={{ ...tdMuted, fontVariantNumeric: "tabular-nums" }}>
                      {k.target}
                      {k.unit === "%" ? "%" : ""}
                    </Td>
                    <Td style={td}>
                      <MInput
                        type="number"
                        value={actualFor(k.name)}
                        onChange={(e) => setActual(k.name, e.target.value)}
                        placeholder="—"
                        style={{ maxWidth: 120, fontVariantNumeric: "tabular-nums" }}
                      />
                    </Td>
                    <Td style={tdRight}>{k.unit}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableCard>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <Button
              variant="success"
              onClick={() =>
                toast.success(`Captured ${capturedCount}/${kpis.length} actuals for ${period}`)
              }
            >
              Save capture
            </Button>
          </div>
        </>
      )}

      {view === "dashboard" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { label: "On track", value: `${onTrackCount}/${kpis.length}`, good: true },
              { label: "Captured", value: `${capturedCount}/${kpis.length}`, good: false },
              { label: "Period", value: period, good: false },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 12,
                  padding: "12px 16px",
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 100,
                    color: tokens.textSub,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 200,
                    color: s.good ? "#067647" : tokens.text,
                    marginTop: 4,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <TableCard
            title="Board Dashboard"
            actions={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: tokens.textSub }}>Period</span>
                <MSelect
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  options={PERIODS}
                  style={{ maxWidth: 150 }}
                />
              </div>
            }
          >
            <Table>
              <THead>
                {["KPI", "Target", "Actual", "Variance", "Status"].map((h, hi) => (
                  <Th
                    key={h}
                    align={hi >= 1 && hi <= 3 ? "right" : "left"}
                    style={{
                      padding: "11px 16px",
                      fontSize: 11,
                      fontWeight: 100,
                      color: "#5B6A86",
                    }}
                  >
                    {h}
                  </Th>
                ))}
              </THead>
              <tbody>
                {kpis.map((k, i) => {
                  const v = variance(k);
                  const suffix = k.unit === "%" ? "%" : "";
                  return (
                    <Tr key={`${k.name}-${i}`} hover>
                      <Td style={{ ...td, fontWeight: 300 }}>{k.name}</Td>
                      <Td style={{ ...tdRight, fontVariantNumeric: "tabular-nums" }}>
                        {k.target}
                        {suffix}
                      </Td>
                      <Td style={{ ...tdRight, fontVariantNumeric: "tabular-nums" }}>
                        {v ? `${v.actual}${suffix}` : "—"}
                      </Td>
                      <Td
                        style={{
                          ...tdRight,
                          fontVariantNumeric: "tabular-nums",
                          color: v ? (v.onTrack ? "#067647" : "#D92D20") : tokens.textSub,
                        }}
                      >
                        {v ? `${v.pct >= 0 ? "+" : ""}${v.pct.toFixed(1)}%` : "—"}
                      </Td>
                      <Td style={td}>
                        {v ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              background: v.onTrack ? "#ECFDF3" : "#FEF3F2",
                              color: v.onTrack ? "#067647" : "#D92D20",
                              fontSize: 11,
                              fontWeight: 100,
                              padding: "3px 10px",
                              borderRadius: 999,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 999,
                                background: v.onTrack ? "#067647" : "#D92D20",
                              }}
                            />
                            {v.onTrack ? "On track" : "Off track"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: tokens.textSub }}>No data</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableCard>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add KPI"
        footer={
          <>
            <Button variant="danger" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={addKpi}>
              Save
            </Button>
          </>
        }
      >
        <MField label="KPI Name">
          <MInput
            value={nk.name}
            onChange={(e) => setNk({ ...nk, name: e.target.value })}
            placeholder="e.g. Cost-to-Income Ratio"
          />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Target">
            <MInput
              type="number"
              value={nk.target}
              onChange={(e) => setNk({ ...nk, target: e.target.value })}
              placeholder="e.g. 10"
            />
          </MField>
          <MField label="Unit">
            <MSelect
              value={nk.unit}
              onChange={(e) => setNk({ ...nk, unit: e.target.value })}
              options={UNITS}
            />
          </MField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Capture Frequency">
            <MSelect
              value={nk.frequency}
              onChange={(e) => setNk({ ...nk, frequency: e.target.value })}
              options={FREQUENCIES}
            />
          </MField>
          <MField label="Better when">
            <MSelect
              value={nk.direction}
              onChange={(e) => setNk({ ...nk, direction: e.target.value as Direction })}
              options={[...DIRECTIONS]}
            />
          </MField>
        </div>
        <MField label="Source">
          <MSelect
            value={nk.source}
            onChange={(e) => setNk({ ...nk, source: e.target.value })}
            options={SOURCES}
          />
        </MField>
      </Modal>
    </div>
  );
}

function ComplianceTab() {
  const REVIEW_CYCLES = ["1 Year", "2 Years", "3 Years", "5 Years"];
  const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
    Draft: { bg: "#EEF1F6", fg: "#5B6A86" },
    "In Approval": { bg: "#FFFBEB", fg: "#B45309" },
    Effective: { bg: "#ECFDF3", fg: "#067647" },
    "Review Due": { bg: "#FEF3F2", fg: "#D92D20" },
    "Under Revision": { bg: "#EEF2FF", fg: "#3B5BDB" },
  };
  const STATUSES = Object.keys(STATUS_STYLES);
  const LIFECYCLE = ["Policy Created", "Approval", "Effective Date", "Review Reminder", "Revision"];

  type Policy = { name: string; reviewCycle: string; status: string; nextReview: string };
  const policy = (
    name: string,
    status = "Effective",
    nextReview = "Jan 2027",
  ): Policy => ({ name, reviewCycle: "2 Years", status, nextReview });
  const [policies, setPolicies] = useState<Policy[]>([
    policy("Governance Policy"),
    policy("Investment Policy"),
    policy("Loan Policy"),
    policy("Savings Policy"),
    policy("Cash Policy", "Review Due", "Aug 2026"),
    policy("Mobile Money Policy", "Draft", "—"),
    policy("IT Policy"),
  ]);

  const blankPolicy: Policy = {
    name: "",
    reviewCycle: "2 Years",
    status: "Draft",
    nextReview: "",
  };
  const [open, setOpen] = useState(false);
  const [np, setNp] = useState<Policy>(blankPolicy);
  const addPolicy = () => {
    if (!np.name.trim()) return;
    setPolicies((p) => [...p, { ...np, name: np.name.trim(), nextReview: np.nextReview || "—" }]);
    setNp(blankPolicy);
    setOpen(false);
  };
  const update = (i: number, patch: Partial<Policy>) =>
    setPolicies((p) => p.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removePolicy = (i: number) => setPolicies((p) => p.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <div
          style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#92400E", fontSize: 13 }}
        >
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Every policy follows a governed lifecycle and is re-reviewed on its cycle. Review
            reminders fire automatically as a policy nears its next-review date.
          </div>
        </div>
        <LayerTag label="Governed" tone="governed" />
      </div>

      <SectionCard title="Policy Lifecycle" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {LIFECYCLE.map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  background: "#EEF3FF",
                  color: tokens.navy,
                  fontSize: 12,
                  fontWeight: 300,
                  padding: "6px 12px",
                  borderRadius: 999,
                }}
              >
                {step}
              </span>
              {i < LIFECYCLE.length - 1 && (
                <span style={{ color: tokens.textMuted, fontSize: 13 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <TableCard
        title="Policy Register"
        actions={
          <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add policy
          </Button>
        }
      >
        <Table>
          <THead>
            {["Policy", "Review Cycle", "Status", "Next Review", ""].map((h, hi) => (
              <Th
                key={h || hi}
                align={hi === 4 ? "right" : "left"}
                style={{ padding: "11px 16px", fontSize: 11, fontWeight: 100, color: "#5B6A86" }}
              >
                {h}
              </Th>
            ))}
          </THead>
          <tbody>
            {policies.map((p, i) => {
              const s = STATUS_STYLES[p.status] ?? STATUS_STYLES.Draft;
              return (
                <Tr key={`${p.name}-${i}`} hover>
                  <Td style={{ ...td, fontWeight: 300 }}>{p.name}</Td>
                  <Td style={td}>
                    <MSelect
                      value={p.reviewCycle}
                      onChange={(e) => update(i, { reviewCycle: e.target.value })}
                      options={REVIEW_CYCLES}
                      style={{ maxWidth: 140 }}
                    />
                  </Td>
                  <Td style={td}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: s.bg,
                        color: s.fg,
                        fontSize: 11,
                        fontWeight: 100,
                        padding: "3px 10px",
                        borderRadius: 999,
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }} />
                      {p.status}
                    </span>
                  </Td>
                  <Td style={tdMuted}>{p.nextReview}</Td>
                  <Td style={tdRight}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={13} />}
                      onClick={() => removePolicy(i)}
                    />
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableCard>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <Button variant="success" onClick={() => toast.success("Compliance settings saved")}>
          Save changes
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Policy"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={addPolicy}>
              Add Policy
            </Button>
          </>
        }
      >
        <MField label="Policy Name">
          <MInput
            value={np.name}
            onChange={(e) => setNp({ ...np, name: e.target.value })}
            placeholder="e.g. Anti-Money Laundering Policy"
          />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Review Cycle">
            <MSelect
              value={np.reviewCycle}
              onChange={(e) => setNp({ ...np, reviewCycle: e.target.value })}
              options={REVIEW_CYCLES}
            />
          </MField>
          <MField label="Status">
            <MSelect
              value={np.status}
              onChange={(e) => setNp({ ...np, status: e.target.value })}
              options={STATUSES}
            />
          </MField>
        </div>
        <MField label="Next Review">
          <MInput
            value={np.nextReview}
            onChange={(e) => setNp({ ...np, nextReview: e.target.value })}
            placeholder="e.g. Jan 2027"
          />
        </MField>
      </Modal>
    </div>
  );
}

function ConfigurationsPage() {
  const [tab, setTab] = useState<TabKey>("policy");

  return (
    <div
      style={{
        background: "#EEF2F8",
        minHeight: "100%",
        padding: "24px 24px 40px",
        fontFamily: FONTS.body,
      }}
    >
      <Link
        to="/cooperative"
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
            backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            pointerEvents: "none",
          }}
        />
        <div style={{ padding: "24px 28px 0", position: "relative" }}>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 22,
              fontWeight: 100,
              color: "#fff",
              margin: 0,
            }}
          >
            Configurations
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "4px 0 18px" }}>
            Configure policy rules, approval workflows, governance, strategic KPIs and common bond
            definitions for the cooperative.
          </p>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
            {TAB_GROUPS.map((g) => (
              <div key={g}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 100,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    paddingLeft: 8,
                    marginBottom: 5,
                  }}
                >
                  {g}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {TABS.filter((t) => t.group === g).map((t) => {
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
                          fontWeight: 100,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontFamily: FONTS.body,
                          transition: "background 120ms",
                          whiteSpace: "nowrap",
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
            ))}
          </div>
        </div>
      </div>

      {tab === "policy" && <PolicyEngineTab />}
      {tab === "matrix" && <ApprovalMatrixTab />}
      {tab === "bonds" && <CommonBondsTab />}
      {tab === "governance" && <GovernanceSettingsTab />}
      {tab === "strategic" && <StrategicPlanTab />}
      {tab === "compliance" && <ComplianceTab />}
    </div>
  );
}
