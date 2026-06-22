import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Panel, fontDisplay } from "@/components/loans/ui";
import { PRODUCTS } from "@/lib/loanMock";

export const Route = createFileRoute("/_auth/loans/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [active, setActive] = useState<boolean[]>(PRODUCTS.map((p) => p.active));

  return (
    <LoansShell>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {PRODUCTS.map((p, i) => (
          <Panel key={p.name} style={{ padding: 18 }}>
            <div className="flex items-start justify-between">
              <div>
                <div style={{ ...fontDisplay, fontSize: 15, fontWeight: 800, color: LOAN.ink }}>{p.name}</div>
                <div className="flex items-center gap-1" style={{ fontSize: 11, color: p.typeColor, fontWeight: 600, marginTop: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: p.typeColor }} />
                  {p.type}
                </div>
              </div>
              <Switch
                on={active[i]}
                onClick={() => setActive(active.map((v, j) => (j === i ? !v : v)))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Cell label="Interest" value={p.rate} />
              <Cell label="Term" value={p.term} />
              <Cell label="Max amount" value={p.max} />
              <Cell label="Extra" value={p.extra} />
            </div>

            <div className="flex items-center justify-between mt-4" style={{ borderTop: `1px solid ${LOAN.border}`, paddingTop: 12 }}>
              <span style={{ fontSize: 12, color: LOAN.muted }}>{p.count} active loans</span>
              <button style={{ background: "transparent", border: "none", color: LOAN.blue, fontSize: 12, fontWeight: 600 }}>
                Edit
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </LoansShell>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: LOAN.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 12, color: LOAN.ink, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 20, borderRadius: 999, background: on ? LOAN.green : "#CBD5E1",
        position: "relative", border: "none", transition: "background 0.15s",
      }}
      aria-pressed={on}
    >
      <span
        style={{
          position: "absolute", top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: 999, background: "#fff",
          transition: "left 0.15s",
        }}
      />
    </button>
  );
}
