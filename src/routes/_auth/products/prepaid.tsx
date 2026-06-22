import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/products/prepaid")({
  component: PrepaidProductsPage,
});

type Row = {
  product: string;
  network: string;
  loadLimit: string;
  dailyLimit: string;
  fee: string;
  status: "Active" | "Inactive";
};

const ROWS: Row[] = [
  { product: "Visa Prepaid", network: "Visa", loadLimit: "GH₵ 10,000", dailyLimit: "GH₵ 2,000", fee: "GH₵ 15 / mo", status: "Active" },
  { product: "Mastercard Travel", network: "Mastercard", loadLimit: "GH₵ 25,000", dailyLimit: "GH₵ 5,000", fee: "GH₵ 25 / mo", status: "Active" },
  { product: "GhanaPay Wallet", network: "GhIPSS", loadLimit: "GH₵ 5,000", dailyLimit: "GH₵ 1,500", fee: "Free", status: "Inactive" },
];

function StatusPill({ status }: { status: Row["status"] }) {
  const s =
    status === "Active"
      ? { bg: "#ECFDF3", fg: "#067647" }
      : { bg: "#EEF1F6", fg: "#7A879F" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }} />
      {status}
    </span>
  );
}

function PrepaidProductsPage() {
  return (
    <div style={{ background: tokens.bg, minHeight: "100%", padding: "24px 28px", fontFamily: FONTS.body }}>
      <Link
        to="/products"
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
        <ArrowLeft size={14} /> Back to Products
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>PRODUCTS</div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 800, color: tokens.text, margin: "6px 0 6px" }}>
            Prepaid Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Prepaid card and wallet product definitions.
          </p>
        </div>
        <button
          style={{
            background: tokens.navy,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontFamily: FONTS.body,
          }}
        >
          <Plus size={16} /> New prepaid product
        </button>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${tokens.navy}` }}>
              {["Product", "Network", "Load limit", "Daily limit", "Fee", "Status"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i === 2 || i === 3 ? "right" : "left",
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
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${tokens.border}` }}>
                <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: tokens.text }}>{r.product}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>{r.network}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tokens.text }}>
                  {r.loadLimit}
                </td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: tokens.textSub }}>
                  {r.dailyLimit}
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>{r.fee}</td>
                <td style={{ padding: "13px 16px" }}>
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
