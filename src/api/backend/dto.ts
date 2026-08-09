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
  legalFormCode?: string;
  genderCode?: string | null;
  dateOfBirth?: string | null;
  savingsProductCode?: string | null;
  submittedOnDate?: string;
  activeOnCreation?: boolean;
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

export type ClientUpdateDto = Partial<
  Pick<
    ClientCreateDto,
    | "officeCode"
    | "legalFormCode"
    | "firstName"
    | "middleName"
    | "lastName"
    | "mobileNumber"
    | "email"
    | "dateOfBirth"
    | "genderCode"
    | "savingsProductCode"
    | "externalId"
    | "submittedOnDate"
    | "activationDate"
    | "activeOnCreation"
    | "staff"
  >
>;

// GET /clients/{id}/addresses row shape (verified against a live instance -
// note this differs from the create/update payload shape below: it carries
// display names (addressType, stateName, countryName) and numeric Fineract
// ids, not the codes the write endpoints take).
export type ClientAddressDto = {
  clientId?: number;
  addressId?: number;
  addressType?: string; // e.g. "Home", "Office" - display name
  addressTypeId?: number;
  active?: boolean;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townVillage?: string;
  city?: string;
  countyDistrict?: string;
  stateProvinceId?: number;
  stateName?: string;
  countryId?: number;
  countryName?: string;
  postalCode?: string;
  createdOn?: string;
  updatedOn?: string;
};

/** POST/PUT /clients/{id}/addresses[/{addressId}] payload shape. */
export type ClientAddressWriteDto = {
  addressTypeCode: string; // e.g. "HOME", "OFFICE" - reference code
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  stateProvinceCode?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  active?: boolean;
};

/** GET /references?category=&provider= row shape. */
export type ReferenceValueDto = {
  id?: string;
  category?: string;
  provider?: string;
  code: string;
  name: string;
  providerId?: number;
  providerCode?: string | null;
  sourceType?: string;
  providerGroupId?: number;
  providerGroupName?: string;
  active?: boolean;
};

// GET /clients/{id}/family-members row shape (verified against a live
// instance - like addresses, this differs from the create/update payload: it
// carries display names (relationship, gender, maritalStatus, profession) and
// numeric Fineract ids, not the codes the write endpoint takes).
export type ClientFamilyMemberDto = {
  id?: number;
  clientId?: number;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  qualification?: string;
  relationshipId?: number;
  relationship?: string; // display name, e.g. "Father"
  maritalStatusId?: number;
  maritalStatus?: string;
  genderId?: number;
  gender?: string;
  dateOfBirth?: string;
  professionId?: number;
  profession?: string;
  mobileNumber?: string;
  age?: number;
  dependent?: boolean;
};

/** POST/PUT /clients/{id}/family-members[/{memberId}] payload shape. */
export type ClientFamilyMemberWriteDto = {
  firstName: string;
  middleName?: string;
  lastName: string;
  qualification?: string;
  age?: number;
  dependent?: boolean;
  relationshipCode?: string | null;
  genderCode?: string | null;
  professionCode?: string | null;
  maritalStatusCode?: string | null;
  dateOfBirth?: string | null;
};

// GET /clients/{id}/identifiers row shape (verified against a live instance -
// like addresses/family members, this differs from the create/update payload:
// it carries a display name + numeric Fineract id (documentTypeId,
// documentTypeName), not the documentTypeCode the write endpoint takes, and
// `status` arrives as a Fineract enum string, e.g.
// "clientIdentifierStatusType.active").
export type ClientIdentifierDto = {
  id?: number;
  clientId?: number;
  documentTypeId?: number;
  documentTypeName?: string;
  documentTypeActive?: boolean;
  documentTypeMandatory?: boolean;
  documentKey?: string;
  description?: string;
  status?: string;
};

/** POST/PUT /clients/{id}/identifiers[/{identifierId}] payload shape. */
export type ClientIdentifierWriteDto = {
  documentTypeCode: string; // reference code, e.g. "PASSPORT"
  status?: string; // e.g. "active" | "inactive"
  documentKey?: string;
  description?: string;
};

// GET /clients/{id}/notes row shape (verified against a live instance).
export type ClientNoteDto = {
  id?: number;
  clientId?: number;
  noteTypeId?: number;
  noteTypeCode?: string;
  noteTypeValue?: string;
  note?: string;
  createdById?: number;
  createdByUsername?: string;
  createdOn?: string; // ISO datetime
  updatedById?: number;
  updatedByUsername?: string;
  updatedOn?: string; // ISO datetime
};

/** POST/PUT /clients/{id}/notes[/{noteId}] payload shape. */
export type ClientNoteWriteDto = {
  note: string;
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
  // Loan product economics - repaymentFrequencyType/interestRateFrequencyType/
  // amortizationType/interestType/interestCalculationPeriodType arrive as
  // Fineract's raw internal numeric id (e.g. "2"), not the human string code
  // ("MONTHS") the create/update payload takes - verified live. Match against
  // a reference row's `providerId` to reverse-map back to the string code.
  principal?: number;
  minPrincipal?: number | null;
  maxPrincipal?: number | null;
  numberOfRepayments?: number;
  repaymentEvery?: number;
  repaymentFrequencyType?: string;
  annualNominalInterestRate?: number | null;
  interestRateFrequencyType?: string;
  amortizationType?: string;
  interestType?: string; // "0" declining balance | "1" flat
  interestCalculationPeriodType?: string;
  transactionProcessingStrategyCode?: string;
  // Savings product economics
  nominalAnnualInterestRate?: number;
  minRequiredOpeningBalance?: number | null;
  interestCompoundingPeriodType?: string;
  interestPostingPeriodType?: string;
  interestCalculationType?: string;
  interestCalculationDaysInYearType?: string;
  minRequiredBalance?: number | null;
  enforceMinRequiredBalance?: boolean;
  // Share product economics
  unitPrice?: number;
  totalShares?: number | null;
  nominalShares?: number | null;
  minimumShares?: number | null;
  maximumShares?: number | null;
  // Lock-in — shared by savings and share products.
  lockinPeriodFrequency?: number | null;
  lockinPeriodFrequencyType?: string | null;
  // Accounting — GET now returns the product's actual current configuration
  // (fixed on the backend; previously write-only). "NONE" when no accounting
  // is configured; GL fields are null when unmapped.
  accountingRule?: string;
  savingsReferenceAccountCode?: string | null;
  savingsControlAccountCode?: string | null;
  interestOnSavingsAccountCode?: string | null;
  transfersInSuspenseAccountCode?: string | null;
  writeOffAccountCode?: string | null;
  incomeFromFeeAccountCode?: string | null;
  incomeFromPenaltyAccountCode?: string | null;
  incomeFromInterestAccountCode?: string | null;
  overdraftPortfolioControlAccountCode?: string | null;
  fundSourceAccountCode?: string | null;
  loanPortfolioAccountCode?: string | null;
  interestOnLoanAccountCode?: string | null;
  incomeFromRecoveryAccountCode?: string | null;
  overpaymentLiabilityAccountCode?: string | null;
  receivableInterestAccountCode?: string | null;
  receivableFeeAccountCode?: string | null;
  receivablePenaltyAccountCode?: string | null;
  shareReferenceAccountCode?: string | null;
  shareSuspenseAccountCode?: string | null;
  shareEquityAccountCode?: string | null;
};

export type AccountDto = {
  id: string;
  clientId?: string;
  clientName?: string;
  accountNo?: string;
  externalId?: string | null;
  fineractLoanAccountId?: number;
  fineractSavingsAccountId?: number;
  productCode?: string;
  productName?: string;
  currencyCode?: string;
  principal?: number;
  balance?: number;
  accountBalance?: number;
  availableBalance?: number;
  status?: string;
  activationDate?: string;
  approvedDate?: string;
  activatedOnDate?: string;
  submittedOnDate?: string;
  closedOnDate?: string | null;
  syncedWithFineract?: boolean;
};

export type TransactionDto = {
  id: string | number;
  accountId?: number;
  accountNo?: string;
  type?: string;
  transactionTypeCode?: string; // e.g. "savingsAccountTransactionType.deposit"
  transactionTypeValue?: string; // e.g. "Deposit"
  amount?: number;
  currencyCode?: string;
  date?: string;
  transactionDate?: string;
  runningBalance?: number;
  note?: string;
  submittedByUsername?: string;
  reversed?: boolean;
};

// GET /loan-accounts/{loanAccountId} - a single loan's full detail (verified
// against a live instance). Note there's no clientName here, only clientId
// (this service's own UUID) - cross-reference the app-wide client registry.
export type LoanAccountDetailDto = {
  id: string;
  clientId?: string;
  fineractLoanAccountId?: number;
  fineractClientId?: number;
  fineractProductId?: number;
  accountNo: string;
  externalId?: string | null;
  productCode?: string;
  productName?: string;
  currencyCode?: string;
  principal?: number;
  approvedPrincipal?: number | null;
  disbursedPrincipal?: number | null;
  totalOutstanding?: number | null;
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
  transactionProcessingStrategyCode?: string;
  allowPartialPeriodInterestCalculation?: boolean;
  submittedOnDate?: string;
  approvedOnDate?: string | null;
  expectedDisbursementDate?: string | null;
  actualDisbursementDate?: string | null;
  closedOnDate?: string | null;
  status?: string;
  syncedWithFineract?: boolean;
};

// GET /loan-accounts/{loanAccountId}/repayment-schedule - verified against a
// live instance. The first period (periodNumber: null) is Fineract's
// disbursement-row convention, not a real installment.
export type LoanRepaymentPeriodDto = {
  periodNumber: number | null;
  fromDate: string | null;
  dueDate: string | null;
  principalDue: number | null;
  principalPaid: number | null;
  principalOutstanding: number | null;
  interestDue: number | null;
  interestPaid: number | null;
  interestOutstanding: number | null;
  feeChargesDue: number | null;
  feeChargesPaid: number | null;
  feeChargesOutstanding: number | null;
  penaltyChargesDue: number | null;
  penaltyChargesPaid: number | null;
  penaltyChargesOutstanding: number | null;
  totalDueForPeriod: number | null;
  totalPaidForPeriod: number | null;
  totalOutstandingForPeriod: number | null;
  totalOverdue: number | null;
  completed: boolean;
};

export type LoanRepaymentScheduleDto = {
  loanAccountId?: string;
  fineractLoanAccountId?: number;
  accountNo?: string;
  currencyCode?: string;
  loanTermInDays?: number;
  totalPrincipalExpected?: number;
  totalPrincipalPaid?: number;
  totalInterestCharged?: number;
  totalFeeChargesCharged?: number;
  totalPenaltyChargesCharged?: number;
  totalRepaymentExpected?: number;
  totalRepayment?: number;
  totalOutstanding?: number;
  periods?: LoanRepaymentPeriodDto[];
};

// GET /loan-accounts/{loanAccountId}/transactions/history - a flat array,
// verified against a live instance. Neither this nor repayment-schedule
// actually respect limit/offset (confirmed live - same full result either
// way), so pagination for both is done client-side.
export type LoanTransactionHistoryItemDto = {
  transactionId: number;
  transactionDate: string;
  transactionType: string;
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  penalty: number;
  reversed: boolean;
};

// POST /loan-accounts/{loanAccountId}/transactions/repayment - the posted
// transaction shape here differs from the savings TransactionDto (loan-
// specific *Portion fields + outstandingLoanBalance instead of a running
// balance), verified against a live instance.
export type LoanRepaymentTransactionDto = {
  id: number;
  loanId: number;
  transactionTypeCode?: string;
  transactionTypeValue?: string;
  transactionDate: string;
  currencyCode?: string;
  amount: number;
  principalPortion?: number;
  interestPortion?: number;
  feeChargesPortion?: number;
  penaltyChargesPortion?: number;
  outstandingLoanBalance?: number;
  reversed?: boolean;
  submittedByUsername?: string | null;
  note?: string | null;
};

export type LoanRepaymentResultDto = {
  operationId?: string;
  status?: string;
  transaction: LoanRepaymentTransactionDto;
};

// GET /loan-accounts/{loanAccountId}/transactions/preview?amount= -
// allocation preview for a prospective repayment, verified against a live
// instance.
export type LoanRepaymentPreviewDto = {
  loanId?: number;
  amount?: number;
  penalty?: number;
  interest?: number;
  fees?: number;
  principal?: number;
  totalApplied?: number;
};

// POST /loan-accounts/{loanAccountId}/guarantors - verified against a live
// instance. entityId for guarantorTypeCode "CUSTOMER" is the guarantor's own
// Fineract client id (Client.fineractClientId in this app), not our UUID.
export type CreateLoanGuarantorDto = {
  guarantorTypeCode: string;
  clientRelationshipTypeCode: string;
  entityId: number;
  savingsId?: number;
  amount?: number;
};

export type LoanGuarantorResultDto = {
  fineractOfficeId?: number;
  fineractLoanAccountId?: number;
  fineractGuarantorId?: number;
};

// GET /loan-accounts/{loanAccountId}/guarantors - verified against a live
// instance.
export type LoanGuarantorDetailsDto = {
  fineractGuarantorId: number;
  fineractLoanAccountId?: number;
  clientRelationshipTypeName?: string;
  guarantorTypeCode?: string;
  guarantorTypeValue?: string;
  firstName?: string;
  lastName?: string;
  entityId?: number;
  officeName?: string;
  joinedDate?: string;
  status?: boolean;
  externalGuarantor?: boolean;
  existingClient?: boolean;
  staffMember?: boolean;
};

// POST/GET /loan-accounts/{loanAccountId}/collaterals - verified against a
// live instance. GET now exists (previously creation-only).
export type CreateLoanCollateralDto = {
  collateralTypeCode: string;
  value: number;
  description?: string;
};

export type LoanCollateralResultDto = {
  fineractLoanAccountId?: number;
  fineractCollateralId?: number;
  collateralTypeCode?: string;
  value?: number;
  description?: string;
};

/** POST /savings-accounts/{ref}/transactions/deposit|withdrawal response -
 * wraps the resulting transaction with the async-review operation's id/status
 * (mirrors the transaction-operations workflow; POSTED means it went straight
 * through, anything else means it's pending review). */
export type MoneyTransactionResultDto = {
  operationId?: string;
  status?: string;
  transaction: TransactionDto;
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

/** GET /loan-accounts/reports/applications response - `total` is the count
 * across the whole filtered result set, not just this page's `applications`. */
export type ApplicationsReportDto = {
  stage?: string;
  statusId?: number;
  total?: number;
  limit?: number;
  offset?: number;
  applications?: ApplicationRowDto[];
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

/** GET /loan-accounts/reports/active response - summary stats alongside the
 * loan rows (verified against a live instance). */
export type ActiveLoansReportDto = {
  totalOutstanding?: number;
  onTimeCount?: number;
  inArrearsCount?: number;
  avgLoanSize?: number;
  totalLoans?: number;
  loans?: ActiveLoanRowDto[];
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

/** GET /loan-accounts/reports/approvals response. */
export type ApprovalsReportDto = {
  count?: number;
  totalAmount?: number;
  limit?: number;
  offset?: number;
  approvals?: ApprovalRowDto[];
};

// GET /loan-accounts/reports/disbursements - shapes verified against
// /v3/api-docs/all's LoanDisbursementsResponseDto/DisbursementQueueItemDto/
// DisbursementCompletedItemDto. `loanId` is only populated when full=false;
// full=true (Fineract's richer report) omits it, exposing accountNo only.
export type DisbursementQueueItemDto = {
  loanId?: number | null;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  approvedAmount?: number;
  approvedDate?: string;
  officerName?: string | null;
  daysSinceApproval?: number;
  officeName?: string | null;
  currency?: string | null;
  fundName?: string | null;
  loanPurpose?: string | null;
  termFrequency?: number | null;
  termFrequencyPeriod?: string | null;
  annualNominalInterestRate?: number | null;
  expectedDisbursalDate?: string | null;
  daysToDisbursal?: number | null;
};

export type DisbursementCompletedItemDto = {
  loanId?: number | null;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  disbursedAmount?: number;
  disbursedDate?: string;
  daysAgo?: number | null;
  officeName?: string | null;
  currency?: string | null;
  fundName?: string | null;
  annualNominalInterestRate?: number | null;
  totalLoanAmount?: number | null;
  totalRepaidAmount?: number | null;
};

export type DisbursementsReportDto = {
  full?: boolean;
  limit?: number;
  offset?: number;
  awaitingCount?: number;
  awaitingAmount?: number;
  todayCount?: number;
  todayAmount?: number;
  thisWeekCount?: number;
  thisWeekAmount?: number;
  pending?: DisbursementQueueItemDto[];
  recentlyDisbursed?: DisbursementCompletedItemDto[];
};

// GET /loan-accounts/reports/arrears - verified against a live instance.
// `bucket`/`limit`/`offset` narrow `arrears`/`filteredCount` only; the
// summary fields (parAmount, bucketXCount/Amount, etc.) always cover every
// loan in arrears regardless of the filter.
export type ArrearsItemDto = {
  loanId: number;
  accountNo?: string;
  clientName?: string;
  productName?: string;
  principalOutstanding?: number;
  interestOutstanding?: number;
  principalOverdue?: number;
  interestOverdue?: number;
  totalOverdue?: number;
  overdueSince?: string;
  daysOverdue?: number;
  daysToNextDue?: number;
};

export type LoanArrearsReportDto = {
  parAmount?: number;
  parPercent?: number;
  loansInArrears?: number;
  avgDaysOverdue?: number;
  bucket1to30Count?: number;
  bucket1to30Amount?: number;
  bucket31to60Count?: number;
  bucket31to60Amount?: number;
  bucket61to90Count?: number;
  bucket61to90Amount?: number;
  bucket90PlusCount?: number;
  bucket90PlusAmount?: number;
  bucket?: string | null;
  filteredCount?: number;
  limit?: number;
  offset?: number;
  arrears?: ArrearsItemDto[];
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
    collectionTransactionCount?: number;
  };
  pipeline?: Record<string, { count?: number; amount?: number }>;
  arrearsAging?: Record<string, { count?: number; amount?: number }>;
};

// GET /clients/{id}/accounts row shapes (verified against a live instance) -
// a combined loan/savings/share summary for a client.
export type LoanAccountSummaryDto = {
  id: number;
  accountNo?: string;
  productId?: number;
  productName?: string;
  statusCode?: string;
  statusValue?: string;
  currencyCode?: string;
  inArrears?: boolean;
  originalLoan?: number;
  loanBalance?: number;
  amountPaid?: number;
  submittedOnDate?: string;
  expectedDisbursementDate?: string;
};

export type SavingsAccountSummaryDto = {
  id: number;
  accountNo?: string;
  productId?: number;
  productName?: string;
  statusCode?: string;
  statusValue?: string;
  currencyCode?: string;
  accountBalance?: number;
  submittedOnDate?: string;
  activatedOnDate?: string;
};

export type ShareAccountSummaryDto = {
  id: number;
  accountNo?: string;
  productId?: number;
  productName?: string;
  statusCode?: string;
  statusValue?: string;
  currencyCode?: string;
  totalApprovedShares?: number;
  totalPendingForApprovalShares?: number;
  submittedOnDate?: string;
  activatedOnDate?: string;
};

export type ClientAccountsSummaryDto = {
  loanAccounts?: LoanAccountSummaryDto[];
  savingsAccounts?: SavingsAccountSummaryDto[];
  shareAccounts?: ShareAccountSummaryDto[];
};

/**
 * GET /share-accounts (search/get) shape - distinct from {@link ShareAccountSummaryDto}
 * (the lighter accounts-summary rendering, whose `id` is Fineract's numeric
 * core ID). Here `id` is this service's own UUID, which is what
 * `/share-accounts/{id}/...` action endpoints (apply-additional-shares,
 * approve, activate) expect as the path param.
 */
export type ShareAccountDto = {
  id: string;
  clientId?: string;
  fineractShareAccountId?: number;
  accountNo?: string;
  externalId?: string | null;
  productCode?: string;
  productName?: string;
  currencyCode?: string;
  unitPrice?: number;
  requestedShares?: number;
  totalApprovedShares?: number;
  totalPendingShares?: number;
  status?: string;
  submittedOnDate?: string;
  approvedOnDate?: string;
  activatedOnDate?: string;
  syncedWithFineract?: boolean;
};

/** POST /share-accounts payload shape (per the endpoint's own validation). */
export type ShareAccountCreateDto = {
  clientId: string;
  productCode: string;
  requestedShares: number;
  externalId?: string | null;
  submittedOnDate?: string;
};

/** POST /share-accounts/{shareAccountId}/apply-additional-shares payload. */
export type ShareAccountApplyAdditionalSharesDto = {
  requestedShares: number;
  requestedDate: string;
};

/** Idempotency-keyed action payload (approve/activate/close/disburse). */
export type ActionDto = { actionDate?: string; comments?: string };

// ── Transaction Operations (async withdrawal/deposit review workflow) ──────

export type TransactionOperationStatus =
  | "RECEIVED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PROCESSING"
  | "POSTED"
  | "FAILED"
  | "REJECTED"
  | "UNKNOWN"
  | "REVERSED";

/** GET /transaction-operations row shape - `localAccountId` is this
 * service's own account UUID (matches AccountDto.id / ShareAccountDto.id). */
export type TransactionOperationDto = {
  id: string;
  operationType: string;
  accountType: string;
  localAccountId?: string;
  fineractAccountId?: number;
  amount: number;
  currencyCode?: string;
  transactionDate: string;
  note?: string | null;
  status: TransactionOperationStatus | string;
  failureReason?: string | null;
  reviewComments?: string | null;
};

// ── Dashboard ────────────────────────────────────────────────────────────────
// GET /dashboard/client-growth | transaction-volume | summary - verified
// against a live instance. `month` is 1-indexed. Sparse months (zero activity)
// are simply absent from the growth/volume arrays, not returned as zero rows.

export type ClientGrowthPointDto = {
  year: number;
  month: number;
  newClientsCount: number;
};

export type TransactionVolumePointDto = {
  year: number;
  month: number;
  transactionCount: number;
  netVolume: number;
  variance: number;
};

export type DashboardSummaryDto = {
  totalClients: number;
  activeAccounts: number;
  depositsThisMonth: number;
  pendingKycCount: number;
};

// ── Ledger ───────────────────────────────────────────────────────────────────
// GET /ledger/entries - one row per journal-entry leg (a single deposit posts
// a debit leg and a credit leg, so it's two rows here), verified against a
// live instance. accountNo/clientName are legitimately null for manual/
// adjusting GL entries with no linked account - render blank, not an error.
export type LedgerEntryDto = {
  accountNo: string | null;
  clientName: string | null;
  debit: number | null;
  credit: number | null;
  narration: string;
  status: "Completed" | "Reversed" | string;
  date: string;
  officeName: string;
};

// ── Product creation ────────────────────────────────────────────────────────
// POST /savings-products | /loan-products | /share-products - verified
// against a live instance. Each creates directly in Fineract, syncs into the
// local catalogue, and returns the synced record (same shape as GET /{id},
// i.e. ProductDto). Reference-code fields (currencyCode, frequency types,
// etc.) reject invalid codes with a clean 400 rather than a raw passthrough.
// GL accounting fields are only required when accountingRule != "NONE".
// GET /{id} was originally write-only for accounting/GL/lock-in/share-count
// fields (confirmed live), but that's since been fixed backend-side - GET now
// returns the product's real current configuration for all of these.
// shortName and nominalAnnualInterestRate are listed as optional in the API
// doc, but confirmed live to actually be enforced as required - a create
// without them 400s ("shortName is mandatory" / "nominalAnnualInterestRate
// is mandatory").
export type CreateSavingsProductDto = {
  name: string;
  shortName: string;
  description?: string;
  currencyCode: string;
  nominalAnnualInterestRate: number;
  inMultiplesOf?: number;
  interestCompoundingPeriodType?: string;
  interestPostingPeriodType?: string;
  interestCalculationType?: string;
  interestCalculationDaysInYearType?: string;
  minRequiredOpeningBalance?: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: string;
  minRequiredBalance?: number;
  enforceMinRequiredBalance?: boolean;
  // Only required when accountingRule != "NONE".
  accountingRule?: string;
  savingsReferenceAccountCode?: string;
  savingsControlAccountCode?: string;
  interestOnSavingsAccountCode?: string;
  transfersInSuspenseAccountCode?: string;
  writeOffAccountCode?: string;
  incomeFromFeeAccountCode?: string;
  incomeFromPenaltyAccountCode?: string;
  incomeFromInterestAccountCode?: string;
  overdraftPortfolioControlAccountCode?: string;
};

// numberOfRepayments/repaymentEvery/repaymentFrequencyType/
// interestRatePerPeriod/interestRateFrequencyType/amortizationType/
// interestType/interestCalculationPeriodType are all required - same set as
// LoanAccountCreate, since a loan account's terms default from the product.
// shortName is listed as optional in the API doc, but confirmed live to
// actually be required - a create without it 400s.
export type CreateLoanProductDto = {
  name: string;
  shortName: string;
  description?: string;
  currencyCode: string;
  principal: number;
  minPrincipal?: number;
  maxPrincipal?: number;
  numberOfRepayments: number;
  minNumberOfRepayments?: number;
  maxNumberOfRepayments?: number;
  repaymentEvery: number;
  repaymentFrequencyType: string;
  interestRatePerPeriod: number;
  minInterestRatePerPeriod?: number;
  maxInterestRatePerPeriod?: number;
  interestRateFrequencyType: string;
  amortizationType: string;
  interestType: string;
  interestCalculationPeriodType: string;
  transactionProcessingStrategyCode?: string;
  // Only required when accountingRule != "NONE".
  accountingRule?: string;
  fundSourceAccountCode?: string;
  loanPortfolioAccountCode?: string;
  transfersInSuspenseAccountCode?: string;
  interestOnLoanAccountCode?: string;
  incomeFromFeeAccountCode?: string;
  incomeFromPenaltyAccountCode?: string;
  incomeFromRecoveryAccountCode?: string;
  writeOffAccountCode?: string;
  overpaymentLiabilityAccountCode?: string;
  receivableInterestAccountCode?: string;
  receivableFeeAccountCode?: string;
  receivablePenaltyAccountCode?: string;
};

// shortName is Fineract-enforced max 4 characters.
export type CreateShareProductDto = {
  name: string;
  shortName: string;
  description: string;
  currencyCode: string;
  totalShares: number;
  nominalShares: number;
  minimumShares?: number;
  maximumShares?: number;
  unitPrice: number;
  lockinPeriodFrequency?: number;
  lockinPeriodFrequencyType?: string;
  // Only required when accountingRule != "NONE".
  accountingRule?: string;
  shareReferenceAccountCode?: string;
  shareSuspenseAccountCode?: string;
  shareEquityAccountCode?: string;
  incomeFromFeeAccountCode?: string;
};

// PUT /savings-products/{id} | /loan-products/{id} | /share-products/{id} -
// genuinely partial, verified live: every field is optional, and an omitted
// field is left exactly as-is (there's no way to unset/clear a field back to
// null, only set a new value). GL account fields resolve independently of
// accountingRule - you can update a single GL mapping without resending
// accountingRule or any other field. `code` is derived from shortName at
// creation and is never editable, even though shortName itself can change.
export type UpdateSavingsProductDto = Partial<CreateSavingsProductDto>;
export type UpdateLoanProductDto = Partial<CreateLoanProductDto>;
export type UpdateShareProductDto = Partial<CreateShareProductDto>;
