// Transaction Operations service — maps to the "Transaction Operations" group.
//   GET /transaction-operations   search (paged, filterable by operationType/
//                                  accountType/localAccountId/status)
//
// Used today to back the account-lookup page's withdrawal-notices panel:
// a SAVINGS_WITHDRAWAL operation stuck in the approval workflow is what a
// "notice to withdraw" looks like on this backend.

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
};
