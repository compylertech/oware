import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { PRODUCTS as LOAN_PRODUCTS } from "@/lib/loanMock";

export const Route = createFileRoute("/_auth/products/loans")({
  component: LoanProductsPage,
});

const PRODUCTS: ProductCardData[] = LOAN_PRODUCTS.map((p) => ({
  name: p.name,
  type: p.type,
  typeColor: p.typeColor,
  cells: [
    { label: "Interest", value: p.rate },
    { label: "Term", value: p.term },
    { label: "Max amount", value: p.max },
    { label: "Extra", value: p.extra },
  ],
  footerLeft: `${p.count} active loans`,
  active: p.active,
}));

function LoanProductsPage() {
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
            Loan Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Lending product catalogue — rates, terms and security.
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
          <Plus size={16} /> New product
        </button>
      </div>

      <ProductCardGrid products={PRODUCTS} />
    </div>
  );
}
