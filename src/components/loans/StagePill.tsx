import { StatusPill, type Tone } from "@/components/common/StatusPill";
import type { AppStage } from "@/api/loans";

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

// Loan-domain statuses mapped to the shared status tones so every stage badge
// renders through the one bordered StatusPill instead of a bespoke pill.
const STAGE_TONE: Record<Status, Tone> = {
  Submitted: "gray",
  "Under Review": "blue",
  Approved: "amber",
  "To Disburse": "green",
  Rejected: "red",
  Current: "green",
  "Due Soon": "amber",
  "In Arrears": "red",
  Closed: "gray",
  Verified: "green",
  "Pending valuation": "amber",
  Active: "green",
  Verification: "amber",
  "1–30": "amber",
  "31–60": "orange",
  "61–90": "red",
  "90+": "red",
};

export function StagePill({ stage }: { stage: Status }) {
  return <StatusPill label={stage} tone={STAGE_TONE[stage] ?? "gray"} />;
}
