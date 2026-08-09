// Products service - maps to the "Loan Products" and "Savings Products" groups.
//   POST /loan-products/sync        POST /savings-products/sync
//   GET  /loan-products             GET  /savings-products
//   GET  /loan-products/{code}      GET  /savings-products/{code}
//
// The Products sidebar (Loans / Savings) reads its catalogue from here. Share
// products (GET /share-products) back the Cooperative shares step - note the
// SHARE_PRODUCT reference category's `code` field ("MEMBER_SHARES") does NOT
// match the real product code ("MSHR"); use this list instead of that reference
// when you need a submittable productCode.

import type { LoanProduct } from "../loans/types";
import type {
  CreateLoanProductDto,
  CreateSavingsProductDto,
  CreateShareProductDto,
  Page,
  ProductDto,
  UpdateLoanProductDto,
  UpdateSavingsProductDto,
  UpdateShareProductDto,
} from "./dto";
import { request, withMock } from "./http";
import { mapLoanProduct } from "./mappers";

function content<T>(res: Page<T> | T[]): T[] {
  return Array.isArray(res) ? res : (res.content ?? res.items ?? []);
}

export const loanProductsApi = {
  list(): Promise<LoanProduct[]> {
    return withMock(
      async () => {
        const res = await request<Page<ProductDto> | ProductDto[]>("/loan-products", {
          query: { page: 0, size: 50 },
        });
        return content(res).map(mapLoanProduct);
      },
      () => [],
    );
  },

  get(code: string): Promise<LoanProduct | undefined> {
    return withMock(
      async () => mapLoanProduct(await request<ProductDto>(`/loan-products/${code}`)),
      () => undefined,
    );
  },

  /** Pull the latest product catalogue from the core (Fineract) into the service. */
  sync(): Promise<void> {
    return withMock(
      () => request<void>("/loan-products/sync", { method: "POST" }),
      () => undefined,
    );
  },

  /** Raw products (numeric principal/repayment economics + the submittable
   * `code`) - the loan application wizard needs these to prefill Loan
   * Details/Repayment defaults, which the presentational `list()` above
   * throws away in favor of display strings. */
  listRaw(): Promise<ProductDto[]> {
    return withMock(
      async () => {
        const res = await request<Page<ProductDto> | ProductDto[]>("/loan-products", {
          query: { page: 0, size: 50 },
        });
        return content(res);
      },
      () => [],
    );
  },

  create(body: CreateLoanProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>("/loan-products", { method: "POST", body }),
      () => undefined,
    );
  },

  /** Unmapped product detail (raw economics + submittable `code`), used to
   * seed the edit form - `get()` above throws that away via mapLoanProduct. */
  getRaw(productId: string): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/loan-products/${productId}`),
      () => undefined,
    );
  },

  /** Partial update - accepts either the id or `code` as productId. Only
   * fields present in `body` are changed; everything else is left as-is. */
  update(productId: string, body: UpdateLoanProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/loan-products/${productId}`, { method: "PUT", body }),
      () => undefined,
    );
  },
};

export const savingsProductsApi = {
  /** Raw savings products; the Savings sidebar keeps its own presentational copy. */
  list(): Promise<ProductDto[]> {
    return withMock(
      async () => {
        const res = await request<Page<ProductDto> | ProductDto[]>("/savings-products", {
          query: { page: 0, size: 50 },
        });
        return content(res);
      },
      () => [],
    );
  },

  get(code: string): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/savings-products/${code}`),
      () => undefined,
    );
  },

  sync(): Promise<void> {
    return withMock(
      () => request<void>("/savings-products/sync", { method: "POST" }),
      () => undefined,
    );
  },

  create(body: CreateSavingsProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>("/savings-products", { method: "POST", body }),
      () => undefined,
    );
  },

  /** Partial update - accepts either the id or `code` as productId. Only
   * fields present in `body` are changed; everything else is left as-is. */
  update(productId: string, body: UpdateSavingsProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/savings-products/${productId}`, { method: "PUT", body }),
      () => undefined,
    );
  },
};

export const shareProductsApi = {
  list(): Promise<ProductDto[]> {
    return withMock(
      async () => {
        const res = await request<Page<ProductDto> | ProductDto[]>("/share-products", {
          query: { page: 0, size: 50 },
        });
        return content(res);
      },
      () => [],
    );
  },

  /** Accepts either the numeric Fineract product id or the product code. */
  get(ref: string | number): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/share-products/${ref}`),
      () => undefined,
    );
  },

  create(body: CreateShareProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>("/share-products", { method: "POST", body }),
      () => undefined,
    );
  },

  /** Partial update - accepts either the id or `code` as productId. Only
   * fields present in `body` are changed; everything else is left as-is. */
  update(productId: string, body: UpdateShareProductDto): Promise<ProductDto | undefined> {
    return withMock(
      () => request<ProductDto>(`/share-products/${productId}`, { method: "PUT", body }),
      () => undefined,
    );
  },
};
