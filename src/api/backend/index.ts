// Backend integration barrel.
//
// A single `api` object exposes every corebanking-starter service the app needs
// today: clients, loan/savings products, loan/savings accounts (incl.
// transactions) and loan reporting. Import it anywhere:
//
//   import { api } from "@/api/backend";
//   const clients = await api.clients.search({ keyword: "mensah" });
//
// Every call transparently falls back to the in-memory seed fixtures when the
// backend is unreachable (see config.ts / http.ts), so the UI never breaks when
// running without a server. Point it at a real backend with VITE_API_BASE_URL.

export * from "./config";
export * from "./dto";
export { ApiError, BackendUnavailable, apiErrorMessage } from "./http";
export { clientsApi } from "./clients";
export type {
  ClientAccountsSummaryDto,
  ClientAddressDto,
  ClientAddressWriteDto,
  ClientFamilyMemberDto,
  ClientFamilyMemberWriteDto,
  ClientIdentifierDto,
  ClientIdentifierWriteDto,
  ClientNoteDto,
  ClientNoteWriteDto,
  ClientUpdateDto,
} from "./clients";
export { loanProductsApi, savingsProductsApi, shareProductsApi } from "./products";
export { loanAccountsApi, savingsAccountsApi, shareAccountsApi } from "./accounts";
export { loanReportsApi } from "./reports";
export type { LoanOverview } from "./reports";
export type { SavingsAccountCreate, LoanAccountCreate, MoneyTxn } from "./accounts";
export type { ClientSearch } from "./clients";
export { referencesApi } from "./references";

import { clientsApi } from "./clients";
import { loanProductsApi, savingsProductsApi, shareProductsApi } from "./products";
import { loanAccountsApi, savingsAccountsApi, shareAccountsApi } from "./accounts";
import { loanReportsApi } from "./reports";
import { referencesApi } from "./references";

/** Aggregate API surface grouped by domain. */
export const api = {
  clients: clientsApi,
  loanProducts: loanProductsApi,
  savingsProducts: savingsProductsApi,
  shareProducts: shareProductsApi,
  loanAccounts: loanAccountsApi,
  savingsAccounts: savingsAccountsApi,
  shareAccounts: shareAccountsApi,
  loanReports: loanReportsApi,
  references: referencesApi,
};

export type Api = typeof api;
