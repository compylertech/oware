import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import {
  NewLoanProductModal,
  LOAN_PRODUCTS_LIST_KEY,
} from "@/components/products/NewLoanProductModal";
import { EditLoanProductModal } from "@/components/products/EditLoanProductModal";
import { loanProductsApi, loanReportsApi, type LoanProduct } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { Button } from "@/components/patterns";
import type { ProductDto } from "@/api/backend";

export const Route = createFileRoute("/_auth/products/loans")({
  component: LoanProductsPage,
});

// mapLoanProduct can't know a product's active-loan count from the product
// catalogue DTO alone (Fineract doesn't return it there), so it's computed
// here by cross-referencing the real active-loans list by product name -
// same cache key as the Active Loans page's own unfiltered fetch (and as
// /loans/products, this route's near-duplicate).
function countsByProduct(loans: { product: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of loans) counts[l.product] = (counts[l.product] ?? 0) + 1;
  return counts;
}

function toCards(products: LoanProduct[], counts: Record<string, number>): ProductCardData[] {
  return products.map((p) => ({
    code: p.code,
    name: p.name,
    type: p.type,
    typeColor: p.typeColor,
    cells: [
      { label: "Interest", value: p.rate },
      { label: "Term", value: p.term },
      { label: "Max amount", value: p.max },
      { label: "Extra", value: p.extra },
    ],
    footerLeft: `${counts[p.name] ?? 0} active loans`,
    active: p.active,
  }));
}

function LoanProductsPage() {
  const { data } = useBackendData(LOAN_PRODUCTS_LIST_KEY, () => loanProductsApi.list());
  const { data: activeReport } = useBackendData("loans:active:", () =>
    loanReportsApi.active({ limit: 500 }),
  );
  const counts = countsByProduct(activeReport?.loans ?? []);
  const PRODUCTS = toCards(data ?? [], counts);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductDto | null>(null);

  async function openEdit(code: string) {
    const raw = await loanProductsApi.getRaw(code);
    if (raw) setEditing(raw);
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
            Lending product catalogue - rates, terms and security.
          </p>
        </div>
        <Button variant="success" icon={<Plus size={16} />} onClick={() => setOpen(true)}>
          New product
        </Button>
      </div>

      <ProductCardGrid products={PRODUCTS} onEdit={(code) => void openEdit(code)} />

      <NewLoanProductModal open={open} onClose={() => setOpen(false)} />
      <EditLoanProductModal open={!!editing} onClose={() => setEditing(null)} product={editing} />
    </div>
  );
}
