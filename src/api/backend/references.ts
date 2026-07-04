// References service — maps to the "References" group of the Postman collection.
//   GET  /references?category=&provider=
//   POST /references/sync
//
// Backs reference-value dropdowns (address type, gender, office, etc.) across
// the app. Categories: OFFICE, LEGAL_FORM, ADDRESS_TYPE, COUNTRY, STATE,
// GENDER, RELATIONSHIP, PROFESSION, MARITAL_STATUS, CUSTOMER_IDENTIFIER,
// PAYMENT_TYPE, CLIENT_TYPE, CLIENT_CLASSIFICATION, CLIENT_CONSTITUTION,
// CLIENT_MAIN_BUSINESS_LINE, CLIENT_CLOSURE_REASON, CLIENT_REJECT_REASON,
// CLIENT_WITHDRAW_REASON, LOAN_TYPE, LOAN_TERM_FREQUENCY_TYPE,
// LOAN_REPAYMENT_FREQUENCY_TYPE, LOAN_INTEREST_RATE_FREQUENCY_TYPE,
// LOAN_AMORTIZATION_TYPE, LOAN_INTEREST_TYPE,
// LOAN_INTEREST_CALCULATION_PERIOD_TYPE,
// LOAN_TRANSACTION_PROCESSING_STRATEGY, SAVINGS_PRODUCT, LOAN_PRODUCT,
// SHARE_PRODUCT.

import type { ReferenceValueDto } from "./dto";
import { request, withMock } from "./http";

export const referencesApi = {
  list(category: string, provider = "FINERACT"): Promise<ReferenceValueDto[]> {
    return withMock(
      () => request<ReferenceValueDto[]>("/references", { query: { category, provider } }),
      () => [],
    );
  },

  sync(category: string): Promise<void> {
    return withMock(
      () => request<void>("/references/sync", { method: "POST", body: { category } }),
      () => undefined,
    );
  },
};
