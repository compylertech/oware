import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  Users2,
  CheckCircle2,
  Clock,
  Sigma,
  Info,
  MoreVertical,
  CheckCircle,
  Ban,
  User,
  Trash2,
} from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { StatusPill, type StatusKind } from "@/components/common/StatusPill";
import { StatCard, StatGrid, Button, Pill } from "@/components/patterns";

export const Route = createFileRoute("/_auth/cooperative/membership")({
  component: MembershipPage,
});

type MemberStatus = Extract<StatusKind, "Active" | "Pending" | "Suspended" | "Withdrawn">;
type Klass = "A" | "B" | "C";

type Member = {
  id: string;
  memberId: string;
  name: string;
  branch: string;
  group: string;
  klass: Klass;
  shares: number;
  contributions: number;
  status: MemberStatus;
};

const SEED: Member[] = [
  {
    id: "1",
    memberId: "MBR-00231",
    name: "Pearl Adzoko",
    branch: "Accra Main",
    group: "Teachers Union",
    klass: "A",
    shares: 1200,
    contributions: 24000,
    status: "Active",
  },
  {
    id: "2",
    memberId: "MBR-00198",
    name: "Kwame Mensah",
    branch: "Kumasi Central",
    group: "Market Traders",
    klass: "B",
    shares: 540,
    contributions: 10800,
    status: "Pending",
  },
  {
    id: "3",
    memberId: "MBR-00176",
    name: "Ama Boateng",
    branch: "Tema",
    group: "Civil Servants",
    klass: "A",
    shares: 2050,
    contributions: 41000,
    status: "Active",
  },
  {
    id: "4",
    memberId: "MBR-00154",
    name: "Kofi Asare",
    branch: "Takoradi",
    group: "Fishermen Coop",
    klass: "C",
    shares: 300,
    contributions: 6000,
    status: "Suspended",
  },
  {
    id: "5",
    memberId: "MBR-00131",
    name: "Esi Tetteh",
    branch: "Accra Main",
    group: "Teachers Union",
    klass: "B",
    shares: 880,
    contributions: 17600,
    status: "Active",
  },
  {
    id: "6",
    memberId: "MBR-00097",
    name: "Yaw Darko",
    branch: "Kumasi Central",
    group: "Market Traders",
    klass: "A",
    shares: 0,
    contributions: 0,
    status: "Withdrawn",
  },
  {
    id: "7",
    memberId: "MBR-00088",
    name: "Akosua Nyarko",
    branch: "Tema",
    group: "Civil Servants",
    klass: "A",
    shares: 1450,
    contributions: 29000,
    status: "Active",
  },
  {
    id: "8",
    memberId: "MBR-00072",
    name: "Nana Owusu",
    branch: "Accra Main",
    group: "Teachers Union",
    klass: "C",
    shares: 220,
    contributions: 4400,
    status: "Pending",
  },
];

const STATUS_FILTERS: ("All" | MemberStatus)[] = [
  "All",
  "Active",
  "Pending",
  "Suspended",
  "Withdrawn",
];

const KLASS_STYLE: Record<Klass, { bg: string; fg: string }> = {
  A: { bg: "#EEF2FF", fg: "#3B5BDB" },
  B: { bg: "#EEF9F3", fg: "#065F46" },
  C: { bg: "#F3EEFF", fg: "#6D28D9" },
};

function fmtMoney(n: number) {
  return `GH₵ ${n.toLocaleString("en-US")}`;
}

function MembershipPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>(SEED);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | MemberStatus>("All");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (filter !== "All" && m.status !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q)
      );
    });
  }, [members, query, filter]);

  const totals = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m) => m.status === "Active").length,
      pending: members.filter((m) => m.status === "Pending").length,
      shares: members.reduce((s, m) => s + m.shares, 0),
    };
  }, [members]);

  function setStatus(id: string, status: MemberStatus) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function removeMember(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Remove this member? This cannot be undone.")
    )
      return;
    setMembers((ms) => ms.filter((m) => m.id !== id));
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 14,
            gap: 16,
          }}
        >
          <div>
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
              Member Register
            </h1>
            <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
              Share allocations, common-bond groups and membership status.
            </p>
          </div>
          <Button onClick={() => navigate({ to: "/clients/add" })} icon={<Plus size={16} />}>
            Add member via Clients
          </Button>
        </div>

        {/* Info banner */}
        <div
          style={{
            marginTop: 18,
            background: "#EEF2FF",
            border: "1px solid #D6E2FF",
            borderRadius: 12,
            padding: "12px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            color: "#1E3A8A",
            fontSize: 13,
          }}
        >
          <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            Members are admitted through the <strong>Clients</strong> registration flow — tick
            “Register as cooperative member” on the Cooperative step to enrol a client into this
            register.
          </div>
        </div>

        {/* KPIs */}
        <StatGrid style={{ marginTop: 18 }}>
          <StatCard
            icon={<Users2 size={18} />}
            iconBg="#EEF2FF"
            iconColor="#3B5BDB"
            label="Total members"
            value={totals.total}
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            iconBg="#ECFDF3"
            iconColor="#067647"
            label="Active"
            value={totals.active}
          />
          <StatCard
            icon={<Clock size={18} />}
            iconBg="#FFFBEB"
            iconColor="#B45309"
            label="Pending admission"
            value={totals.pending}
          />
          <StatCard
            icon={<Sigma size={18} />}
            iconBg="#F3EEFF"
            iconColor="#6D28D9"
            label="Total shares held"
            value={totals.shares.toLocaleString()}
          />
        </StatGrid>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 320px",
              maxWidth: 420,
            }}
          >
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: tokens.textMuted,
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID or group…"
              style={{
                width: "100%",
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: 10,
                padding: "9px 12px 9px 34px",
                fontSize: 13,
                fontFamily: FONTS.body,
                color: tokens.text,
                outline: "none",
              }}
            />
          </div>
          <div
            style={{
              display: "inline-flex",
              background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 10,
              padding: 4,
              gap: 2,
            }}
          >
            {STATUS_FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
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
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members table */}
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
              <tr style={{ borderBottom: `2px solid #002663` }}>
                {[
                  "Member",
                  "ID",
                  "Common bond group",
                  "Class",
                  "Shares",
                  "Contributions",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: h === "Shares" || h === "Contributions" ? "right" : "left",
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
            <tbody>
              {filtered.map((m) => {
                const k = KLASS_STYLE[m.klass];
                return (
                  <tr
                    key={m.id}
                    style={{ borderBottom: `1px solid ${tokens.border}`, cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px", fontSize: 13 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
                        {m.branch}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontFamily: FONTS.mono,
                        fontSize: 12,
                        color: "#4A5878",
                      }}
                    >
                      {m.memberId}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>
                      {m.group}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <Pill color={k.fg} bg={k.bg} size="sm" style={{ fontWeight: 700 }}>
                        Class {m.klass}
                      </Pill>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        textAlign: "right",
                        fontFamily: FONTS.body,
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                        color: "#4A5878",
                        fontSize: 13,
                      }}
                    >
                      {m.shares.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        textAlign: "right",
                        fontFamily: FONTS.body,
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                        color: "#4A5878",
                        fontSize: 13,
                      }}
                    >
                      {fmtMoney(m.contributions)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <StatusPill status={m.status} />
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right", position: "relative" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === m.id ? null : m.id);
                        }}
                        aria-label="Actions"
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#7A879F",
                          padding: 4,
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenu === m.id && (
                        <div
                          ref={menuRef}
                          style={{
                            position: "absolute",
                            top: "100%",
                            right: 16,
                            zIndex: 30,
                            background: "#fff",
                            border: `1px solid ${tokens.border}`,
                            borderRadius: 8,
                            padding: 4,
                            minWidth: 180,
                            textAlign: "left",
                          }}
                        >
                          {(m.status === "Pending" || m.status === "Suspended") && (
                            <MenuRow
                              icon={<CheckCircle size={14} />}
                              color="#067647"
                              onClick={() => {
                                setOpenMenu(null);
                                setStatus(m.id, "Active");
                              }}
                            >
                              Activate
                            </MenuRow>
                          )}
                          {m.status === "Active" && (
                            <MenuRow
                              icon={<Ban size={14} />}
                              color="#D92D20"
                              onClick={() => {
                                setOpenMenu(null);
                                setStatus(m.id, "Suspended");
                              }}
                            >
                              Suspend
                            </MenuRow>
                          )}
                          <MenuRow
                            icon={<User size={14} />}
                            color="#16233F"
                            onClick={() => {
                              setOpenMenu(null);
                            }}
                          >
                            View profile
                          </MenuRow>
                          <MenuRow
                            icon={<Trash2 size={14} />}
                            color="#D92D20"
                            onClick={() => {
                              setOpenMenu(null);
                              removeMember(m.id);
                            }}
                          >
                            Remove member
                          </MenuRow>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: tokens.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No members match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  color,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 14px",
        fontSize: 13,
        color,
        fontFamily: FONTS.body,
        textAlign: "left",
        borderRadius: 6,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F4F6FB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      {children}
    </button>
  );
}
