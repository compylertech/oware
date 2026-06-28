import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  FileText,
  Briefcase,
  BellRing,
  ShieldAlert,
  Info,
} from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MTextarea, MSelect } from "@/components/common/Modal";
import { Button, Table, TableCard, Td, Th, THead, Tr } from "@/components/patterns";
import {
  ALERT_TYPES,
  INSTITUTION_TYPES,
  RISK_RATINGS,
  fmtGHS2,
  institutionName,
  nextProposalStatus,
  useInstitutions,
  useProposals,
  usePositions,
  useMaturityAlerts,
  useExposureSnapshots,
  addInstitution,
  approveInstitution,
  suspendInstitution,
  removeInstitution,
  addProposal,
  advanceProposal,
  rejectProposal,
  addPosition,
  maturePosition,
  closePosition,
  addMaturityAlert,
  markAlertSent,
  acknowledgeAlert,
  addExposureSnapshot,
  type InstitutionRiskRating,
  type MaturityAlertType,
} from "@/api/investments";

export const Route = createFileRoute("/_auth/cooperative/investments")({
  component: InvestmentsPage,
});

type TabKey = "institutions" | "proposals" | "positions" | "alerts" | "exposure";

const TABS: { key: TabKey; label: string; icon: typeof Building2 }[] = [
  { key: "institutions", label: "Institutions", icon: Building2 },
  { key: "proposals", label: "Proposals", icon: FileText },
  { key: "positions", label: "Positions", icon: Briefcase },
  { key: "alerts", label: "Maturity Alerts", icon: BellRing },
  { key: "exposure", label: "Exposure", icon: ShieldAlert },
];

// ---------- shared styling ----------
const td: React.CSSProperties = { padding: "13px 16px", fontSize: 13, color: tokens.text };
const tdMuted: React.CSSProperties = { ...td, color: tokens.textSub };
const tdNum: React.CSSProperties = { ...td, fontVariantNumeric: "tabular-nums" };
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };
const th11: React.CSSProperties = {
  padding: "11px 16px",
  fontSize: 11,
  fontWeight: 100,
  color: "#5B6A86",
};

const COLORS: Record<string, { bg: string; fg: string }> = {
  APPROVED: { bg: "#ECFDF3", fg: "#067647" },
  PLACED: { bg: "#ECFDF3", fg: "#067647" },
  ACKNOWLEDGED: { bg: "#ECFDF3", fg: "#067647" },
  LOW: { bg: "#ECFDF3", fg: "#067647" },
  PENDING_APPROVAL: { bg: "#FFFBEB", fg: "#B45309" },
  MATURED: { bg: "#FFFBEB", fg: "#B45309" },
  MEDIUM: { bg: "#FFFBEB", fg: "#B45309" },
  PENDING: { bg: "#FFFBEB", fg: "#B45309" },
  MATURITY_DUE: { bg: "#FFFBEB", fg: "#B45309" },
  TREASURER_REVIEW: { bg: "#EEF2FF", fg: "#3B5BDB" },
  RISK_REVIEW: { bg: "#EEF2FF", fg: "#3B5BDB" },
  BOARD_APPROVAL: { bg: "#EEF2FF", fg: "#3B5BDB" },
  SENT: { bg: "#EEF2FF", fg: "#3B5BDB" },
  ROLLED_OVER: { bg: "#EEF2FF", fg: "#3B5BDB" },
  SUSPENDED: { bg: "#FEF3F2", fg: "#D92D20" },
  REJECTED: { bg: "#FEF3F2", fg: "#D92D20" },
  HIGH: { bg: "#FEF3F2", fg: "#D92D20" },
  OVERDUE: { bg: "#FEF3F2", fg: "#D92D20" },
  PROHIBITED: { bg: "#FEE4E2", fg: "#912018" },
  DRAFT: { bg: "#EEF1F6", fg: "#5B6A86" },
  CLOSED: { bg: "#EEF1F6", fg: "#5B6A86" },
  CANCELLED: { bg: "#EEF1F6", fg: "#5B6A86" },
};

const humanize = (s: string) =>
  s
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

function Tag({ value }: { value: string }) {
  const c = COLORS[value] ?? { bg: "#EEF1F6", fg: "#5B6A86" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 100,
        padding: "3px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg }} />
      {humanize(value)}
    </span>
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "#EEF2FF",
        border: "1px solid #D6E2FF",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 16,
        color: "#1E3A8A",
        fontSize: 13,
      }}
    >
      <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
      <div>{children}</div>
    </div>
  );
}

const fmtDate = (v: string) => (v ? v : "—");

function HeaderRow({ headers, rightFrom }: { headers: string[]; rightFrom?: number }) {
  return (
    <THead>
      {headers.map((h, i) => (
        <Th key={h || i} align={rightFrom != null && i >= rightFrom ? "right" : "left"} style={th11}>
          {h}
        </Th>
      ))}
    </THead>
  );
}

function GhostAction({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: danger ? "#D92D20" : "#002663",
        fontSize: 13,
        fontWeight: 300,
        cursor: "pointer",
        padding: 0,
      }}
    >
      {label}
    </button>
  );
}

// =====================================================================
// Institutions
// =====================================================================
function InstitutionsTab() {
  const rows = useInstitutions();
  const blank = {
    name: "",
    institutionType: INSTITUTION_TYPES[0],
    riskRating: "LOW" as InstitutionRiskRating,
  };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(blank);
  const add = () => {
    if (!f.name.trim()) return;
    addInstitution(f);
    setF(blank);
    setOpen(false);
  };

  return (
    <div>
      <InfoBanner>
        Counterparties the cooperative is allowed to invest with. New institutions start as{" "}
        <strong>Pending approval</strong>; prohibited-risk institutions cannot be approved.
      </InfoBanner>
      <TableCard
        title="Investment Institutions"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add institution
          </Button>
        }
      >
        <Table>
          <HeaderRow headers={["Institution", "Type", "Risk", "Status", "Approval Ref", ""]} rightFrom={5} />
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{r.name}</Td>
                <Td style={tdMuted}>{r.institutionType}</Td>
                <Td style={td}>
                  <Tag value={r.riskRating} />
                </Td>
                <Td style={td}>
                  <Tag value={r.status} />
                </Td>
                <Td style={tdMuted}>{r.approvalReference ?? "—"}</Td>
                <Td style={tdRight}>
                  <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
                    {r.status === "PENDING_APPROVAL" && r.riskRating !== "PROHIBITED" && (
                      <GhostAction label="Approve" onClick={() => approveInstitution(r.id)} />
                    )}
                    {r.status !== "SUSPENDED" && r.status !== "CLOSED" && (
                      <GhostAction label="Suspend" danger onClick={() => suspendInstitution(r.id)} />
                    )}
                    <button
                      onClick={() => removeInstitution(r.id)}
                      aria-label="Remove"
                      style={{ background: "none", border: "none", color: "#5B6A86", cursor: "pointer", padding: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Institution"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={add}>
              Add Institution
            </Button>
          </>
        }
      >
        <MField label="Institution Name">
          <MInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. CalBank" />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Institution Type">
            <MSelect value={f.institutionType} onChange={(e) => setF({ ...f, institutionType: e.target.value })} options={INSTITUTION_TYPES} />
          </MField>
          <MField label="Risk Rating">
            <MSelect
              value={f.riskRating}
              onChange={(e) => setF({ ...f, riskRating: e.target.value as InstitutionRiskRating })}
              options={RISK_RATINGS}
            />
          </MField>
        </div>
      </Modal>
    </div>
  );
}

// =====================================================================
// Proposals
// =====================================================================
function ProposalsTab() {
  const rows = useProposals();
  const institutions = useInstitutions();
  const instNames = institutions.map((i) => i.name);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(() => ({
    institution: institutions[0]?.name ?? "",
    principalAmount: "",
    interestRate: "",
    placement: "",
    maturity: "",
    purpose: "",
  }));
  const reset = () =>
    setF({
      institution: institutions[0]?.name ?? "",
      principalAmount: "",
      interestRate: "",
      placement: "",
      maturity: "",
      purpose: "",
    });
  const add = () => {
    const institutionId = institutions.find((i) => i.name === f.institution)?.id;
    if (!institutionId || !f.principalAmount || !f.placement || !f.maturity || !f.purpose.trim()) return;
    addProposal({
      institutionId,
      principalAmount: parseFloat(f.principalAmount),
      interestRate: parseFloat(f.interestRate) || 0,
      proposedPlacementDate: f.placement,
      proposedMaturityDate: f.maturity,
      purpose: f.purpose,
    });
    reset();
    setOpen(false);
  };

  return (
    <div>
      <InfoBanner>
        Investment requests routed through <strong>Treasurer → Risk → Board approval</strong> before
        they can be placed.
      </InfoBanner>
      <TableCard
        title="Investment Proposals"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            New proposal
          </Button>
        }
      >
        <Table>
          <HeaderRow headers={["Institution", "Principal", "Rate", "Placement", "Maturity", "Status", ""]} rightFrom={6} />
          <tbody>
            {rows.map((r) => {
              const next = nextProposalStatus(r.status);
              const terminal = r.status === "REJECTED" || r.status === "PLACED";
              return (
                <Tr key={r.id} hover>
                  <Td style={{ ...td, fontWeight: 300 }}>{institutionName(r.institutionId)}</Td>
                  <Td style={tdNum}>{fmtGHS2(r.principalAmount)}</Td>
                  <Td style={tdNum}>{r.interestRate}%</Td>
                  <Td style={tdMuted}>{fmtDate(r.proposedPlacementDate)}</Td>
                  <Td style={tdMuted}>{fmtDate(r.proposedMaturityDate)}</Td>
                  <Td style={td}>
                    <Tag value={r.status} />
                  </Td>
                  <Td style={tdRight}>
                    <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
                      {next && <GhostAction label={`→ ${humanize(next)}`} onClick={() => advanceProposal(r.id)} />}
                      {!terminal && <GhostAction label="Reject" danger onClick={() => rejectProposal(r.id)} />}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Proposal"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={add}>
              Save Proposal
            </Button>
          </>
        }
      >
        <MField label="Institution">
          <MSelect value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} options={instNames} />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Principal Amount (GH₵)">
            <MInput type="number" value={f.principalAmount} onChange={(e) => setF({ ...f, principalAmount: e.target.value })} placeholder="500000" />
          </MField>
          <MField label="Interest Rate (%)">
            <MInput type="number" value={f.interestRate} onChange={(e) => setF({ ...f, interestRate: e.target.value })} placeholder="21.5" />
          </MField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Proposed Placement Date">
            <MInput type="date" value={f.placement} onChange={(e) => setF({ ...f, placement: e.target.value })} />
          </MField>
          <MField label="Proposed Maturity Date">
            <MInput type="date" value={f.maturity} onChange={(e) => setF({ ...f, maturity: e.target.value })} />
          </MField>
        </div>
        <MField label="Purpose">
          <MTextarea rows={2} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="e.g. 182-day fixed deposit" />
        </MField>
      </Modal>
    </div>
  );
}

// =====================================================================
// Positions
// =====================================================================
function PositionsTab() {
  const rows = usePositions();
  const institutions = useInstitutions();
  const instNames = institutions.map((i) => i.name);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(() => ({
    institution: institutions[0]?.name ?? "",
    principalAmount: "",
    interestRate: "",
    placement: "",
    maturity: "",
    glAccount: "",
  }));
  const reset = () =>
    setF({
      institution: institutions[0]?.name ?? "",
      principalAmount: "",
      interestRate: "",
      placement: "",
      maturity: "",
      glAccount: "",
    });
  const add = () => {
    const institutionId = institutions.find((i) => i.name === f.institution)?.id;
    const gl = parseInt(f.glAccount, 10);
    if (!institutionId || !f.principalAmount || !f.placement || !f.maturity || !Number.isFinite(gl)) return;
    addPosition({
      institutionId,
      principalAmount: parseFloat(f.principalAmount),
      interestRate: parseFloat(f.interestRate) || 0,
      placementDate: f.placement,
      maturityDate: f.maturity,
      linkedGlAccountId: gl,
    });
    reset();
    setOpen(false);
  };

  return (
    <div>
      <InfoBanner>
        Active and historical placements, each linked to a GL account. Placed investments can be
        marked <strong>matured</strong> and then <strong>closed</strong>.
      </InfoBanner>
      <TableCard
        title="Investment Positions"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Record position
          </Button>
        }
      >
        <Table>
          <HeaderRow headers={["Institution", "Principal", "Rate", "Placement", "Maturity", "GL Account", "Status", ""]} rightFrom={7} />
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{institutionName(r.institutionId)}</Td>
                <Td style={tdNum}>{fmtGHS2(r.principalAmount)}</Td>
                <Td style={tdNum}>{r.interestRate}%</Td>
                <Td style={tdMuted}>{fmtDate(r.placementDate)}</Td>
                <Td style={tdMuted}>{fmtDate(r.maturityDate)}</Td>
                <Td style={tdNum}>{r.linkedGlAccountId}</Td>
                <Td style={td}>
                  <Tag value={r.status} />
                </Td>
                <Td style={tdRight}>
                  <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
                    {r.status === "PLACED" && <GhostAction label="Mature" onClick={() => maturePosition(r.id)} />}
                    {(r.status === "PLACED" || r.status === "MATURED") && (
                      <GhostAction label="Close" danger onClick={() => closePosition(r.id)} />
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Position"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={add}>
              Save Position
            </Button>
          </>
        }
      >
        <MField label="Institution">
          <MSelect value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} options={instNames} />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Principal Amount (GH₵)">
            <MInput type="number" value={f.principalAmount} onChange={(e) => setF({ ...f, principalAmount: e.target.value })} placeholder="500000" />
          </MField>
          <MField label="Interest Rate (%)">
            <MInput type="number" value={f.interestRate} onChange={(e) => setF({ ...f, interestRate: e.target.value })} placeholder="21.5" />
          </MField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Placement Date">
            <MInput type="date" value={f.placement} onChange={(e) => setF({ ...f, placement: e.target.value })} />
          </MField>
          <MField label="Maturity Date">
            <MInput type="date" value={f.maturity} onChange={(e) => setF({ ...f, maturity: e.target.value })} />
          </MField>
        </div>
        <MField label="Linked GL Account ID">
          <MInput type="number" value={f.glAccount} onChange={(e) => setF({ ...f, glAccount: e.target.value })} placeholder="e.g. 140101" />
        </MField>
      </Modal>
    </div>
  );
}

// =====================================================================
// Maturity Alerts
// =====================================================================
function AlertsTab() {
  const rows = useMaturityAlerts();
  const positions = usePositions();
  const posLabel = (id: string) => {
    const p = positions.find((x) => x.id === id);
    return p ? `${p.id} · ${institutionName(p.institutionId)}` : id;
  };
  const posOptions = positions.map((p) => posLabel(p.id));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(() => ({
    position: positions[0] ? posLabel(positions[0].id) : "",
    alertDate: "",
    alertType: "MATURITY_30_DAYS" as MaturityAlertType,
  }));
  const add = () => {
    const positionId = positions.find((p) => posLabel(p.id) === f.position)?.id;
    if (!positionId || !f.alertDate) return;
    addMaturityAlert({ investmentPositionId: positionId, alertDate: f.alertDate, alertType: f.alertType });
    setF({ position: positions[0] ? posLabel(positions[0].id) : "", alertDate: "", alertType: "MATURITY_30_DAYS" });
    setOpen(false);
  };

  return (
    <div>
      <InfoBanner>
        Reminders raised as a position approaches maturity. Alerts move{" "}
        <strong>Pending → Sent → Acknowledged</strong>.
      </InfoBanner>
      <TableCard
        title="Maturity Alerts"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            Add alert
          </Button>
        }
      >
        <Table>
          <HeaderRow headers={["Position", "Alert Date", "Type", "Status", ""]} rightFrom={4} />
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{posLabel(r.investmentPositionId)}</Td>
                <Td style={tdMuted}>{fmtDate(r.alertDate)}</Td>
                <Td style={td}>
                  <Tag value={r.alertType} />
                </Td>
                <Td style={td}>
                  <Tag value={r.status} />
                </Td>
                <Td style={tdRight}>
                  <div style={{ display: "inline-flex", gap: 14, alignItems: "center" }}>
                    {r.status === "PENDING" && <GhostAction label="Mark sent" onClick={() => markAlertSent(r.id)} />}
                    {(r.status === "PENDING" || r.status === "SENT") && (
                      <GhostAction label="Acknowledge" onClick={() => acknowledgeAlert(r.id)} />
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Maturity Alert"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={add}>
              Add Alert
            </Button>
          </>
        }
      >
        <MField label="Investment Position">
          <MSelect value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} options={posOptions} />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Alert Date">
            <MInput type="date" value={f.alertDate} onChange={(e) => setF({ ...f, alertDate: e.target.value })} />
          </MField>
          <MField label="Alert Type">
            <MSelect
              value={f.alertType}
              onChange={(e) => setF({ ...f, alertType: e.target.value as MaturityAlertType })}
              options={ALERT_TYPES}
            />
          </MField>
        </div>
      </Modal>
    </div>
  );
}

// =====================================================================
// Exposure monitoring
// =====================================================================
function ExposureTab() {
  const rows = useExposureSnapshots();
  const institutions = useInstitutions();
  const instNames = institutions.map((i) => i.name);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(() => ({
    institution: institutions[0]?.name ?? "",
    exposureAmount: "",
    totalInvestments: "",
    allowedPercent: "",
  }));
  const add = () => {
    const institutionId = institutions.find((i) => i.name === f.institution)?.id;
    if (!institutionId || !f.exposureAmount || !f.totalInvestments || !f.allowedPercent) return;
    addExposureSnapshot({
      institutionId,
      institutionExposureAmount: parseFloat(f.exposureAmount),
      totalInvestmentsAmount: parseFloat(f.totalInvestments),
      allowedPercent: parseFloat(f.allowedPercent),
    });
    setF({ institution: institutions[0]?.name ?? "", exposureAmount: "", totalInvestments: "", allowedPercent: "" });
    setOpen(false);
  };
  const breaches = rows.filter((r) => r.breach).length;

  return (
    <div>
      <InfoBanner>
        Per-institution concentration vs the allowed limit. A snapshot is a <strong>breach</strong>{" "}
        when exposure&nbsp;% exceeds the allowed&nbsp;%.
      </InfoBanner>
      <TableCard
        title="Exposure Snapshots"
        description={breaches > 0 ? `${breaches} institution${breaches > 1 ? "s" : ""} in breach` : "All within limits"}
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
            New snapshot
          </Button>
        }
      >
        <Table>
          <HeaderRow headers={["Institution", "Exposure", "Total", "Exposure %", "Allowed %", "Breach"]} rightFrom={3} />
          <tbody>
            {rows.map((r) => (
              <Tr key={r.id} hover>
                <Td style={{ ...td, fontWeight: 300 }}>{institutionName(r.institutionId)}</Td>
                <Td style={tdNum}>{fmtGHS2(r.institutionExposureAmount)}</Td>
                <Td style={tdNum}>{fmtGHS2(r.totalInvestmentsAmount)}</Td>
                <Td style={{ ...tdNum, textAlign: "right", color: r.breach ? "#D92D20" : tokens.text }}>
                  {r.exposurePercent.toFixed(2)}%
                </Td>
                <Td style={{ ...tdNum, textAlign: "right" }}>{r.allowedPercent}%</Td>
                <Td style={tdRight}>
                  <Tag value={r.breach ? "OVERDUE" : "APPROVED"} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Exposure Snapshot"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={add}>
              Calculate
            </Button>
          </>
        }
      >
        <MField label="Institution">
          <MSelect value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} options={instNames} />
        </MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <MField label="Institution Exposure (GH₵)">
            <MInput type="number" value={f.exposureAmount} onChange={(e) => setF({ ...f, exposureAmount: e.target.value })} placeholder="500000" />
          </MField>
          <MField label="Total Investments (GH₵)">
            <MInput type="number" value={f.totalInvestments} onChange={(e) => setF({ ...f, totalInvestments: e.target.value })} placeholder="2000000" />
          </MField>
        </div>
        <MField label="Allowed Percent (%)">
          <MInput type="number" value={f.allowedPercent} onChange={(e) => setF({ ...f, allowedPercent: e.target.value })} placeholder="30" />
        </MField>
      </Modal>
    </div>
  );
}

// =====================================================================
// Page shell
// =====================================================================
function InvestmentsPage() {
  const [tab, setTab] = useState<TabKey>("institutions");

  return (
    <div style={{ background: "#EEF2F8", minHeight: "100%", padding: "24px 24px 40px", fontFamily: FONTS.body }}>
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
        <div style={{ height: 3, background: "linear-gradient(90deg, #1a4080, #002663, #1a4080)" }} />
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
          <h1 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 100, color: "#fff", margin: 0 }}>
            Investments
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "4px 0 18px" }}>
            Record approved institutions, proposals, placements, maturity alerts and concentration
            exposure for the cooperative's investment portfolio.
          </p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: active ? "#EEF2F8" : "transparent",
                    color: active ? tokens.navy : "rgba(255,255,255,0.55)",
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
                    whiteSpace: "nowrap",
                    transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
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

      {tab === "institutions" && <InstitutionsTab />}
      {tab === "proposals" && <ProposalsTab />}
      {tab === "positions" && <PositionsTab />}
      {tab === "alerts" && <AlertsTab />}
      {tab === "exposure" && <ExposureTab />}
    </div>
  );
}
