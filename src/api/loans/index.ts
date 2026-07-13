// Loans domain — applications, active loans, and the product catalogue.
export * from "./types";

// Backend services — every endpoint hits the real API; offline/unreachable
// fallbacks return empty/zeroed shapes, never fixture data.
export { loanProductsApi } from "../backend/products";
export { loanAccountsApi } from "../backend/accounts";
export { loanReportsApi } from "../backend/reports";
export type {
  LoanOverview,
  ArrearsRow,
  ArrearsBucketKey,
  ArrearsReport,
  ArrearsParams,
  ActiveLoansReport,
  ApprovalsReport,
  ApprovalRow,
  DisbursementsReport,
  DisbursementQueueRow,
  DisbursementCompletedRow,
} from "../backend/reports";
export type {
  LoanAccountCreate,
  LoanAccountDetail,
  LoanRepaymentSchedule,
  RepaymentPeriodRow,
  LoanTransactionRow,
  LoanRepaymentResult,
  LoanRepaymentPreview,
  CreateLoanGuarantor,
  LoanGuarantorResult,
  LoanGuarantorDetails,
  CreateLoanCollateral,
  LoanCollateralResult,
} from "../backend/accounts";

/** Format a number as Ghana cedis, always showing exactly two decimals
 * (e.g. GH₵85,000.00) — figures are never rounded off to whole numbers. */
export const fmtGHS = (n: number) =>
  "GH₵" + n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
