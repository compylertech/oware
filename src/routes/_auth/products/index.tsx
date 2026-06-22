import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wallet, Landmark, PieChart, CreditCard } from "lucide-react";
import type { ReactNode } from "react";
import { FONTS, tokens } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/products/")({
  component: ProductsHub,
});

type LayerVariant = "overlay" | "governed" | "core";

function LayerTag({ label, variant }: { label: string; variant: LayerVariant }) {
  const styles: Record<LayerVariant, { bg: string; fg: string }> = {
    overlay: { bg: "#E1F5EE", fg: "#0F6E56" },
    governed: { bg: "#FFFBEB", fg: "#B45309" },
    core: { bg: "#E6EBF6", fg: "#002663" },
  };
  const s = styles[variant];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 999,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        fontFamily: FONTS.body,
      }}
    >
      {label}
    </span>
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
        transition: "background 120ms",
        fontFamily: FONTS.body,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
      onMouseLeave={(e) => (e.currentTarget.style.background = tokens.surface)}
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
    <div style={{ background: tokens.bg, minHeight: "100%", padding: "24px 28px", fontFamily: FONTS.body }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>
        MODULE
      </div>
      <h1
        style={{
          fontFamily: FONTS.display,
          fontSize: 26,
          fontWeight: 800,
          color: tokens.text,
          margin: "6px 0 8px",
        }}
      >
        Products
      </h1>
      <p style={{ color: tokens.textSub, fontSize: 14, maxWidth: 680, marginBottom: 24 }}>
        Savings, loan, share and prepaid product definitions.
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
  );
}
