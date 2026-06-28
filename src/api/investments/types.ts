// Investments domain types — mirror the backend module
// com.obenyaade.cooperative.modules.investments. Enums match the Java enum
// constants verbatim so payloads map 1:1 when the real backend is wired.

// ---- Institutions ----
export type InstitutionRiskRating = "LOW" | "MEDIUM" | "HIGH" | "PROHIBITED";
export type InvestmentInstitutionStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED"
  | "CLOSED";

export type InvestmentInstitution = {
  id: string;
  name: string;
  institutionType: string;
  riskRating: InstitutionRiskRating;
  status: InvestmentInstitutionStatus;
  approvalReference: string | null;
  approvedAt: string | null; // ISO instant
};

export type NewInstitution = {
  name: string;
  institutionType: string;
  riskRating: InstitutionRiskRating;
};

// ---- Proposals ----
export type InvestmentProposalStatus =
  | "DRAFT"
  | "TREASURER_REVIEW"
  | "RISK_REVIEW"
  | "BOARD_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PLACED"
  | "CANCELLED";

export type InvestmentProposal = {
  id: string;
  institutionId: string;
  principalAmount: number;
  interestRate: number;
  proposedPlacementDate: string; // ISO date
  proposedMaturityDate: string; // ISO date
  purpose: string;
  status: InvestmentProposalStatus;
  reviewNotes: string | null;
};

export type NewProposal = {
  institutionId: string;
  principalAmount: number;
  interestRate: number;
  proposedPlacementDate: string;
  proposedMaturityDate: string;
  purpose: string;
};

// ---- Positions ----
export type InvestmentPositionStatus =
  | "APPROVED"
  | "PLACED"
  | "MATURED"
  | "ROLLED_OVER"
  | "CLOSED"
  | "CANCELLED";

export type InvestmentPosition = {
  id: string;
  proposalId: string | null;
  institutionId: string;
  principalAmount: number;
  interestRate: number;
  placementDate: string; // ISO date
  maturityDate: string; // ISO date
  linkedGlAccountId: number;
  status: InvestmentPositionStatus;
};

export type NewPosition = {
  proposalId?: string | null;
  institutionId: string;
  principalAmount: number;
  interestRate: number;
  placementDate: string;
  maturityDate: string;
  linkedGlAccountId: number;
};

// ---- Maturity alerts ----
export type MaturityAlertType =
  | "MATURITY_30_DAYS"
  | "MATURITY_14_DAYS"
  | "MATURITY_7_DAYS"
  | "MATURITY_DUE"
  | "OVERDUE";
export type MaturityAlertStatus = "PENDING" | "SENT" | "ACKNOWLEDGED" | "CANCELLED";

export type InvestmentMaturityAlert = {
  id: string;
  investmentPositionId: string;
  alertDate: string; // ISO date
  alertType: MaturityAlertType;
  status: MaturityAlertStatus;
};

export type NewMaturityAlert = {
  investmentPositionId: string;
  alertDate: string;
  alertType: MaturityAlertType;
};

// ---- Exposure monitoring ----
export type InvestmentExposureSnapshot = {
  id: string;
  institutionId: string;
  institutionExposureAmount: number;
  totalInvestmentsAmount: number;
  exposurePercent: number; // derived
  allowedPercent: number;
  breach: boolean; // derived
  calculatedAt: string; // ISO instant
};

export type NewExposureSnapshot = {
  institutionId: string;
  institutionExposureAmount: number;
  totalInvestmentsAmount: number;
  allowedPercent: number;
};

// ---- Enum option lists (for selects) ----
export const RISK_RATINGS: InstitutionRiskRating[] = ["LOW", "MEDIUM", "HIGH", "PROHIBITED"];
export const ALERT_TYPES: MaturityAlertType[] = [
  "MATURITY_30_DAYS",
  "MATURITY_14_DAYS",
  "MATURITY_7_DAYS",
  "MATURITY_DUE",
  "OVERDUE",
];
export const INSTITUTION_TYPES = [
  "Commercial Bank",
  "Rural Bank",
  "T-Bill / Govt",
  "Fund Manager",
  "SDI",
];
