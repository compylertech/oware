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

// GET /clients/{id}/addresses row shape (verified against a live instance —
// note this differs from the create/update payload shape below: it carries
// display names (addressType, stateName, countryName) and numeric Fineract
// ids, not the codes the write endpoints take).
export type ClientAddressDto = {
  clientId?: number;
  addressId?: number;
  addressType?: string; // e.g. "Home", "Office" — display name
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
  addressTypeCode: string; // e.g. "HOME", "OFFICE" — reference code
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
// instance — like addresses, this differs from the create/update payload: it
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

// GET /clients/{id}/identifiers row shape (verified against a live instance —
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
  // Share product economics
  unitPrice?: number;
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

/** POST /savings-accounts/{ref}/transactions/deposit|withdrawal response —
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
    collectionTransactionCount?: number;
  };
  pipeline?: Record<string, { count?: number; amount?: number }>;
  arrearsAging?: Record<string, { count?: number; amount?: number }>;
};

// GET /clients/{id}/accounts row shapes (verified against a live instance) —
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
 * GET /share-accounts (search/get) shape — distinct from {@link ShareAccountSummaryDto}
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

/** GET /transaction-operations row shape — `localAccountId` is this
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
