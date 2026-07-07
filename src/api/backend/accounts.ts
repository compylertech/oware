// Accounts service — maps to the "Savings Accounts", "Savings Transactions",
// "Loan Accounts" and "Loan Transactions" groups of the Postman collection.
//
// Covers the account lifecycle the sidebar exercises: create → approve →
// activate/disburse → close, plus deposits/withdrawals and loan repayments.
// When offline these resolve to empty lists / no-ops so nothing throws in the UI.

import type {
  AccountDto,
  ActionDto,
  Page,
  ShareAccountApplyAdditionalSharesDto,
  ShareAccountCreateDto,
  ShareAccountDto,
  ShareAccountSummaryDto,
  TransactionDto,
} from "./dto";
import { request, withMock } from "./http";

function content<T>(res: Page<T> | T[]): T[] {
  return Array.isArray(res) ? res : (res.content ?? res.items ?? []);
}

export type SavingsAccountCreate = {
  clientId: string;
  productCode: string;
  externalId?: string | null;
  submittedOnDate?: string;
};

export type LoanAccountCreate = {
  clientId: string;
  productCode: string;
  principal: number;
  loanType?: string;
  loanTermFrequency?: number;
  loanTermFrequencyType?: string;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: string;
  interestRatePerPeriod?: number;
  interestRateFrequencyType?: string;
  amortizationType?: string;
  interestType?: string;
  interestCalculationPeriodType?: string;
  submittedOnDate?: string;
  expectedDisbursementDate?: string;
};

export type MoneyTxn = {
  amount: number;
  transactionDate: string;
  paymentTypeCode?: string | null;
  note?: string;
  approvalRequired?: boolean;
};

export type SavingsAccountSearch = {
  keyword?: string;
  clientId?: string;
  productCode?: string;
  status?: string;
  page?: number;
  size?: number;
};

export const savingsAccountsApi = {
  search(params: SavingsAccountSearch = {}): Promise<AccountDto[]> {
    const { keyword, clientId, productCode, status, page = 0, size = 20 } = params;
    return withMock(
      async () =>
        content(
          await request<Page<AccountDto>>("/savings-accounts", {
            query: { keyword, clientId, productCode, status, page, size },
          }),
        ),
      () => [],
    );
  },
  get(ref: string): Promise<AccountDto | undefined> {
    return withMock(
      () => request<AccountDto>(`/savings-accounts/${ref}`),
      () => undefined,
    );
  },
  create(body: SavingsAccountCreate): Promise<AccountDto | undefined> {
    return withMock(
      () => request<AccountDto>("/savings-accounts", { method: "POST", body }),
      () => undefined,
    );
  },
  approve(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/savings-accounts/${ref}/approve`, { method: "POST", body }),
      () => undefined,
    );
  },
  activate(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/savings-accounts/${ref}/activate`, { method: "POST", body }),
      () => undefined,
    );
  },
  close(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/savings-accounts/${ref}/close`, { method: "POST", body }),
      () => undefined,
    );
  },
  transactions(
    ref: string,
    params: { fromSubmittedDate?: string; toSubmittedDate?: string } = {},
  ): Promise<TransactionDto[]> {
    const { fromSubmittedDate, toSubmittedDate } = params;
    return withMock(
      async () =>
        content(
          await request<Page<TransactionDto> | TransactionDto[]>(
            `/savings-accounts/${ref}/transactions`,
            {
              query: { fromSubmittedDate, toSubmittedDate },
            },
          ),
        ),
      () => [],
    );
  },
  deposit(ref: string, body: MoneyTxn) {
    return withMock(
      () =>
        request<TransactionDto>(`/savings-accounts/${ref}/transactions/deposit`, {
          method: "POST",
          body,
        }),
      () => undefined,
    );
  },
  withdrawal(ref: string, body: MoneyTxn) {
    return withMock(
      () =>
        request<TransactionDto>(`/savings-accounts/${ref}/transactions/withdrawal`, {
          method: "POST",
          body,
        }),
      () => undefined,
    );
  },
};

export const loanAccountsApi = {
  search(page = 0, size = 20): Promise<AccountDto[]> {
    return withMock(
      async () =>
        content(await request<Page<AccountDto>>("/loan-accounts", { query: { page, size } })),
      () => [],
    );
  },
  byClient(clientId: string): Promise<AccountDto[]> {
    return withMock(
      () => request<AccountDto[]>(`/loan-accounts/by-client/${clientId}`),
      () => [],
    );
  },
  get(ref: string): Promise<AccountDto | undefined> {
    return withMock(
      () => request<AccountDto>(`/loan-accounts/${ref}`),
      () => undefined,
    );
  },
  details(ref: string, include: "summary" | "repaymentSchedule" | "all" = "all") {
    return withMock(
      () => request<AccountDto>(`/loan-accounts/${ref}/details`, { query: { include } }),
      () => undefined,
    );
  },
  create(body: LoanAccountCreate): Promise<AccountDto | undefined> {
    return withMock(
      () => request<AccountDto>("/loan-accounts", { method: "POST", body }),
      () => undefined,
    );
  },
  approve(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/loan-accounts/${ref}/approve`, { method: "POST", body }),
      () => undefined,
    );
  },
  reject(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/loan-accounts/${ref}/reject`, { method: "POST", body }),
      () => undefined,
    );
  },
  disburse(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/loan-accounts/${ref}/disburse`, { method: "POST", body }),
      () => undefined,
    );
  },
  close(ref: string, body: ActionDto = {}) {
    return withMock(
      () => request<void>(`/loan-accounts/${ref}/close`, { method: "POST", body }),
      () => undefined,
    );
  },
  repaymentSchedule(ref: string) {
    return withMock(
      () => request<unknown>(`/loan-accounts/${ref}/repayment-schedule`),
      () => null,
    );
  },
  transactions(ref: string): Promise<TransactionDto[]> {
    return withMock(
      () => request<TransactionDto[]>(`/loan-accounts/${ref}/transactions`),
      () => [],
    );
  },
  history(ref: string): Promise<TransactionDto[]> {
    return withMock(
      () => request<TransactionDto[]>(`/loan-accounts/${ref}/transactions/history`),
      () => [],
    );
  },
  repayment(ref: string, body: Omit<MoneyTxn, "paymentTypeCode">) {
    return withMock(
      () =>
        request<TransactionDto>(`/loan-accounts/${ref}/transactions/repayment`, {
          method: "POST",
          body,
        }),
      () => undefined,
    );
  },
};

// Share accounts — request cooperative shares for a client. clientsApi.accountsSummary()
// remains the source for the lightweight read-only position shown on the
// client detail page (its `id` is Fineract's numeric core ID, not usable
// here); search() below is what resolves the actual UUID that action
// endpoints (apply-additional-shares, approve, activate) require as the path
// param.
//
// A client can only have one share account per product: the first request for
// a given product must use create(); once that account exists, further share
// requests for the same product must go through applyAdditionalShares()
// instead (create() would reject a second account for the same product).
export const shareAccountsApi = {
  search(params: { clientId?: string; page?: number; size?: number } = {}): Promise<
    ShareAccountDto[]
  > {
    const { clientId, page = 0, size = 20 } = params;
    return withMock(
      async () =>
        content(
          await request<Page<ShareAccountDto>>("/share-accounts", {
            query: { clientId, page, size },
          }),
        ),
      () => [],
    );
  },
  create(body: ShareAccountCreateDto): Promise<ShareAccountSummaryDto | undefined> {
    return withMock(
      () => request<ShareAccountSummaryDto>("/share-accounts", { method: "POST", body }),
      () => undefined,
    );
  },
  /** `shareAccountId` must be this service's UUID (see {@link ShareAccountDto.id}),
   * not Fineract's numeric core ID — resolve it via search() first. */
  applyAdditionalShares(
    shareAccountId: string,
    body: ShareAccountApplyAdditionalSharesDto,
  ): Promise<ShareAccountDto | undefined> {
    return withMock(
      () =>
        request<ShareAccountDto>(`/share-accounts/${shareAccountId}/apply-additional-shares`, {
          method: "POST",
          body,
        }),
      () => undefined,
    );
  },
};
