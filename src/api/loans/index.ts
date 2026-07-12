// Loans domain — applications, active loans, and the product catalogue.
export * from "./types";
export { APPLICATIONS, ACTIVE_LOANS, PRODUCTS, WIZARD_PRODUCTS } from "./data";

// Backend services (fall back to the seed fixtures above when offline).
export { loanProductsApi } from "../backend/products";
export { loanAccountsApi } from "../backend/accounts";
export { loanReportsApi } from "../backend/reports";
export type {
  LoanOverview,
  ArrearsRow,
  ArrearsBucket,
  ActiveLoansReport,
  ApprovalsReport,
  ApprovalRow,
  DisbursementsReport,
  DisbursementQueueRow,
  DisbursementCompletedRow,
} from "../backend/reports";
export type { LoanAccountCreate } from "../backend/accounts";

/** Format a number as Ghana cedis with no decimals (e.g. GH₵85,000). */
export const fmtGHS = (n: number) =>
  "GH₵" + n.toLocaleString("en-GH", { maximumFractionDigits: 0 });
