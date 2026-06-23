import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wallet, Landmark, PieChart, CreditCard, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";
import { PageHeader, Pill } from "@/components/patterns";

export const Route = createFileRoute("/_auth/products/")({
  component: ProductsHub,
});

type LayerVariant = "overlay" | "governed" | "core";

const LAYER_STYLES: Record<LayerVariant, { bg: string; fg: string }> = {
  overlay: { bg: "#E1F5EE", fg: "#0F6E56" },
  governed: { bg: "#FFFBEB", fg: "#B45309" },
  core: { bg: "#E6EBF6", fg: "#002663" },
};

function LayerTag({ label, variant }: { label: string; variant: LayerVariant }) {
  const s = LAYER_STYLES[variant];
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
        <div style={{ fontSize: 15, fontWeight: 800, color: tokens.text }}>{card.title}</div>
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
          fontWeight: 600,
        }}
      >
        View <ArrowRight size={14} />
      </div>
    </button>
  );
}

function ProductsHub() {
  const cards: NavCard[] = [
    {
      title: "Savings Products",
      desc: "Passbook, term deposits, susu and goal-based savings catalogue.",
      icon: <Wallet size={22} />,
      iconBg: "#EEF2FF",
      iconFg: "#3B5BDB",
      route: "/products/savings",
      tag: { label: "Core", variant: "core" },
    },
    {
      title: "Loan Products",
      desc: "Lending catalogue — rates, tenures and security definitions.",
      icon: <Landmark size={22} />,
      iconBg: "#ECFDF5",
      iconFg: "#059669",
      route: "/products/loans",
      tag: { label: "Core", variant: "core" },
    },
    {
      title: "Share Products",
      desc: "Share classes, dividends and capital position.",
      icon: <PieChart size={22} />,
      iconBg: "#FFF7ED",
      iconFg: "#B45309",
      route: "/products/shares",
      tag: { label: "AGM-governed", variant: "governed" },
    },
    {
      title: "Prepaid Products",
      desc: "Prepaid cards and wallet product definitions.",
      icon: <CreditCard size={22} />,
      iconBg: "#F5F3FF",
      iconFg: "#7C3AED",
      route: "/products/prepaid",
      tag: { label: "Overlay", variant: "overlay" },
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
      <PageHeader
        title="Products"
        subtitle="Savings, loan, share and prepaid product definitions."
        style={{ marginBottom: 24 }}
      />

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
  );
}
