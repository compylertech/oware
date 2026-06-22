import { LOAN } from "@/lib/tokens";
import type { AppStage } from "@/lib/loanMock";

type Status =
  | AppStage
  | "Current"
  | "Due Soon"
  | "In Arrears"
  | "Closed"
  | "Verified"
  | "Pending valuation"
  | "Active"
  | "Verification"
  | "1–30"
  | "31–60"
  | "61–90"
  | "90+";

const MAP: Record<string, { c: string; bg: string }> = {
  Submitted:        { c: LOAN.muted, bg: "#EEF1F6" },
  "Under Review":   { c: LOAN.blue,  bg: LOAN.blueBg },
  Approved:         { c: LOAN.amber, bg: LOAN.amberBg },
  "To Disburse":    { c: LOAN.green, bg: LOAN.greenBg },
  Rejected:         { c: LOAN.red,   bg: LOAN.redBg },
  Current:          { c: LOAN.green, bg: LOAN.greenBg },
  "Due Soon":       { c: LOAN.amber, bg: LOAN.amberBg },
  "In Arrears":     { c: LOAN.red,   bg: LOAN.redBg },
  Closed:           { c: LOAN.muted, bg: "#EEF1F6" },
  Verified:         { c: LOAN.green, bg: LOAN.greenBg },
  "Pending valuation": { c: LOAN.amber, bg: LOAN.amberBg },
  Active:           { c: LOAN.green, bg: LOAN.greenBg },
  Verification:     { c: LOAN.amber, bg: LOAN.amberBg },
  "1–30":           { c: LOAN.amber, bg: LOAN.amberBg },
  "31–60":          { c: "#E07B39",  bg: "#FFF3EA" },
  "61–90":          { c: LOAN.red,   bg: LOAN.redBg },
  "90+":            { c: "#9B1C1C",  bg: "#FEE2E2" },
};

export function StagePill({ stage }: { stage: Status }) {
  const s = MAP[stage] ?? { c: LOAN.muted, bg: "#EEF1F6" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: s.c,
        background: s.bg,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.c }} />
      {stage}
    </span>
  );
}
