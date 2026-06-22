import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, PieChart, Users2, TrendingUp, DollarSign, Plus } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";
import { Modal, MField, MInput, MTextarea, MSelect, MCancelBtn, MNavyBtn } from "@/components/common/Modal";

export const Route = createFileRoute("/_auth/products/shares")({
  component: ShareCapitalPage,
});

type Klass = "A" | "B" | "C";

type ShareHolder = {
  id: string;
  name: string;
  branch: string;
  klass: Klass;
  shares: number;
  shareValue: number;
  joined: string;
};

const SEED: ShareHolder[] = [
  { id: "1", name: "Pearl Adzoko", branch: "Accra Main", klass: "A", shares: 1200, shareValue: 20, joined: "12 Feb 2022" },
  { id: "2", name: "Kwame Mensah", branch: "Kumasi Central", klass: "B", shares: 540, shareValue: 20, joined: "03 May 2023" },
  { id: "3", name: "Ama Boateng", branch: "Tema", klass: "A", shares: 2050, shareValue: 20, joined: "18 Sep 2020" },
  { id: "4", name: "Kofi Asare", branch: "Takoradi", klass: "C", shares: 300, shareValue: 20, joined: "27 Nov 2024" },
  { id: "5", name: "Esi Tetteh", branch: "Accra Main", klass: "B", shares: 880, shareValue: 20, joined: "09 Jul 2021" },
  { id: "6", name: "Akosua Nyarko", branch: "Tema", klass: "A", shares: 1450, shareValue: 20, joined: "14 Apr 2022" },
];

const KLASS_STYLE: Record<Klass, { bg: string; fg: string }> = {
  A: { bg: "#EEF2FF", fg: "#3B5BDB" },
  B: { bg: "#EEF9F3", fg: "#065F46" },
  C: { bg: "#F5F3FF", fg: "#7C3AED" },
};

function KpiCard({ icon, iconBg, iconFg, label, value, subNote }: {
  icon: React.ReactNode; iconBg: string; iconFg: string; label: string; value: string; subNote?: string;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, color: iconFg, display: "grid", placeItems: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>{label}</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 800, color: tokens.text, fontVariantNumeric: "tabular-nums" }}>
            {value}
          </div>
        </div>
      </div>
      {subNote && (
        <div style={{ marginTop: 10, background: "#FFFBEB", color: "#854F0B", borderRadius: 7, padding: "5px 9px", fontSize: 11, fontWeight: 600, display: "inline-block" }}>
          {subNote}
        </div>
      )}
    </div>
  );
}

function ShareCapitalPage() {
  const [holders, setHolders] = useState<ShareHolder[]>(SEED);
  const totalShares = holders.reduce((s, m) => s + m.shares, 0);

  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    member: "",
    klass: "Class A",
    count: "",
    price: "20.00",
    date: today,
    method: "Cash",
    notes: "",
  });
  const total = (Number(f.count) || 0) * (Number(f.price) || 0);
  const issue = () => {
    if (!f.member || !Number(f.count)) return;
    const klassMap: Record<string, Klass> = { "Class A": "A", "Class B": "B", "Class C": "C" };
    setHolders((h) => [
      ...h,
      {
        id: String(Date.now()),
        name: f.member,
        branch: "—",
        klass: klassMap[f.klass],
        shares: Number(f.count),
        shareValue: Number(f.price) || 0,
        joined: new Date(f.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      },
    ]);
    setF({ member: "", klass: "Class A", count: "", price: "20.00", date: today, method: "Cash", notes: "" });
    setOpen(false);
  };

  return (
    <div style={{ background: tokens.bg, minHeight: "100%", padding: "24px 28px", fontFamily: FONTS.body }}>
      <div>
        <Link to="/cooperative" style={{ color: tokens.navy, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Cooperative
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tokens.textMuted }}>COOPERATIVE</div>
            <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 800, color: tokens.text, margin: "6px 0 6px" }}>Share Capital</h1>
            <p style={{ color: tokens.textSub, fontSize: 14, margin: 0 }}>
              Issued shares, dividend declarations and capital position.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#F5F3FF", color: "#7C3AED", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, letterSpacing: 0.4, textTransform: "uppercase" }}>
              AGM-governed
            </span>
            <button
              onClick={() => setOpen(true)}
              style={{
                background: "#002663", color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 16px", fontSize: 13, fontWeight: 600, display: "inline-flex",
                alignItems: "center", gap: 6, cursor: "pointer", fontFamily: FONTS.body,
              }}
            >
              <Plus size={14} /> Issue Shares
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
          <KpiCard icon={<PieChart size={18} />} iconBg="#F5F3FF" iconFg="#7C3AED" label="Total shares issued" value="2,456,000" />
          <KpiCard icon={<Users2 size={18} />} iconBg="#EEF2FF" iconFg="#3B5BDB" label="Members holding shares" value="412" />
          <KpiCard icon={<TrendingUp size={18} />} iconBg="#ECFDF5" iconFg="#059669" label="Dividend rate" value="8.5%" subNote="Set by AGM/2026/02" />
          <KpiCard icon={<DollarSign size={18} />} iconBg="#FFFBEB" iconFg="#B45309" label="Capital value" value="GH₵ 24.6M" />
        </div>

        {/* Share Register */}
        <div style={{ marginTop: 22, background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tokens.border}` }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 800, color: tokens.text }}>Share Register</div>
            <div style={{ fontSize: 12, color: tokens.textSub, marginTop: 3 }}>Member share holdings by class.</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONTS.body }}>
            <thead>
              <tr style={{ borderBottom: `2px solid #002663` }}>
                {["Member", "Class", "Shares held", "Share value", "Total value", "Joined"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i >= 2 && i <= 4 ? "right" : "left",
                    padding: "11px 16px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#7A879F",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {holders.map((m) => {
                const k = KLASS_STYLE[m.klass];
                const total = m.shares * m.shareValue;
                return (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${tokens.border}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F7FAFF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "13px 16px", fontSize: 13 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: tokens.text }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{m.branch}</div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ background: k.bg, color: k.fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>Class {m.klass}</span>
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: FONTS.body, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tokens.text, fontSize: 13 }}>
                      {m.shares.toLocaleString()}
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: FONTS.body, fontWeight: 500, fontVariantNumeric: "tabular-nums", color: "#4A5878", fontSize: 13 }}>
                      GH₵ {m.shareValue.toFixed(2)}
                    </td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: FONTS.body, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tokens.text, fontSize: 13 }}>
                      GH₵ {total.toLocaleString()}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: tokens.textSub }}>{m.joined}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#FAFBFD" }}>
                <td colSpan={2} style={{ padding: "11px 16px", fontSize: 12, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: "uppercase" }}>
                  Visible total
                </td>
                <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: FONTS.body, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: tokens.text, fontSize: 13 }}>
                  {totalShares.toLocaleString()}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${tokens.border}`, fontSize: 12, color: tokens.textMuted, fontStyle: "italic" }}>
            Share Capital is governed — dividend rate and minimum holding are set by AGM resolution.
          </div>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Issue Shares"
        maxWidth={500}
        footer={<><MCancelBtn onClick={() => setOpen(false)} /><MNavyBtn onClick={issue}>Issue Shares</MNavyBtn></>}
      >
        <MField label="Member"><MInput value={f.member} onChange={(e) => setF({ ...f, member: e.target.value })} placeholder="Search member name or ID…" /></MField>
        <MField label="Share Class"><MSelect value={f.klass} onChange={(e) => setF({ ...f, klass: e.target.value })} options={["Class A", "Class B", "Class C"]} /></MField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <MField label="Number of Shares"><MInput type="number" min={1} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></MField>
          <MField label="Price per Share (GHS)"><MInput type="number" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></MField>
        </div>
        <MField label="Issue Date"><MInput type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></MField>
        <MField label="Payment Method"><MSelect value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} options={["Cash", "Deduction", "Bank Transfer"]} /></MField>
        <MField label="Notes"><MTextarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></MField>
        <div style={{ textAlign: "right", fontSize: 13, color: "#16233F", fontFamily: FONTS.body, paddingTop: 4, borderTop: `1px solid ${tokens.border}` }}>
          Total Value: <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>GHS {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </Modal>
    </div>
  );
}
