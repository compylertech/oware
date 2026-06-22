import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Gavel, Calendar, Users } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";

export const Route = createFileRoute("/_auth/cooperative/governance")({
  component: GovernancePage,
});

type MeetingType = "AGM" | "Board" | "Special";
type MeetingStatus = "Scheduled" | "Completed" | "Cancelled";

type Meeting = {
  id: string;
  title: string;
  date: string;
  type: MeetingType;
  present: number;
  required: number;
  status: MeetingStatus;
};

type ResolutionStatus = "Passed" | "Rejected" | "Tabled";

type Resolution = {
  id: string;
  title: string;
  meeting: string;
  date: string;
  votes: { for: number; against: number; abstain: number };
  status: ResolutionStatus;
};

const MEETINGS: Meeting[] = [
  { id: "1", title: "Annual General Meeting 2026", date: "12 March 2026", type: "AGM", present: 142, required: 120, status: "Scheduled" },
  { id: "2", title: "Q4 Board Meeting", date: "18 January 2026", type: "Board", present: 9, required: 7, status: "Completed" },
  { id: "3", title: "Special Resolution — Branch Expansion", date: "02 December 2025", type: "Special", present: 88, required: 100, status: "Completed" },
  { id: "4", title: "Q3 Board Meeting", date: "20 October 2025", type: "Board", present: 6, required: 7, status: "Cancelled" },
];

const RESOLUTIONS: Resolution[] = [
  { id: "1", title: "Increase dividend rate from 5% to 5.5%", meeting: "AGM 2025", date: "10 Mar 2025", votes: { for: 132, against: 14, abstain: 6 }, status: "Passed" },
  { id: "2", title: "Approve 2026 operating budget", meeting: "Q4 Board Meeting", date: "18 Jan 2026", votes: { for: 8, against: 1, abstain: 0 }, status: "Passed" },
  { id: "3", title: "Admit 12 new members (Jan batch)", meeting: "Q4 Board Meeting", date: "18 Jan 2026", votes: { for: 9, against: 0, abstain: 0 }, status: "Passed" },
  { id: "4", title: "Open new Takoradi branch office", meeting: "Special — Branch Expansion", date: "02 Dec 2025", votes: { for: 42, against: 44, abstain: 2 }, status: "Rejected" },
  { id: "5", title: "Revise loan ceiling for Class C members", meeting: "Q3 Board Meeting", date: "20 Oct 2025", votes: { for: 4, against: 4, abstain: 1 }, status: "Tabled" },
];

const TYPE_STYLE: Record<MeetingType, { bg: string; fg: string }> = {
  AGM: { bg: "#FFF7ED", fg: "#B45309" },
  Board: { bg: "#EEF2FF", fg: "#3B5BDB" },
  Special: { bg: "#F3EEFF", fg: "#6D28D9" },
};

const MEETING_STATUS_MAP: Record<MeetingStatus, StatusKind> = {
  Scheduled: "Pending",
  Completed: "Active",
  Cancelled: "Suspended",
};

function ResolutionPill({ status }: { status: ResolutionStatus }) {
  const styles: Record<ResolutionStatus, { bg: string; fg: string }> = {
    Passed: { bg: "#ECFDF3", fg: "#067647" },
    Rejected: { bg: "#FEF3F2", fg: "#D92D20" },
    Tabled: { bg: "#FFFBEB", fg: "#B45309" },
  };
  const s = styles[status];
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
      {status}
    </span>
  );
}

function GovernancePage() {
  const [tab, setTab] = useState<"Meetings" | "Resolutions">("Meetings");

  return (
    <div style={{ background: tokens.bg, minHeight: "100%", padding: 28, fontFamily: FONTS.body }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#E1F5EE",
                color: "#0F6E56",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Gavel size={20} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>
                COOPERATIVE
              </div>
              <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 800, color: tokens.text, margin: "4px 0 4px" }}>
                Governance
              </h1>
              <p style={{ color: tokens.textSub, fontSize: 13, margin: 0 }}>
                Meetings, quorum and resolutions of the cooperative.
              </p>
            </div>
          </div>
          <span
            style={{
              background: "#E1F5EE",
              color: "#0F6E56",
              fontSize: 10,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 999,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Cooperative overlay
          </span>
        </div>

        {/* Tabs */}
        <div
          style={{
            marginTop: 22,
            display: "inline-flex",
            background: "#EEF1F6",
            borderRadius: 10,
            padding: 4,
            gap: 4,
          }}
        >
          {(["Meetings", "Resolutions"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: active ? "#fff" : "transparent",
                  border: active ? `1px solid ${tokens.border}` : "1px solid transparent",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? tokens.text : tokens.textSub,
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {tab === "Meetings" ? (
          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            {MEETINGS.map((m) => {
              const ts = TYPE_STYLE[m.type];
              const quorumMet = m.present >= m.required;
              const pct = Math.min(100, Math.round((m.present / m.required) * 100));
              return (
                <div
                  key={m.id}
                  style={{
                    background: tokens.surface,
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 14,
                    padding: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: tokens.text }}>{m.title}</div>
                        <span
                          style={{
                            background: ts.bg,
                            color: ts.fg,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 9px",
                            borderRadius: 999,
                          }}
                        >
                          {m.type}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: 14, marginTop: 6, color: tokens.textSub, fontSize: 12 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={13} /> {m.date}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <Users size={13} /> {m.present} present / {m.required} required
                        </span>
                      </div>
                    </div>
                    <StatusPill status={MEETING_STATUS_MAP[m.status]} />
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        height: 8,
                        background: "#EEF1F6",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: quorumMet ? "#067647" : "#D92D20",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: quorumMet ? "#067647" : "#D92D20",
                      }}
                    >
                      {quorumMet ? "Quorum met" : "Below quorum"} — {m.present} / {m.required}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              marginTop: 18,
              background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${tokens.navy}` }}>
                  {["Resolution", "Meeting", "Date", "Vote result", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: tokens.textMuted,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESOLUTIONS.map((r) => (
                  <tr
                    key={r.id}
                    style={{ borderBottom: `1px solid ${tokens.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: tokens.text }}>{r.title}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: tokens.textSub }}>{r.meeting}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: tokens.textSub }}>{r.date}</td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: tokens.textSub, fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: "#067647", fontWeight: 700 }}>{r.votes.for} For</span>
                      {" · "}
                      <span style={{ color: "#D92D20", fontWeight: 700 }}>{r.votes.against} Against</span>
                      {" · "}
                      <span style={{ color: tokens.textMuted, fontWeight: 700 }}>{r.votes.abstain} Abstain</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <ResolutionPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
