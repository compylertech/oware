import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { PRODUCTS as LOAN_PRODUCTS } from "@/lib/loanMock";
import { Button } from "@/components/patterns";

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
    <div
      style={{
        background: tokens.bg,
        minHeight: "100%",
        padding: "24px 28px",
        fontFamily: FONTS.body,
      }}
    >
      <Link
        to="/products"
        style={{
          color: tokens.navy,
          fontSize: 13,
          fontWeight: 300,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          textDecoration: "none",
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={14} /> Back to Products
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 14,
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 100, letterSpacing: 1.2, color: tokens.textMuted }}
          >
            PRODUCTS
          </div>
          <h1
            style={{
              fontFamily: FONTS.display,
              fontSize: 26,
              fontWeight: 200,
              color: tokens.text,
              margin: "6px 0 6px",
            }}
          >
            Loan Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Lending product catalogue — rates, terms and security.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          New product
        </Button>
      </div>

      <ProductCardGrid products={PRODUCTS} />
    </div>
  );
}
