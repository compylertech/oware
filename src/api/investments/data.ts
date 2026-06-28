// Seed fixtures for the investments domain. IDs are stable so cross-entity
// references (institutionId, proposalId, investmentPositionId) resolve.
import type {
  InvestmentExposureSnapshot,
  InvestmentInstitution,
  InvestmentMaturityAlert,
  InvestmentPosition,
  InvestmentProposal,
} from "./types";

export const SEED_INSTITUTIONS: InvestmentInstitution[] = [
  {
    id: "inst-gcb",
    name: "GCB Bank",
    institutionType: "Commercial Bank",
    riskRating: "LOW",
    status: "APPROVED",
    approvalReference: "BRD/2026/02",
    approvedAt: "2026-01-12T00:00:00Z",
  },
  {
    id: "inst-bog",
    name: "Bank of Ghana T-Bills",
    institutionType: "T-Bill / Govt",
    riskRating: "LOW",
    status: "APPROVED",
    approvalReference: "BRD/2026/03",
    approvedAt: "2026-01-12T00:00:00Z",
  },
  {
    id: "inst-fidelity",
    name: "Fidelity Bank",
    institutionType: "Commercial Bank",
    riskRating: "MEDIUM",
    status: "PENDING_APPROVAL",
    approvalReference: null,
    approvedAt: null,
  },
  {
    id: "inst-ecobank",
    name: "Ecobank Ghana",
    institutionType: "Commercial Bank",
    riskRating: "LOW",
    status: "APPROVED",
    approvalReference: "BRD/2026/05",
    approvedAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "inst-databank",
    name: "Databank EPACK",
    institutionType: "Fund Manager",
    riskRating: "HIGH",
    status: "SUSPENDED",
    approvalReference: null,
    approvedAt: null,
  },
];

export const SEED_PROPOSALS: InvestmentProposal[] = [
  {
    id: "prop-1",
    institutionId: "inst-gcb",
    principalAmount: 500000,
    interestRate: 21.5,
    proposedPlacementDate: "2026-07-01",
    proposedMaturityDate: "2027-01-01",
    purpose: "182-day fixed deposit",
    status: "BOARD_APPROVAL",
    reviewNotes: null,
  },
  {
    id: "prop-2",
    institutionId: "inst-bog",
    principalAmount: 1200000,
    interestRate: 24.9,
    proposedPlacementDate: "2026-07-10",
    proposedMaturityDate: "2027-07-10",
    purpose: "364-day T-Bill rollover",
    status: "APPROVED",
    reviewNotes: null,
  },
  {
    id: "prop-3",
    institutionId: "inst-fidelity",
    principalAmount: 250000,
    interestRate: 19.0,
    proposedPlacementDate: "2026-08-01",
    proposedMaturityDate: "2026-11-01",
    purpose: "91-day placement",
    status: "DRAFT",
    reviewNotes: null,
  },
];

export const SEED_POSITIONS: InvestmentPosition[] = [
  {
    id: "pos-1001",
    proposalId: null,
    institutionId: "inst-gcb",
    principalAmount: 500000,
    interestRate: 21.5,
    placementDate: "2026-01-05",
    maturityDate: "2026-07-05",
    linkedGlAccountId: 140101,
    status: "PLACED",
  },
  {
    id: "pos-1002",
    proposalId: null,
    institutionId: "inst-bog",
    principalAmount: 1200000,
    interestRate: 24.9,
    placementDate: "2025-07-10",
    maturityDate: "2026-07-10",
    linkedGlAccountId: 140102,
    status: "MATURED",
  },
  {
    id: "pos-1003",
    proposalId: null,
    institutionId: "inst-ecobank",
    principalAmount: 300000,
    interestRate: 18.0,
    placementDate: "2024-06-01",
    maturityDate: "2025-06-01",
    linkedGlAccountId: 140103,
    status: "CLOSED",
  },
];

export const SEED_ALERTS: InvestmentMaturityAlert[] = [
  {
    id: "alert-1",
    investmentPositionId: "pos-1001",
    alertDate: "2026-06-05",
    alertType: "MATURITY_30_DAYS",
    status: "SENT",
  },
  {
    id: "alert-2",
    investmentPositionId: "pos-1002",
    alertDate: "2026-06-28",
    alertType: "MATURITY_7_DAYS",
    status: "PENDING",
  },
  {
    id: "alert-3",
    investmentPositionId: "pos-1003",
    alertDate: "2026-05-20",
    alertType: "OVERDUE",
    status: "ACKNOWLEDGED",
  },
];

function snapshot(
  id: string,
  institutionId: string,
  exposure: number,
  total: number,
  allowed: number,
): InvestmentExposureSnapshot {
  const exposurePercent = total > 0 ? (exposure / total) * 100 : 0;
  return {
    id,
    institutionId,
    institutionExposureAmount: exposure,
    totalInvestmentsAmount: total,
    exposurePercent,
    allowedPercent: allowed,
    breach: exposurePercent > allowed,
    calculatedAt: "2026-06-27T00:00:00Z",
  };
}

export const SEED_EXPOSURE: InvestmentExposureSnapshot[] = [
  snapshot("exp-1", "inst-gcb", 500000, 2000000, 30),
  snapshot("exp-2", "inst-bog", 1200000, 2000000, 50),
  snapshot("exp-3", "inst-databank", 300000, 2000000, 10),
];
