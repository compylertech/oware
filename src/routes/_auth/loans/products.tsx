import { createFileRoute } from "@tanstack/react-router";
import { LoansShell } from "@/components/loans/LoansShell";
import { PRODUCTS as SEED_LOAN_PRODUCTS, loanProductsApi, type LoanProduct } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";

export const Route = createFileRoute("/_auth/loans/products")({
  component: ProductsPage,
});

function toCards(products: LoanProduct[]): ProductCardData[] {
  return products.map((p) => ({
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
}

function ProductsPage() {
  const PRODUCTS = toCards(useBackendData(() => loanProductsApi.list(), SEED_LOAN_PRODUCTS));
  return (
    <LoansShell>
      <ProductCardGrid products={PRODUCTS} />
    </LoansShell>
  );
}
