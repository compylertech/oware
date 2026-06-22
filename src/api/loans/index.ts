// Loans domain — applications, active loans, and the product catalogue.
export * from "./types";
export { APPLICATIONS, ACTIVE_LOANS, PRODUCTS, WIZARD_PRODUCTS } from "./data";

/** Format a number as Ghana cedis with no decimals (e.g. GH₵85,000). */
export const fmtGHS = (n: number) =>
  "GH₵" + n.toLocaleString("en-GH", { maximumFractionDigits: 0 });
