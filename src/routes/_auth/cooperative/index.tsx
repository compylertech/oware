import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gavel, Users2, PieChart, SlidersHorizontal, TrendingUp, ArrowRight } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Pill } from "@/components/patterns";
import type { CSSProperties, ReactNode } from "react";

export const Route = createFileRoute("/_auth/cooperative/")({
  component: CooperativeHub,
});

type LayerVariant = "overlay" | "governed" | "core";

function LayerTag({ label, variant }: { label: string; variant: LayerVariant }) {
  const styles: Record<LayerVariant, { bg: string; fg: string }> = {
    overlay: { bg: "#E1F5EE", fg: "#0F6E56" },
    governed: { bg: "#EEF2FF", fg: "#1E3A8A" },
    core: { bg: "#E6EBF6", fg: "#002663" },
  };
  const s = styles[variant];
  return (
    <Pill color={s.fg} bg={s.bg} uppercase>
      {label}
    </Pill>
  );
}

type NavCard = {
  title: string;
  desc: string;
  icon: ReactNode;
  iconBg: string;
  iconFg: string;
  route: string;
  tag: { label: string; variant: LayerVariant };
};

function HubCard({ card }: { card: NavCard }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: card.route as never })}
      style={{
        cursor: "pointer",
        textAlign: "left",
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        padding: 20,
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "background 120ms, transform 120ms, box-shadow 120ms",
        fontFamily: FONTS.body,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F7FAFF";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(13,27,62,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = tokens.surface;
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: card.iconBg,
            color: card.iconFg,
            display: "grid",
            placeItems: "center",
          }}
        >
          {card.icon}
        </div>
        <LayerTag label={card.tag.label} variant={card.tag.variant} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 200, color: tokens.text }}>{card.title}</div>
        <div style={{ fontSize: 13, color: tokens.textSub, marginTop: 4, lineHeight: 1.5 }}>
          {card.desc}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: "auto",
          color: tokens.accent,
          fontSize: 13,
          fontWeight: 300,
        }}
      >
        View <ArrowRight size={14} />
      </div>
    </button>
  );
}

function CooperativeHub() {
  const cards: NavCard[] = [
    {
      title: "Governance",
      desc: "Meetings, quorum and resolutions of the cooperative.",
      icon: <Gavel size={22} />,
      iconBg: "#E1F5EE",
      iconFg: "#0F6E56",
      route: "/cooperative/governance",
      tag: { label: "Cooperative", variant: "overlay" },
    },
    {
      title: "Membership",
      desc: "Member register, share allocations and common-bond groups.",
      icon: <Users2 size={22} />,
      iconBg: "#EEF2FF",
      iconFg: "#3B5BDB",
      route: "/cooperative/membership",
      tag: { label: "Cooperative", variant: "overlay" },
    },
    {
      title: "Share Capital",
      desc: "Share classes, allocations and dividend declarations.",
      icon: <PieChart size={22} />,
      iconBg: "#FFF7ED",
      iconFg: "#B45309",
      route: "/products/shares",
      tag: { label: "AGM-governed", variant: "governed" },
    },
    {
      title: "Investments",
      desc: "Institutions, proposals, placements, maturity alerts and exposure limits.",
      icon: <TrendingUp size={22} />,
      iconBg: "#E1F5EE",
      iconFg: "#0F6E56",
      route: "/cooperative/investments",
      tag: { label: "Treasury", variant: "overlay" },
    },
    {
      title: "Configurations",
      desc: "Policy engine, approval matrix and common bonds.",
      icon: <SlidersHorizontal size={22} />,
      iconBg: "#EEF6FF",
      iconFg: "#1E5FA8",
      route: "/cooperative/configurations",
      tag: { label: "Governed", variant: "governed" },
    },
  ];

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
        <div
          style={{
            fontSize: 11,
            fontWeight: 100,
            letterSpacing: 1.2,
            color: tokens.textMuted,
          }}
        >
          MODULE
        </div>
        <h1
          style={{
            fontFamily: FONTS.display,
            fontSize: 26,
            fontWeight: 200,
            color: tokens.text,
            margin: "6px 0 8px",
          }}
        >
          Cooperative
        </h1>
        <p style={{ color: tokens.textSub, fontSize: 14, maxWidth: 680, marginBottom: 24 }}>
          Member governance, membership register and share capital. Withdrawal notices are raised
          per account in the Account section.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {cards.map((c) => (
            <HubCard key={c.title} card={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

// shared style helper export for sibling pages
export const cardStyle: CSSProperties = {
  background: tokens.surface,
  border: `1px solid ${tokens.border}`,
  borderRadius: 14,
  boxShadow: "none",
};
