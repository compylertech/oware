import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { LoansShell } from "@/components/loans/LoansShell";
import {
  NewLoanProductModal,
  LOAN_PRODUCTS_LIST_KEY,
} from "@/components/products/NewLoanProductModal";
import { EditLoanProductModal } from "@/components/products/EditLoanProductModal";
import { loanProductsApi, loanReportsApi, type LoanProduct } from "@/api/loans";
import { useBackendData } from "@/api/useBackendData";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/patterns";
import type { ProductDto } from "@/api/backend";

export const Route = createFileRoute("/_auth/loans/products")({
  component: ProductsPage,
});

// mapLoanProduct can't know a product's active-loan count from the product
// catalogue DTO alone (Fineract doesn't return it there), so it's computed
// here by cross-referencing the real active-loans list by product name -
// same cache key as the Active Loans page's own unfiltered fetch.
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

function ProductsPage() {
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
    <LoansShell>
      <div className="flex justify-end" style={{ marginBottom: 14 }}>
        <Button variant="success" icon={<Plus size={14} />} onClick={() => setOpen(true)}>
          New Product
        </Button>
      </div>
      <ProductCardGrid products={PRODUCTS} onEdit={(code) => void openEdit(code)} />
      <NewLoanProductModal open={open} onClose={() => setOpen(false)} />
      <EditLoanProductModal open={!!editing} onClose={() => setEditing(null)} product={editing} />
    </LoansShell>
  );
}
