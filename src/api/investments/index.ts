// Investments domain — institutions, proposals, positions, maturity alerts and
// exposure monitoring. Mirrors com.obenyaade.cooperative.modules.investments.
// Routes/components import from `@/api/investments` only.
export * from "./types";
export {
  SEED_INSTITUTIONS,
  SEED_PROPOSALS,
  SEED_POSITIONS,
  SEED_ALERTS,
  SEED_EXPOSURE,
} from "./data";
export {
  // getters
  getInstitutions,
  getProposals,
  getPositions,
  getMaturityAlerts,
  getExposureSnapshots,
  institutionName,
  nextProposalStatus,
  // hooks
  useInstitutions,
  useProposals,
  usePositions,
  useMaturityAlerts,
  useExposureSnapshots,
  // institution actions
  addInstitution,
  approveInstitution,
  suspendInstitution,
  removeInstitution,
  // proposal actions
  addProposal,
  advanceProposal,
  rejectProposal,
  // position actions
  addPosition,
  maturePosition,
  closePosition,
  // alert actions
  addMaturityAlert,
  markAlertSent,
  acknowledgeAlert,
  // exposure actions
  addExposureSnapshot,
  subscribe,
} from "./store";

/** Format a number as Ghana cedis (e.g. GH₵ 500,000.00). */
export const fmtGHS2 = (n: number) =>
  `GH₵ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
