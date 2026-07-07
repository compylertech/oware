// Transaction Operations service — maps to the "Transaction Operations" group.
//   GET  /transaction-operations             search (paged, filterable by
//                                             operationType/accountType/
//                                             localAccountId/status)
//   POST /transaction-operations/{id}/approve | reject
//
// Used today to back the account-lookup page's withdrawal-notices panel:
// a SAVINGS_WITHDRAWAL operation stuck in the approval workflow is what a
// "notice to withdraw" looks like on this backend. Approving posts the
// underlying withdrawal to Fineract (status -> POSTED); rejecting cancels it
// (status -> REJECTED) without touching the account balance.

import type { Page, TransactionOperationDto } from "./dto";
import { request, withMock } from "./http";

function content<T>(res: Page<T> | T[]): T[] {
  return Array.isArray(res) ? res : (res.content ?? res.items ?? []);
}

export type TransactionOperationSearch = {
  operationType?: string;
  accountType?: string;
  localAccountId?: string;
  status?: string;
  page?: number;
  size?: number;
};

export const transactionOperationsApi = {
  search(params: TransactionOperationSearch = {}): Promise<TransactionOperationDto[]> {
    const { page = 0, size = 20, ...rest } = params;
    return withMock(
      async () =>
        content(
          await request<Page<TransactionOperationDto>>("/transaction-operations", {
            query: { ...rest, page, size },
          }),
        ),
      () => [],
    );
  },

  approve(id: string, comments?: string): Promise<TransactionOperationDto | undefined> {
    return withMock(
      () =>
        request<TransactionOperationDto>(`/transaction-operations/${id}/approve`, {
          method: "POST",
          body: { comments },
        }),
      () => undefined,
    );
  },

  reject(id: string, comments?: string): Promise<TransactionOperationDto | undefined> {
    return withMock(
      () =>
        request<TransactionOperationDto>(`/transaction-operations/${id}/reject`, {
          method: "POST",
          body: { comments },
        }),
      () => undefined,
    );
  },
};
