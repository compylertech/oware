import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { ProductCardGrid, type ProductCardData } from "@/components/products/ProductCard";
import { Button } from "@/components/patterns";

export const Route = createFileRoute("/_auth/products/savings")({
  component: SavingsProductsPage,
});

const PRODUCTS: ProductCardData[] = [
  {
    name: "Regular Savings",
    type: "Passbook",
    typeColor: "#3B5BDB",
    cells: [
      { label: "Interest", value: "4.5% p.a." },
      { label: "Min balance", value: "GH₵ 50" },
      { label: "Withdrawal", value: "Anytime" },
      { label: "Fee", value: "GH₵ 2 / mo" },
    ],
    footerLeft: "1,240 accounts",
    active: true,
  },
  {
    name: "Fixed Deposit (90d)",
    type: "Term",
    typeColor: "#059669",
    cells: [
      { label: "Interest", value: "9% p.a." },
      { label: "Min deposit", value: "GH₵ 1,000" },
      { label: "Withdrawal", value: "At maturity" },
      { label: "Penalty", value: "2%" },
    ],
    footerLeft: "318 accounts",
    active: true,
  },
  {
    name: "Susu Daily",
    type: "Collection",
    typeColor: "#B45309",
    cells: [
      { label: "Interest", value: "0%" },
      { label: "Min deposit", value: "GH₵ 5" },
      { label: "Withdrawal", value: "Monthly" },
      { label: "Fee", value: "GH₵ 1 / day" },
    ],
    footerLeft: "642 accounts",
    active: true,
  },
  {
    name: "Christmas Club",
    type: "Goal",
    typeColor: "#7C3AED",
    cells: [
      { label: "Interest", value: "5% p.a." },
      { label: "Min deposit", value: "GH₵ 20" },
      { label: "Withdrawal", value: "Dec only" },
      { label: "Fee", value: "None" },
    ],
    footerLeft: "187 accounts",
    active: true,
  },
  {
    name: "Youth Saver",
    type: "Passbook",
    typeColor: "#3B5BDB",
    cells: [
      { label: "Interest", value: "6% p.a." },
      { label: "Min deposit", value: "GH₵ 10" },
      { label: "Withdrawal", value: "Guardian" },
      { label: "Fee", value: "None" },
    ],
    footerLeft: "0 accounts",
    active: false,
  },
];

function SavingsProductsPage() {
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
            Savings Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Deposit product catalogue — rates, fees and withdrawal rules.
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
