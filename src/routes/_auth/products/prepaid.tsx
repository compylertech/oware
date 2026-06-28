import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button, Table, TableCard, Td, Th, THead, Tr } from "@/components/patterns";
import { FONTS, tokens } from "@/lib/tokens";

export const Route = createFileRoute("/_auth/products/prepaid")({
  component: PrepaidProductsPage,
});

type Row = {
  product: string;
  network: string;
  loadLimit: string;
  dailyLimit: string;
  fee: string;
  status: "Active" | "Inactive";
};

const ROWS: Row[] = [
  {
    product: "Visa Prepaid",
    network: "Visa",
    loadLimit: "GH₵ 10,000",
    dailyLimit: "GH₵ 2,000",
    fee: "GH₵ 15 / mo",
    status: "Active",
  },
  {
    product: "Mastercard Travel",
    network: "Mastercard",
    loadLimit: "GH₵ 25,000",
    dailyLimit: "GH₵ 5,000",
    fee: "GH₵ 25 / mo",
    status: "Active",
  },
  {
    product: "GhanaPay Wallet",
    network: "GhIPSS",
    loadLimit: "GH₵ 5,000",
    dailyLimit: "GH₵ 1,500",
    fee: "Free",
    status: "Inactive",
  },
];

function StatusPill({ status }: { status: Row["status"] }) {
  const s =
    status === "Active" ? { bg: "#ECFDF3", fg: "#067647" } : { bg: "#EEF1F6", fg: "#5B6A86" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.fg,
        fontSize: 11,
        fontWeight: 100,
        padding: "3px 10px",
        borderRadius: 999,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }} />
      {status}
    </span>
  );
}

function PrepaidProductsPage() {
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
            Prepaid Products
          </h1>
          <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
            Prepaid card and wallet product definitions.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />}>
          New prepaid product
        </Button>
      </div>

      <TableCard>
        <Table>
          <THead>
            {["Product", "Network", "Load limit", "Daily limit", "Fee", "Status"].map((h, i) => (
              <Th
                key={h}
                align={i === 2 || i === 3 ? "right" : "left"}
                style={{ padding: "11px 16px", fontSize: 11, color: "#5B6A86" }}
              >
                {h}
              </Th>
            ))}
          </THead>
          <tbody>
            {ROWS.map((r, i) => (
              <Tr key={i} hover>
                <Td
                  style={{
                    fontWeight: 100,
                    color: tokens.text,
                  }}
                >
                  {r.product}
                </Td>
                <Td muted>{r.network}</Td>
                <Td
                  numeric
                  align="right"
                  style={{
                    fontWeight: 100,
                    color: tokens.text,
                  }}
                >
                  {r.loadLimit}
                </Td>
                <Td
                  numeric
                  align="right"
                  style={{
                    fontWeight: 500,
                    color: tokens.textSub,
                  }}
                >
                  {r.dailyLimit}
                </Td>
                <Td muted>{r.fee}</Td>
                <Td>
                  <StatusPill status={r.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
    </div>
  );
}
