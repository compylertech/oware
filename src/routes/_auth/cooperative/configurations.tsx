import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/cooperative/configurations")({
  component: ConfigurationsPage,
});

function Panel({
  title,
  description,
  headerAction,
  children,
}: {
  title: string;
  description: string;
  headerAction: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        boxShadow: "none",
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 800, color: tokens.text }}>{title}</div>
          <div style={{ fontSize: 12, color: tokens.textSub, marginTop: 3 }}>{description}</div>
        </div>
        <div>{headerAction}</div>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function ConfigureLink() {
  return (
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
  );
}

function SubRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "#FAFBFD",
        border: `1px solid ${tokens.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: tokens.text,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}

const POLICY = [
  "Max LTV: 70%",
  "Min. member guarantors: 1",
  "Loan ceiling (Class C): GH₵ 20,000",
];

const APPROVAL = [
  "Disbursements > GH₵ 50,000 → Board approval",
  "Loan write-off → CEO + Audit Committee",
  "Product rate change → AGM resolution required",
];

const GROUPS = [
  { name: "Teachers Union", count: 184 },
  { name: "Market Traders", count: 142 },
  { name: "Civil Servants", count: 96 },
  { name: "Fishermen Coop", count: 41 },
];

function ConfigurationsPage() {
  return (
    <div style={{ background: tokens.bg, minHeight: "100%", padding: 28, fontFamily: FONTS.body }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link
          to="/cooperative"
          style={{ color: tokens.navy, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={14} /> Back to Cooperative
        </Link>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>COOPERATIVE</div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 800, color: tokens.text, margin: "6px 0 6px" }}>Configurations</h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Policy engine, approval matrix and common bonds.
          </p>
        </div>

        <div style={{ marginTop: 22, display: "grid", gap: 14 }}>
          <Panel
            title="Policy Engine"
            description="Loan eligibility rules, LTV caps, and guarantor requirements."
            headerAction={<ConfigureLink />}
          >
            <div style={{ display: "grid", gap: 8 }}>
              {POLICY.map((p) => <SubRow key={p}>{p}</SubRow>)}
            </div>
          </Panel>

          <Panel
            title="Approval Matrix"
            description="Maker-checker thresholds by role and transaction type."
            headerAction={<ConfigureLink />}
          >
            <div style={{ display: "grid", gap: 8 }}>
              {APPROVAL.map((p) => <SubRow key={p}>{p}</SubRow>)}
            </div>
          </Panel>

          <Panel
            title="Common Bond Groups"
            description="Define eligible membership groups and their loan multipliers."
            headerAction={
              <button
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
                <Plus size={14} /> Add group
              </button>
            }
          >
            <div style={{ display: "grid", gap: 8 }}>
              {GROUPS.map((g) => (
                <div
                  key={g.name}
                  style={{
                    padding: "10px 12px",
                    background: "#FAFBFD",
                    border: `1px solid ${tokens.border}`,
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: tokens.text, fontWeight: 600 }}>{g.name}</span>
                  <span
                    style={{
                      background: "#EEF2FF",
                      color: "#3B5BDB",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 999,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.count} members
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
