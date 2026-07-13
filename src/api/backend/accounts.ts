// Accounts service — maps to the "Savings Accounts", "Savings Transactions",
// "Loan Accounts" and "Loan Transactions" groups of the Postman collection.
//
// Covers the account lifecycle the sidebar exercises: create → approve →
// activate/disburse → close, plus deposits/withdrawals and loan repayments.
// When offline these resolve to empty lists / no-ops so nothing throws in the UI.

import type {
  AccountDto,
  ActionDto,
  CreateLoanCollateralDto,
  CreateLoanGuarantorDto,
  LoanAccountDetailDto,
  LoanCollateralResultDto,
  LoanGuarantorDetailsDto,
  LoanGuarantorResultDto,
  LoanRepaymentPeriodDto,
  LoanRepaymentPreviewDto,
  LoanRepaymentResultDto,
  LoanRepaymentScheduleDto,
  LoanTransactionHistoryItemDto,
  MoneyTransactionResultDto,
  Page,
  ShareAccountApplyAdditionalSharesDto,
  ShareAccountCreateDto,
  ShareAccountDto,
  ShareAccountSummaryDto,
  TransactionDto,
} from "./dto";
import { request, withMock } from "./http";

export type LoanAccountDetail = {
  id: string;
  clientId: string;
  accountNo: string;
  productCode: string;
  productName: string;
  currencyCode: string;
  principal: number;
  totalOutstanding: number;
  status: string;
  interestRatePerPeriod: number;
  interestRateFrequencyType: string;
  loanTermFrequency: number;
  loanTermFrequencyType: string;
  numberOfRepayments: number;
  submittedOnDate: string;
  approvedOnDate: string | null;
  expectedDisbursementDate: string | null;
  actualDisbursementDate: string | null;
  closedOnDate: string | null;
};

function mapLoanAccountDetail(dto: LoanAccountDetailDto): LoanAccountDetail {
  return {
    id: dto.id,
    clientId: dto.clientId ?? "",
    accountNo: dto.accountNo,
    productCode: dto.productCode ?? "",
    productName: dto.productName ?? "—",
    currencyCode: dto.currencyCode ?? "",
    principal: dto.principal ?? 0,
    totalOutstanding: dto.totalOutstanding ?? 0,
    status: dto.status ?? "",
    interestRatePerPeriod: dto.interestRatePerPeriod ?? 0,
    interestRateFrequencyType: dto.interestRateFrequencyType ?? "",
    loanTermFrequency: dto.loanTermFrequency ?? 0,
    loanTermFrequencyType: dto.loanTermFrequencyType ?? "",
    numberOfRepayments: dto.numberOfRepayments ?? 0,
    submittedOnDate: dto.submittedOnDate ?? "",
    approvedOnDate: dto.approvedOnDate ?? null,
    expectedDisbursementDate: dto.expectedDisbursementDate ?? null,
    actualDisbursementDate: dto.actualDisbursementDate ?? null,
    closedOnDate: dto.closedOnDate ?? null,
  };
}

export type RepaymentPeriodRow = {
  periodNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  total: number;
  totalPaid: number;
  status: "Paid" | "Overdue" | "Upcoming";
};

function mapRepaymentPeriod(dto: LoanRepaymentPeriodDto): RepaymentPeriodRow | null {
  // periodNumber: null is Fineract's disbursement-row convention, not a
  // real installment — skip it.
  if (dto.periodNumber == null) return null;
  return {
    periodNumber: dto.periodNumber,
    dueDate: dto.dueDate ?? "",
    principal: dto.principalDue ?? 0,
    interest: dto.interestDue ?? 0,
    total: dto.totalDueForPeriod ?? 0,
    totalPaid: dto.totalPaidForPeriod ?? 0,
    status: dto.completed ? "Paid" : (dto.totalOverdue ?? 0) > 0 ? "Overdue" : "Upcoming",
  };
}

export type LoanRepaymentSchedule = {
  totalPrincipalExpected: number;
  totalInterestCharged: number;
  totalRepaymentExpected: number;
  totalRepayment: number;
  totalOutstanding: number;
  periods: RepaymentPeriodRow[];
};

export type LoanTransactionRow = {
  id: number;
  date: string;
  type: string;
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  penalty: number;
  reversed: boolean;
};

function mapLoanTransaction(dto: LoanTransactionHistoryItemDto): LoanTransactionRow {
  return {
    id: dto.transactionId,
    date: dto.transactionDate,
    type: dto.transactionType,
    amount: dto.amount ?? 0,
    principal: dto.principal ?? 0,
    interest: dto.interest ?? 0,
    fees: dto.fees ?? 0,
    penalty: dto.penalty ?? 0,
    reversed: dto.reversed ?? false,
  };
}

export type LoanRepaymentResult = {
  operationId: string;
  status: string;
  transaction: {
    id: number;
    date: string;
    amount: number;
    principal: number;
    interest: number;
    fees: number;
    penalty: number;
    outstandingBalance: number;
    reversed: boolean;
  };
};

function mapLoanRepaymentResult(dto: LoanRepaymentResultDto): LoanRepaymentResult {
  const t = dto.transaction;
  return {
    operationId: dto.operationId ?? "",
    status: dto.status ?? "",
    transaction: {
      id: t.id,
      date: t.transactionDate,
      amount: t.amount ?? 0,
      principal: t.principalPortion ?? 0,
      interest: t.interestPortion ?? 0,
      fees: t.feeChargesPortion ?? 0,
      penalty: t.penaltyChargesPortion ?? 0,
      outstandingBalance: t.outstandingLoanBalance ?? 0,
      reversed: t.reversed ?? false,
    },
  };
}

export type LoanRepaymentPreview = {
  penalty: number;
  interest: number;
  fees: number;
  principal: number;
  totalApplied: number;
};

function mapLoanRepaymentPreview(dto: LoanRepaymentPreviewDto): LoanRepaymentPreview {
  return {
    penalty: dto.penalty ?? 0,
    interest: dto.interest ?? 0,
    fees: dto.fees ?? 0,
    principal: dto.principal ?? 0,
    totalApplied: dto.totalApplied ?? 0,
  };
}

export type CreateLoanGuarantor = {
  guarantorTypeCode: string;
  clientRelationshipTypeCode: string;
  /** For guarantorTypeCode "CUSTOMER" this is the guarantor's own
   * Fineract client id (Client.fineractClientId), not our app's UUID. */
  entityId: number;
  savingsId?: number;
  amount?: number;
};

export type LoanGuarantorResult = {
  officeId: number;
  loanAccountId: number;
  guarantorId: number;
};

function mapLoanGuarantorResult(dto: LoanGuarantorResultDto): LoanGuarantorResult {
  return {
    officeId: dto.fineractOfficeId ?? 0,
    loanAccountId: dto.fineractLoanAccountId ?? 0,
    guarantorId: dto.fineractGuarantorId ?? 0,
  };
}

export type LoanGuarantorDetails = {
  id: number;
  name: string;
  guarantorType: string;
  relationshipType: string;
  entityId: number | null;
  officeName: string;
  joinedDate: string;
  active: boolean;
  existingClient: boolean;
};

function mapLoanGuarantorDetails(dto: LoanGuarantorDetailsDto): LoanGuarantorDetails {
  return {
    id: dto.fineractGuarantorId,
    name: [dto.firstName, dto.lastName].filter(Boolean).join(" ") || "—",
    guarantorType: dto.guarantorTypeValue ?? dto.guarantorTypeCode ?? "—",
    relationshipType: dto.clientRelationshipTypeName ?? "—",
    entityId: dto.entityId ?? null,
    officeName: dto.officeName ?? "—",
    joinedDate: dto.joinedDate ?? "",
    active: dto.status ?? false,
    existingClient: dto.existingClient ?? false,
  };
}

export type CreateLoanCollateral = {
  collateralTypeCode: string;
  value: number;
  description?: string;
};

export type LoanCollateralResult = {
  loanAccountId: number;
  collateralId: number;
  collateralTypeCode: string;
  value: number;
  description: string;
};

function mapLoanCollateralResult(dto: LoanCollateralResultDto): LoanCollateralResult {
  return {
    loanAccountId: dto.fineractLoanAccountId ?? 0,
    collateralId: dto.fineractCollateralId ?? 0,
    collateralTypeCode: dto.collateralTypeCode ?? "",
    value: dto.value ?? 0,
    description: dto.description ?? "",
  };
}

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
  deposit(ref: string, body: MoneyTxn): Promise<MoneyTransactionResultDto | undefined> {
    return withMock(
      () =>
        request<MoneyTransactionResultDto>(`/savings-accounts/${ref}/transactions/deposit`, {
          method: "POST",
          body,
        }),
      () => undefined,
    );
  },
  withdrawal(ref: string, body: MoneyTxn): Promise<MoneyTransactionResultDto | undefined> {
    return withMock(
      () =>
        request<MoneyTransactionResultDto>(`/savings-accounts/${ref}/transactions/withdrawal`, {
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
  // Single-loan detail (header/summary), distinct from get() above which
  // returns the leaner AccountDto shape used elsewhere.
  detail(ref: string): Promise<LoanAccountDetail | undefined> {
    return withMock(
      async () =>
        mapLoanAccountDetail(await request<LoanAccountDetailDto>(`/loan-accounts/${ref}`)),
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
  // Note: the backend does not actually honor limit/offset on this endpoint
  // (confirmed live — full result returned regardless), but we still send
  // them per spec/future-proofing; pagination is applied client-side by callers.
  repaymentScheduleDetailed(
    ref: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<LoanRepaymentSchedule | undefined> {
    return withMock(
      async () => {
        const dto = await request<LoanRepaymentScheduleDto>(
          `/loan-accounts/${ref}/repayment-schedule`,
          { query: params },
        );
        const periods = (dto.periods ?? [])
          .map(mapRepaymentPeriod)
          .filter((p): p is RepaymentPeriodRow => p !== null);
        return {
          totalPrincipalExpected: dto.totalPrincipalExpected ?? 0,
          totalInterestCharged: dto.totalInterestCharged ?? 0,
          totalRepaymentExpected: dto.totalRepaymentExpected ?? 0,
          totalRepayment: dto.totalRepayment ?? 0,
          totalOutstanding: dto.totalOutstanding ?? 0,
          periods,
        };
      },
      () => undefined,
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
  // Note: the backend does not actually honor limit/offset here either
  // (confirmed live); pagination is applied client-side by callers.
  historyDetailed(
    ref: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<LoanTransactionRow[]> {
    return withMock(
      async () => {
        const items = await request<LoanTransactionHistoryItemDto[]>(
          `/loan-accounts/${ref}/transactions/history`,
          { query: params },
        );
        return (items ?? []).map(mapLoanTransaction);
      },
      () => [],
    );
  },
  repayment(
    ref: string,
    body: Omit<MoneyTxn, "paymentTypeCode">,
  ): Promise<LoanRepaymentResult | undefined> {
    return withMock(
      async () =>
        mapLoanRepaymentResult(
          await request<LoanRepaymentResultDto>(`/loan-accounts/${ref}/transactions/repayment`, {
            method: "POST",
            body,
          }),
        ),
      () => undefined,
    );
  },
  // GET, not a write — no Idempotency-Key needed; a preview doesn't post anything.
  repaymentPreview(ref: string, amount: number): Promise<LoanRepaymentPreview | undefined> {
    return withMock(
      async () =>
        mapLoanRepaymentPreview(
          await request<LoanRepaymentPreviewDto>(`/loan-accounts/${ref}/transactions/preview`, {
            query: { amount },
          }),
        ),
      () => undefined,
    );
  },
  guarantors(ref: string): Promise<LoanGuarantorDetails[]> {
    return withMock(
      async () => {
        const dtos = await request<LoanGuarantorDetailsDto[]>(`/loan-accounts/${ref}/guarantors`);
        return (dtos ?? []).map(mapLoanGuarantorDetails);
      },
      () => [],
    );
  },
  addGuarantor(ref: string, body: CreateLoanGuarantor): Promise<LoanGuarantorResult | undefined> {
    return withMock(
      async () =>
        mapLoanGuarantorResult(
          await request<LoanGuarantorResultDto>(`/loan-accounts/${ref}/guarantors`, {
            method: "POST",
            body,
          }),
        ),
      () => undefined,
    );
  },
  collaterals(ref: string): Promise<LoanCollateralResult[]> {
    return withMock(
      async () => {
        const dtos = await request<LoanCollateralResultDto[]>(`/loan-accounts/${ref}/collaterals`);
        return (dtos ?? []).map(mapLoanCollateralResult);
      },
      () => [],
    );
  },
  addCollateral(
    ref: string,
    body: CreateLoanCollateral,
  ): Promise<LoanCollateralResult | undefined> {
    return withMock(
      async () =>
        mapLoanCollateralResult(
          await request<LoanCollateralResultDto>(`/loan-accounts/${ref}/collaterals`, {
            method: "POST",
            body,
          }),
        ),
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
  search(
    params: { clientId?: string; page?: number; size?: number } = {},
  ): Promise<ShareAccountDto[]> {
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
