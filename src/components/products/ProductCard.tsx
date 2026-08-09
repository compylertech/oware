import { tokens, FONTS } from "@/lib/tokens";
import { Button } from "@/components/patterns";
import { StatusPill } from "@/components/common/StatusPill";

export type ProductCardData = {
  code: string;
  name: string;
  type: string;
  typeColor: string;
  cells: { label: string; value: string }[];
  footerLeft: string; // e.g. "412 active loans" or "1,240 accounts"
  active: boolean;
};

export function ProductCardGrid({
  products,
  onEdit,
}: {
  products: ProductCardData[];
  onEdit?: (code: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 14,
      }}
    >
      {products.map((p) => (
        <ProductCard key={p.name} product={p} onEdit={onEdit} />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
}: {
  product: ProductCardData;
  onEdit?: (code: string) => void;
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
        <StatusPill status={product.active ? "Active" : "Inactive"} />
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
        <Button variant="ghost" size="sm" onClick={() => onEdit?.(product.code)}>
          Edit
        </Button>
      </div>
    </div>
  );
}
