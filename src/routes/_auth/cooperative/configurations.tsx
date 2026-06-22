import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/cooperative/configurations")({
  component: ConfigurationsPage,
});

const STUBS = [
  { title: "Policy Engine", desc: "Define cooperative rules — dividend caps, withdrawal grace, share ceilings." },
  { title: "Approval Matrix", desc: "Configure thresholds and required approvers per transaction class." },
  { title: "Common Bond Groups", desc: "Manage member groupings such as Teachers Union or Market Traders." },
];

function ConfigurationsPage() {
  return (
    <div style={{ background: tokens.bg, minHeight: "100%", padding: 28, fontFamily: FONTS.body }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
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

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>
            COOPERATIVE
          </div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 800, color: tokens.text, margin: "6px 0 6px" }}>
            Configurations
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Policy engine, approval matrix and common bonds.
          </p>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {STUBS.map((s) => (
            <div
              key={s.title}
              style={{
                background: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text }}>{s.title}</div>
              <p style={{ fontSize: 13, color: tokens.textSub, margin: "6px 0 14px", lineHeight: 1.5 }}>
                {s.desc}
              </p>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  color: tokens.textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  fontFamily: FONTS.body,
                }}
              >
                Configure <ArrowRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
