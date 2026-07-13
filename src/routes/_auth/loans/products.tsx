import { createFileRoute } from "@tanstack/react-router";
import { LoansShell } from "@/components/loans/LoansShell";
import { loanProductsApi, loanReportsApi, type LoanProduct } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";

export const Route = createFileRoute("/_auth/loans/products")({
  component: ProductsPage,
});

// mapLoanProduct can't know a product's active-loan count from the product
// catalogue DTO alone (Fineract doesn't return it there), so it's computed
// here by cross-referencing the real active-loans list by product name —
// same cache key as the Active Loans page's own unfiltered fetch.
function countsByProduct(loans: { product: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of loans) counts[l.product] = (counts[l.product] ?? 0) + 1;
  return counts;
}

function toCards(products: LoanProduct[], counts: Record<string, number>): ProductCardData[] {
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
    footerLeft: `${counts[p.name] ?? 0} active loans`,
    active: p.active,
  }));
}

function ProductsPage() {
  const { data } = useBackendData("loans:products", () => loanProductsApi.list());
  const { data: activeReport } = useBackendData("loans:active:", () =>
    loanReportsApi.active({ limit: 500 }),
  );
  const counts = countsByProduct(activeReport?.loans ?? []);
  const PRODUCTS = toCards(data ?? [], counts);
  return (
    <LoansShell>
      <ProductCardGrid products={PRODUCTS} />
    </LoansShell>
  );
}
