import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  FileText,
  Plus,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Tabs, Pill } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/cooperative/governance")({
  component: GovernancePage,
});

// ---------- Types ----------
type MeetingType = "AGM" | "Board" | "Committee" | "Special";
type MeetingStatus = "Scheduled" | "Completed" | "Cancelled";

type Meeting = {
  id: string;
  title: string;
  type: MeetingType;
  date: string;
  location: string;
  chair: string;
  attendance: number | null;
  eligible: number;
  quorumRequired: number;
  status: MeetingStatus;
  agendaItems: number;
  resolutions: number;
};

type ResolutionStatus = "Passed" | "Rejected" | "Tabled" | "Pending";
type ResolutionCategory = "Policy" | "Financial" | "Membership" | "Governance";

type Resolution = {
  id: string;
  reference: string;
  title: string;
  meeting: string;
  category: ResolutionCategory;
  date: string;
  votesFor: number;
  votesAgainst: number;
  abstain: number;
  governedChange?: string;
  status: ResolutionStatus;
};

// ---------- Mock data ----------
const SEED_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "2026 Annual General Meeting",
    type: "AGM",
    date: "28 Mar 2026",
    location: "Accra International Conference Centre",
    chair: "D. Quaidoo",
    attendance: 412,
    eligible: 1840,
    quorumRequired: 120,
    status: "Completed",
    agendaItems: 9,
    resolutions: 5,
  },
  {
    id: "m2",
    title: "Q2 Board Meeting",
    type: "Board",
    date: "14 May 2026",
    location: "Head Office Boardroom",
    chair: "A. Owusu",
    attendance: 9,
    eligible: 9,
    quorumRequired: 7,
    status: "Completed",
    agendaItems: 5,
    resolutions: 3,
  },
  {
    id: "m3",
    title: "Credit Committee — June",
    type: "Committee",
    date: "18 Jun 2026",
    location: "Head Office Room 2",
    chair: "K. Asante",
    attendance: 6,
    eligible: 6,
    quorumRequired: 4,
    status: "Completed",
    agendaItems: 3,
    resolutions: 2,
  },
  {
    id: "m4",
    title: "Special Resolution — Bylaw Amendment",
    type: "Special",
    date: "09 Jul 2026",
    location: "Virtual (Zoom)",
    chair: "D. Quaidoo",
    attendance: null,
    eligible: 400,
    quorumRequired: 200,
    status: "Scheduled",
    agendaItems: 2,
    resolutions: 1,
  },
  {
    id: "m5",
    title: "Q3 Board Meeting",
    type: "Board",
    date: "13 Aug 2026",
    location: "Head Office Boardroom",
    chair: "A. Owusu",
    attendance: null,
    eligible: 9,
    quorumRequired: 7,
    status: "Scheduled",
    agendaItems: 4,
    resolutions: 0,
  },
];

const SEED_RESOLUTIONS: Resolution[] = [
  {
    id: "r1",
    reference: "AGM/2026/01",
    title: "Approve 2025 audited financial statements",
    meeting: "2026 AGM",
    category: "Financial",
    date: "28 Mar 2026",
    votesFor: 398,
    votesAgainst: 6,
    abstain: 8,
    status: "Passed",
  },
  {
    id: "r2",
    reference: "AGM/2026/02",
    title: "Declare 8.5% dividend on members' shares",
    meeting: "2026 AGM",
    category: "Financial",
    date: "28 Mar 2026",
    votesFor: 405,
    votesAgainst: 4,
    abstain: 3,
    governedChange: "Dividend rate → 8.5%",
    status: "Passed",
  },
  {
    id: "r3",
    reference: "AGM/2026/03",
    title: "Raise minimum share holding to 100 shares",
    meeting: "2026 AGM",
    category: "Membership",
    date: "28 Mar 2026",
    votesFor: 351,
    votesAgainst: 47,
    abstain: 14,
    governedChange: "Min. share holding → 100",
    status: "Passed",
  },
  {
    id: "r4",
    reference: "AGM/2026/04",
    title: "Re-elect three board directors",
    meeting: "2026 AGM",
    category: "Governance",
    date: "28 Mar 2026",
    votesFor: 372,
    votesAgainst: 22,
    abstain: 18,
    status: "Passed",
  },
  {
    id: "r5",
    reference: "AGM/2026/05",
    title: "Increase board sitting allowance",
    meeting: "2026 AGM",
    category: "Governance",
    date: "28 Mar 2026",
    votesFor: 0,
    votesAgainst: 0,
    abstain: 0,
    status: "Tabled",
  },
  {
    id: "r6",
    reference: "BRD/2026/14",
    title: "Approve loan loss provision of GH₵ 240,000",
    meeting: "Q2 Board Meeting",
    category: "Financial",
    date: "14 May 2026",
    votesFor: 8,
    votesAgainst: 1,
    abstain: 0,
    status: "Passed",
  },
  {
    id: "r7",
    reference: "BRD/2026/15",
    title: "Raise single-borrower exposure cap to GH₵ 150k",
    meeting: "Q2 Board Meeting",
    category: "Policy",
    date: "14 May 2026",
    votesFor: 7,
    votesAgainst: 2,
    abstain: 0,
    governedChange: "Exposure cap → GH₵ 150,000",
    status: "Passed",
  },
  {
    id: "r8",
    reference: "BRD/2026/16",
    title: "Adopt revised arrears classification",
    meeting: "Q2 Board Meeting",
    category: "Policy",
    date: "14 May 2026",
    votesFor: 3,
    votesAgainst: 6,
    abstain: 0,
    status: "Rejected",
  },
];

// ---------- Styling maps ----------
const TYPE_STYLE: Record<MeetingType, { bg: string; fg: string }> = {
  AGM: { bg: "#F5F3FF", fg: "#7C3AED" },
  Board: { bg: "#EEF2FF", fg: "#3B5BDB" },
  Committee: { bg: "#ECFDF5", fg: "#059669" },
  Special: { bg: "#FFFBEB", fg: "#B45309" },
};

const CATEGORY_STYLE: Record<ResolutionCategory, { bg: string; fg: string }> = {
  Policy: { bg: "#FFFBEB", fg: "#B45309" },
  Financial: { bg: "#ECFDF5", fg: "#059669" },
  Membership: { bg: "#EEF2FF", fg: "#3B5BDB" },
  Governance: { bg: "#F5F3FF", fg: "#7C3AED" },
};

// ---------- Small components ----------
function TypePill({ type }: { type: MeetingType }) {
  const s = TYPE_STYLE[type];
  return (
    <Pill color={s.fg} bg={s.bg} uppercase>
      {type}
    </Pill>
  );
}

function CategoryPill({ cat }: { cat: ResolutionCategory }) {
  const s = CATEGORY_STYLE[cat];
  return (
    <Pill color={s.fg} bg={s.bg} uppercase>
      {cat}
    </Pill>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#EEF3FF" : "#fff",
        color: active ? tokens.navy : tokens.textSub,
        border: `1px solid ${active ? tokens.navy : tokens.border}`,
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: FONTS.body,
      }}
    >
      {children}
    </button>
  );
}

function IconToggle({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "grid",
        placeItems: "center",
        background: active ? "#EEF3FF" : "#fff",
        color: active ? tokens.navy : tokens.textSub,
        border: `1px solid ${active ? tokens.navy : tokens.border}`,
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function NavyButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: tokens.navy,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "7px 14px",
        fontSize: 13,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontFamily: FONTS.body,
      }}
    >
      {children}
    </button>
  );
}

function OutlineButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#fff",
        color: tokens.text,
        border: `1px solid ${tokens.border}`,
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontFamily: FONTS.body,
      }}
    >
      {children}
    </button>
  );
}

// ---------- Quorum bar ----------
function QuorumBar({
  attendance,
  eligible,
  quorumRequired,
}: {
  attendance: number | null;
  eligible: number;
  quorumRequired: number;
}) {
  const att = attendance ?? 0;
  const pct = eligible > 0 ? Math.min(100, (att / eligible) * 100) : 0;
  const markerPct = eligible > 0 ? Math.min(100, (quorumRequired / eligible) * 100) : 0;
  const met = attendance !== null && attendance >= quorumRequired;
  const fillColor = attendance === null ? tokens.border : met ? "#067647" : "#B45309";
  const textColor = attendance === null ? tokens.textMuted : met ? "#067647" : "#B45309";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div
        style={{
          position: "relative",
          width: 120,
          height: 8,
          background: "#EEF1F6",
          borderRadius: 999,
          overflow: "visible",
        }}
      >
        <div
          style={{ width: `${pct}%`, height: "100%", background: fillColor, borderRadius: 999 }}
        />
        <div
          style={{
            position: "absolute",
            left: `${markerPct}%`,
            top: -2,
            width: 2,
            height: 12,
            background: tokens.navy,
            transform: "translateX(-1px)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: textColor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {attendance ?? "—"} / {eligible}
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 999,
          background: attendance === null ? "#F2F4F7" : met ? "#ECFDF3" : "#FFFBEB",
          color: textColor,
        }}
      >
        {attendance === null ? "Awaiting" : met ? "Quorum met" : "No quorum"}
      </span>
    </div>
  );
}

// ---------- Vote bar ----------
function VoteBar({ f, a, ab }: { f: number; a: number; ab: number }) {
  const total = f + a + ab;
  const fp = total ? (f / total) * 100 : 0;
  const ap = total ? (a / total) * 100 : 0;
  const abp = total ? (ab / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div
        style={{
          width: 130,
          height: 8,
          background: "#EEF1F6",
          borderRadius: 999,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div style={{ width: `${fp}%`, background: "#067647" }} />
        <div style={{ width: `${ap}%`, background: "#D92D20" }} />
        <div style={{ width: `${abp}%`, background: "#9AA4B8" }} />
      </div>
      <div style={{ fontSize: 12, color: tokens.textSub, fontVariantNumeric: "tabular-nums" }}>
        <span style={{ color: "#067647", fontWeight: 700 }}>{f} for</span>
        {" · "}
        <span style={{ color: "#D92D20", fontWeight: 700 }}>{a} against</span>
        {" · "}
        <span style={{ color: tokens.textMuted }}>{ab} abstain</span>
      </div>
    </div>
  );
}

// ---------- Modal ----------
function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,24,68,0.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${tokens.border}`,
          maxWidth: 540,
          width: "100%",
          boxShadow: "none",
          fontFamily: FONTS.body,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${tokens.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 15,
                fontWeight: 700,
                color: tokens.text,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: tokens.textMuted,
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${tokens.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: tokens.textMuted,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `1px solid ${tokens.border}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: FONTS.body,
  color: tokens.text,
  outline: "none",
  background: "#fff",
};

// ---------- Page ----------
function GovernancePage() {
  const [tab, setTab] = useState<"Meetings" | "Resolutions">("Meetings");

  // Meetings state
  const [meetings, setMeetings] = useState<Meeting[]>(SEED_MEETINGS);
  const [mFilter, setMFilter] = useState<"All" | "Scheduled" | "Completed">("All");
  const [mView, setMView] = useState<"card" | "table">("card");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["m1", "m2"]));
  const [meetingModal, setMeetingModal] = useState<{
    mode: "create" | "edit";
    data: Partial<Meeting>;
  } | null>(null);

  // Resolutions state
  const [resolutions, setResolutions] = useState<Resolution[]>(SEED_RESOLUTIONS);
  const [rFilter, setRFilter] = useState<"All" | "Passed" | "Pending" | "Changed config">("All");
  const [rView, setRView] = useState<"card" | "table">("card");
  const [resModal, setResModal] = useState<{ mode: "create"; data: Partial<Resolution> } | null>(
    null,
  );

  const upcomingCount = meetings.filter((m) => m.status === "Scheduled").length;
  const changedConfigCount = resolutions.filter((r) => r.governedChange).length;

  const filteredMeetings = meetings.filter((m) => {
    if (mFilter === "All") return true;
    return m.status === mFilter;
  });

  const filteredResolutions = resolutions.filter((r) => {
    if (rFilter === "All") return true;
    if (rFilter === "Changed config") return !!r.governedChange;
    return r.status === rFilter;
  });

  function toggleExpand(id: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submitMeeting(form: Meeting) {
    if (meetingModal?.mode === "edit") {
      setMeetings((arr) => arr.map((m) => (m.id === form.id ? form : m)));
    } else {
      setMeetings((arr) => [...arr, { ...form, id: `m${Date.now()}` }]);
    }
    setMeetingModal(null);
  }

  function submitResolution(form: Resolution) {
    setResolutions((arr) => [...arr, { ...form, id: `r${Date.now()}` }]);
    setResModal(null);
  }

  return (
    <div
      style={{
        background: tokens.bg,
        minHeight: "100%",
        padding: "24px 28px",
        fontFamily: FONTS.body,
      }}
    >
      <div>
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

        {/* Header */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}
          >
            COOPERATIVE
          </div>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 26,
              fontWeight: 800,
              color: tokens.text,
              margin: "6px 0 6px",
            }}
          >
            Governance
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 13, margin: 0 }}>
            Meetings, quorum and resolutions of the cooperative.
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          style={{ marginTop: 22 }}
          value={tab}
          onChange={setTab}
          items={[
            { key: "Meetings", label: "Meetings" },
            { key: "Resolutions", label: "Resolutions" },
          ]}
        />

        {tab === "Meetings" ? (
          <>
            {/* Meetings toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 18,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <FilterPill active={mFilter === "All"} onClick={() => setMFilter("All")}>
                  All meetings
                </FilterPill>
                <FilterPill
                  active={mFilter === "Scheduled"}
                  onClick={() => setMFilter("Scheduled")}
                >
                  Scheduled
                </FilterPill>
                <FilterPill
                  active={mFilter === "Completed"}
                  onClick={() => setMFilter("Completed")}
                >
                  Completed
                </FilterPill>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: tokens.textMuted }}>
                  {upcomingCount} upcoming
                </span>
                <IconToggle
                  title="Card view"
                  active={mView === "card"}
                  onClick={() => setMView("card")}
                >
                  <LayoutGrid size={14} />
                </IconToggle>
                <IconToggle
                  title="Table view"
                  active={mView === "table"}
                  onClick={() => setMView("table")}
                >
                  <List size={14} />
                </IconToggle>
                <NavyButton
                  onClick={() =>
                    setMeetingModal({
                      mode: "create",
                      data: { type: "Board", status: "Scheduled" },
                    })
                  }
                >
                  <Plus size={14} /> Schedule meeting
                </NavyButton>
              </div>
            </div>

            {mView === "card" ? (
              <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {filteredMeetings.map((m) => {
                  const ts = TYPE_STYLE[m.type];
                  const isOpen = expanded.has(m.id);
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "#fff",
                        border: `1px solid ${tokens.border}`,
                        borderRadius: 14,
                        overflow: "hidden",
                      }}
                    >
                      {/* Header row */}
                      <div
                        onClick={() => toggleExpand(m.id)}
                        style={{
                          padding: "15px 18px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: ts.bg,
                            color: ts.fg,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Calendar size={20} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text }}>
                              {m.title}
                            </div>
                            <TypePill type={m.type} />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 14,
                              marginTop: 4,
                              color: tokens.textMuted,
                              fontSize: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Calendar size={12} /> {m.date}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <MapPin size={12} /> {m.location}
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Users size={12} /> Chair: {m.chair}
                            </span>
                          </div>
                        </div>
                        <StatusPill status={m.status} />
                        <ChevronDown
                          size={18}
                          color={tokens.textMuted}
                          style={{
                            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                            transition: "transform 0.15s",
                          }}
                        />
                      </div>

                      {isOpen && (
                        <div
                          style={{
                            background: "#FAFBFD",
                            borderTop: `1px solid ${tokens.border}`,
                            padding: "16px 18px",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 24,
                          }}
                        >
                          <div>
                            <div style={{ ...labelStyle, fontSize: 10 }}>Quorum & Attendance</div>
                            <QuorumBar
                              attendance={m.attendance}
                              eligible={m.eligible}
                              quorumRequired={m.quorumRequired}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 20,
                              alignItems: "center",
                              justifyContent: "flex-end",
                            }}
                          >
                            <div>
                              <div style={{ ...labelStyle, fontSize: 10 }}>Agenda items</div>
                              <div
                                style={{
                                  fontFamily: FONTS.display,
                                  fontSize: 18,
                                  fontWeight: 800,
                                  color: tokens.text,
                                }}
                              >
                                {m.agendaItems}
                              </div>
                            </div>
                            <div>
                              <div style={{ ...labelStyle, fontSize: 10 }}>Resolutions</div>
                              <div
                                style={{
                                  fontFamily: FONTS.display,
                                  fontSize: 18,
                                  fontWeight: 800,
                                  color: tokens.text,
                                }}
                              >
                                {m.resolutions}
                              </div>
                            </div>
                            <OutlineButton>
                              <FileText size={12} />{" "}
                              {m.status === "Completed" ? "View minutes" : "View agenda"}
                            </OutlineButton>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16,
                  background: "#fff",
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}
                >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${tokens.navy}` }}>
                      {["Meeting", "Type", "Date", "Location", "Quorum", "Status", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "11px 16px",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: "#7A879F",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.map((m) => {
                      const met = m.attendance !== null && m.attendance >= m.quorumRequired;
                      const color =
                        m.attendance === null ? tokens.textMuted : met ? "#067647" : "#B45309";
                      return (
                        <tr
                          key={m.id}
                          style={{ borderBottom: `1px solid ${tokens.border}` }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "13px 16px", fontSize: 13 }}>
                            <div style={{ fontWeight: 700, color: tokens.text }}>{m.title}</div>
                            <div
                              style={{
                                fontFamily: FONTS.mono,
                                fontSize: 11,
                                color: "#4A5878",
                                marginTop: 2,
                              }}
                            >
                              {m.id.toUpperCase()}
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <TypePill type={m.type} />
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>
                            {m.date}
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>
                            {m.location}
                          </td>
                          <td
                            style={{
                              padding: "13px 16px",
                              fontSize: 13,
                              fontWeight: 700,
                              color,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {m.attendance ?? "—"} / {m.quorumRequired}
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <StatusPill status={m.status} />
                          </td>
                          <td style={{ padding: "13px 16px", textAlign: "right" }}>
                            <OutlineButton
                              onClick={() => setMeetingModal({ mode: "edit", data: m })}
                            >
                              Edit
                            </OutlineButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Resolutions toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 18,
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <FilterPill active={rFilter === "All"} onClick={() => setRFilter("All")}>
                  All
                </FilterPill>
                <FilterPill active={rFilter === "Passed"} onClick={() => setRFilter("Passed")}>
                  Passed
                </FilterPill>
                <FilterPill active={rFilter === "Pending"} onClick={() => setRFilter("Pending")}>
                  Pending
                </FilterPill>
                <FilterPill
                  active={rFilter === "Changed config"}
                  onClick={() => setRFilter("Changed config")}
                >
                  Changed config ({changedConfigCount})
                </FilterPill>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <IconToggle
                  title="Card view"
                  active={rView === "card"}
                  onClick={() => setRView("card")}
                >
                  <LayoutGrid size={14} />
                </IconToggle>
                <IconToggle
                  title="Table view"
                  active={rView === "table"}
                  onClick={() => setRView("table")}
                >
                  <List size={14} />
                </IconToggle>
                <NavyButton
                  onClick={() =>
                    setResModal({ mode: "create", data: { category: "Policy", status: "Pending" } })
                  }
                >
                  <Plus size={14} /> Table resolution
                </NavyButton>
              </div>
            </div>

            {rView === "card" ? (
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {filteredResolutions.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: "#fff",
                      border: `1px solid ${tokens.border}`,
                      borderRadius: 12,
                      padding: "14px 18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: FONTS.mono,
                              fontSize: 12,
                              color: tokens.navy,
                              fontWeight: 600,
                            }}
                          >
                            {r.reference}
                          </span>
                          <CategoryPill cat={r.category} />
                          <span style={{ fontSize: 12, color: tokens.textMuted }}>{r.date}</span>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: tokens.text,
                            marginTop: 6,
                          }}
                        >
                          {r.title}
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <VoteBar f={r.votesFor} a={r.votesAgainst} ab={r.abstain} />
                        </div>
                        {r.governedChange && (
                          <div
                            style={{
                              marginTop: 10,
                              background: "#FAEEDA",
                              color: "#854F0B",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <SlidersHorizontal size={14} />
                            Applied to governed config: {r.governedChange}
                          </div>
                        )}
                      </div>
                      <StatusPill status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  marginTop: 16,
                  background: "#fff",
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}
                >
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${tokens.navy}` }}>
                      {[
                        "Reference",
                        "Resolution",
                        "Category",
                        "Date",
                        "Votes",
                        "Governed change",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "11px 16px",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: "#7A879F",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResolutions.map((r) => (
                      <tr
                        key={r.id}
                        style={{ borderBottom: `1px solid ${tokens.border}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td
                          style={{
                            padding: "13px 16px",
                            fontFamily: FONTS.mono,
                            fontSize: 12,
                            color: tokens.navy,
                            fontWeight: 600,
                          }}
                        >
                          {r.reference}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            fontSize: 13,
                            fontWeight: 600,
                            color: tokens.text,
                          }}
                        >
                          {r.title}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <CategoryPill cat={r.category} />
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>
                          {r.date}
                        </td>
                        <td
                          style={{
                            padding: "13px 16px",
                            fontSize: 12,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          <span style={{ color: "#067647", fontWeight: 700 }}>{r.votesFor}</span>
                          {" / "}
                          <span style={{ color: "#D92D20", fontWeight: 700 }}>
                            {r.votesAgainst}
                          </span>
                          {" / "}
                          <span style={{ color: tokens.textMuted }}>{r.abstain}</span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 12 }}>
                          {r.governedChange ? (
                            <span
                              style={{
                                color: "#854F0B",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontWeight: 600,
                              }}
                            >
                              <SlidersHorizontal size={12} /> {r.governedChange}
                            </span>
                          ) : (
                            <span style={{ color: tokens.textMuted }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <StatusPill status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Meeting modal */}
      {meetingModal && (
        <MeetingForm
          mode={meetingModal.mode}
          initial={meetingModal.data}
          onCancel={() => setMeetingModal(null)}
          onSubmit={submitMeeting}
        />
      )}

      {resModal && (
        <ResolutionForm
          initial={resModal.data}
          onCancel={() => setResModal(null)}
          onSubmit={submitResolution}
          meetings={meetings.map((m) => m.title)}
        />
      )}
    </div>
  );
}

// ---------- Meeting form ----------
function MeetingForm({
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial: Partial<Meeting>;
  onCancel: () => void;
  onSubmit: (m: Meeting) => void;
}) {
  const [f, setF] = useState<Partial<Meeting>>({
    title: "",
    type: "Board",
    date: "",
    location: "",
    chair: "",
    quorumRequired: 0,
    eligible: 0,
    agendaItems: 0,
    attendance: null,
    resolutions: 0,
    status: "Scheduled",
    ...initial,
  });

  function set<K extends keyof Meeting>(k: K, v: Meeting[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={mode === "create" ? "Schedule Meeting" : "Edit Meeting"}
      subtitle="Set up the meeting details, quorum and agenda count."
      footer={
        <>
          <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
          <NavyButton onClick={() => onSubmit(f as Meeting)}>
            {mode === "create" ? "Schedule Meeting" : "Save Changes"}
          </NavyButton>
        </>
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            value={f.title || ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              style={inputStyle}
              value={f.type}
              onChange={(e) => set("type", e.target.value as MeetingType)}
            >
              {(["AGM", "Board", "Committee", "Special"] as MeetingType[]).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              value={f.date || ""}
              onChange={(e) => set("date", e.target.value)}
              placeholder="e.g. 14 May 2026"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              style={inputStyle}
              value={f.location || ""}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Chair</label>
            <input
              style={inputStyle}
              value={f.chair || ""}
              onChange={(e) => set("chair", e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Quorum required</label>
            <input
              type="number"
              style={inputStyle}
              value={f.quorumRequired ?? 0}
              onChange={(e) => set("quorumRequired", Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Members eligible</label>
            <input
              type="number"
              style={inputStyle}
              value={f.eligible ?? 0}
              onChange={(e) => set("eligible", Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Agenda items</label>
            <input
              type="number"
              style={inputStyle}
              value={f.agendaItems ?? 0}
              onChange={(e) => set("agendaItems", Number(e.target.value))}
            />
          </div>
        </div>
        {mode === "edit" && (
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={f.status}
              onChange={(e) => set("status", e.target.value as MeetingStatus)}
            >
              {(["Scheduled", "Completed", "Cancelled"] as MeetingStatus[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Resolution form ----------
function ResolutionForm({
  initial,
  onCancel,
  onSubmit,
  meetings,
}: {
  initial: Partial<Resolution>;
  onCancel: () => void;
  onSubmit: (r: Resolution) => void;
  meetings: string[];
}) {
  const [f, setF] = useState<Partial<Resolution>>({
    title: "",
    reference: "",
    meeting: meetings[0] || "",
    category: "Policy",
    status: "Pending",
    date: "",
    votesFor: 0,
    votesAgainst: 0,
    abstain: 0,
    governedChange: "",
    ...initial,
  });

  function set<K extends keyof Resolution>(k: K, v: Resolution[K]) {
    setF((s) => ({ ...s, [k]: v }));
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Table Resolution"
      subtitle="Record a new resolution and its vote outcome."
      footer={
        <>
          <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
          <NavyButton onClick={() => onSubmit(f as Resolution)}>Table Resolution</NavyButton>
        </>
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input
            style={inputStyle}
            value={f.title || ""}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Meeting</label>
            <select
              style={inputStyle}
              value={f.meeting}
              onChange={(e) => set("meeting", e.target.value)}
            >
              {meetings.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Reference (optional)</label>
            <input
              style={inputStyle}
              value={f.reference || ""}
              onChange={(e) => set("reference", e.target.value)}
              placeholder="e.g. AGM/2026/06"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select
              style={inputStyle}
              value={f.category}
              onChange={(e) => set("category", e.target.value as ResolutionCategory)}
            >
              {(["Policy", "Financial", "Membership", "Governance"] as ResolutionCategory[]).map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={f.status}
              onChange={(e) => set("status", e.target.value as ResolutionStatus)}
            >
              {(["Pending", "Passed", "Rejected", "Tabled"] as ResolutionStatus[]).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              value={f.date || ""}
              onChange={(e) => set("date", e.target.value)}
              placeholder="e.g. 14 May 2026"
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Votes for</label>
            <input
              type="number"
              style={inputStyle}
              value={f.votesFor ?? 0}
              onChange={(e) => set("votesFor", Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Votes against</label>
            <input
              type="number"
              style={inputStyle}
              value={f.votesAgainst ?? 0}
              onChange={(e) => set("votesAgainst", Number(e.target.value))}
            />
          </div>
          <div>
            <label style={labelStyle}>Abstentions</label>
            <input
              type="number"
              style={inputStyle}
              value={f.abstain ?? 0}
              onChange={(e) => set("abstain", Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Governed change (optional)</label>
          <input
            style={inputStyle}
            value={f.governedChange || ""}
            onChange={(e) => set("governedChange", e.target.value)}
            placeholder="e.g. Dividend rate → 8.5%"
          />
        </div>
      </div>
    </Modal>
  );
}
