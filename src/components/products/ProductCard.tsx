import { useState } from "react";
import { tokens, FONTS } from "@/lib/tokens";
import { Button } from "@/components/patterns";

export type ProductCardData = {
  name: string;
  type: string;
  typeColor: string;
  cells: { label: string; value: string }[];
  footerLeft: string; // e.g. "412 active loans" or "1,240 accounts"
  active: boolean;
};

export function ProductCardGrid({ products }: { products: ProductCardData[] }) {
  const [active, setActive] = useState<boolean[]>(products.map((p) => p.active));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 14,
      }}
    >
      {products.map((p, i) => (
        <ProductCard
          key={p.name}
          product={p}
          on={active[i]}
          onToggle={() => setActive(active.map((v, j) => (j === i ? !v : v)))}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  on,
  onToggle,
}: {
  product: ProductCardData;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        padding: 18,
        boxShadow: "none",
        fontFamily: FONTS.body,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div
            style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 200, color: tokens.text }}
          >
            {product.name}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: product.typeColor,
              fontWeight: 300,
              marginTop: 4,
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: 999, background: product.typeColor }}
            />
            {product.type}
          </div>
        </div>
        <Switch on={on} onClick={onToggle} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        {product.cells.map((c) => (
          <div key={c.label}>
            <div
              style={{
                fontSize: 10,
                color: tokens.textMuted,
                fontWeight: 100,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {c.label}
            </div>
            <div style={{ fontSize: 12, color: tokens.text, fontWeight: 300, marginTop: 2 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          borderTop: `1px solid ${tokens.border}`,
          paddingTop: 12,
        }}
      >
        <span style={{ fontSize: 12, color: tokens.textMuted }}>{product.footerLeft}</span>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </div>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        background: on ? "#059669" : "#CBD5E1",
        position: "relative",
        border: "none",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: on ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: "#fff",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}
