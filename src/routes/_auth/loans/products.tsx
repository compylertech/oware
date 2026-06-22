import { createFileRoute } from "@tanstack/react-router";
import { LoansShell } from "@/components/loans/LoansShell";
import { PRODUCTS as LOAN_PRODUCTS } from "@/lib/loanMock";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";

export const Route = createFileRoute("/_auth/loans/products")({
  component: ProductsPage,
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

function ProductsPage() {
  return (
    <LoansShell>
      <ProductCardGrid products={PRODUCTS} />
    </LoansShell>
  );
}
