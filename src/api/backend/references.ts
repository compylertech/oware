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
// SHARE_PRODUCT, COLLATERAL_TYPE, GUARANTOR_TYPE, CLIENT_RELATIONSHIP_TYPE.

import type { ReferenceValueDto } from "./dto";
import { request, withMock } from "./http";

// Reference values (address types, genders, closure reasons, ...) rarely
// change within a session, but nearly every form on the client detail page
// and the add/edit wizard asks for the same handful of categories. Cache the
// in-flight/resolved promise per category+provider so repeated calls across
// components share one network request instead of firing one each — this is
// a module-level cache, so it persists for the lifetime of the page (cleared
// on full reload) and is shared by every caller.
const cache = new Map<string, Promise<ReferenceValueDto[]>>();

function cacheKey(category: string, provider: string): string {
  return `${provider}:${category}`;
}

export const referencesApi = {
  list(category: string, provider = "FINERACT"): Promise<ReferenceValueDto[]> {
    const key = cacheKey(category, provider);
    const cached = cache.get(key);
    if (cached) return cached;

    const promise = withMock(
      () => request<ReferenceValueDto[]>("/references", { query: { category, provider } }),
      () => [],
    );
    // Don't let a failed request poison the cache — the next caller should retry.
    promise.catch(() => cache.delete(key));
    cache.set(key, promise);
    return promise;
  },

  sync(category: string, provider = "FINERACT"): Promise<void> {
    return withMock(
      () => request<void>("/references/sync", { method: "POST", body: { category } }),
      () => undefined,
    ).then(() => {
      // The backend just refreshed this category — drop our cache so the next
      // list() call picks up the new values instead of the stale cached list.
      cache.delete(cacheKey(category, provider));
    });
  },
};
