// Backend DTO shapes as actually returned by the corebanking-starter API
// (verified against a live instance). Responses are wrapped in a
// `{ success, message, data, error }` envelope which the transport unwraps to
// `data`. Paged endpoints return a Spring `Page` ({ content, totalElements… }).
// Report endpoints return an object whose list lives under an endpoint-specific
// key (loans / applications / approvals / pending / arrears).

/** Standard response envelope. The transport returns `data`. */
export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: unknown;
  data?: T;
} & Record<string, unknown>;

/** Spring Data pageable response. */
export type Page<T> = {
  content?: T[];
  items?: T[];
  totalElements?: number;
  totalPages?: number;
  page?: number;
  number?: number;
  size?: number;
};

export type ClientDto = {
  id: string;
  fineractClientId?: number;
  accountNo?: string;
  externalId?: string | null;
  displayName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
  officeCode?: string;
  officeName?: string;
  type?: string; // PERSON | BUSINESS
  status?: string; // ACTIVE | PENDING | …
  activationDate?: string;
  staff?: boolean;
  syncedWithFineract?: boolean;
};

export type ClientCreateDto = {
  officeCode: string;
  legalFormCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  mobileNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  genderCode?: string | null;
  savingsProductCode?: string | null;
  externalId?: string | null;
  submittedOnDate?: string;
  activationDate?: string;
  activeOnCreation?: boolean;
  staff?: boolean;
};

export type ProductDto = {
  id?: string;
  fineractProductId?: number;
  code: string;
  name: string;
  shortName?: string;
  description?: string | null;
  currencyCode?: string;
  status?: string; // ACTIVE | INACTIVE
  active?: boolean;
  // Loan product economics (Fineract-coded fields arrive as strings)
  principal?: number;
  minPrincipal?: number | null;
  maxPrincipal?: number | null;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: string;
  annualNominalInterestRate?: number | null;
  interestType?: string; // "0" declining balance | "1" flat
  // Savings product economics
  nominalAnnualInterestRate?: number;
  minRequiredOpeningBalance?: number;
};

export type AccountDto = {
  id: string;
  clientId?: string;
  accountNo?: string;
  externalId?: string | null;
  fineractLoanAccountId?: number;
  fineractSavingsAccountId?: number;
  productCode?: string;
  productName?: string;
  currencyCode?: string;
  principal?: number;
  balance?: number;
  status?: string;
  syncedWithFineract?: boolean;
};

export type TransactionDto = {
  id: string | number;
  type?: string;
  amount?: number;
  date?: string;
  transactionDate?: string;
  runningBalance?: number;
  note?: string;
  reversed?: boolean;
};

// ── Loan reporting rows (one shape per endpoint) ────────────────────────────

export type ApplicationRowDto = {
  loanId: number;
  accountNo?: string;
  clientId?: number | string;
  clientName?: string;
  amount?: number;
  submittedDate?: string;
  statusId?: number;
  statusName?: string;
  productName?: string;
  officerName?: string | null;
};

export type ActiveLoanRowDto = {
  loanId: number;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  principalAmount?: number;
  outstandingBalance?: number;
  principalRepaid?: number;
  maturityDate?: string | null;
  nextDueDate?: string | null;
  statusLabel?: string;
  repaidPercent?: number;
};

export type ApprovalRowDto = {
  loanId: number;
  accountNo?: string;
  clientName?: string;
  loanProductName?: string;
  amount?: number;
  submittedDate?: string;
  officerName?: string | null;
  daysWaiting?: number;
};

export type DisbursementRowDto = {
  loanId: number;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  approvedAmount?: number;
  approvedDate?: string;
  officerName?: string | null;
  daysSinceApproval?: number;
};

export type ArrearsRowDto = {
  loanId: number;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  principalOutstanding?: number;
  interestOutstanding?: number;
  totalOverdue?: number;
  overdueSince?: string;
  daysOverdue?: number;
};

/** `reports/overview` payload (the fields the UI cares about). */
export type OverviewDto = {
  stats?: {
    activeLoansCount?: number;
    activeLoansOutstanding?: number;
    pendingDisbursementsCount?: number;
    pendingDisbursementsAmount?: number;
    arrearsCount?: number;
    arrearsAmount?: number;
    par30Rate?: number;
    collectionsThisMonth?: number;
  };
  pipeline?: Record<string, { count?: number; amount?: number }>;
};

/** Idempotency-keyed action payload (approve/activate/close/disburse). */
export type ActionDto = { actionDate?: string; comments?: string };
