// Loan reporting service — maps to the "Loan Reporting" group.
//   GET /loan-accounts/reports/overview | active | disbursements | arrears |
//       applications | approvals
//
// Each endpoint returns an object whose row list lives under an
// endpoint-specific key (loans / applications / approvals / pending / arrears).
// Live responses are mapped to the UI's LoanApplication / ActiveLoan types;
// offline they return the seed fixtures so the screens render identically.

import type { ActiveLoan, LoanApplication } from "../loans/types";
import { ACTIVE_LOANS, APPLICATIONS } from "../loans/data";
import type {
  ActiveLoanRowDto,
  ActiveLoansReportDto,
  ApplicationsReportDto,
  ApprovalRowDto,
  ApprovalsReportDto,
  ArrearsRowDto,
  DisbursementCompletedItemDto,
  DisbursementQueueItemDto,
  DisbursementsReportDto,
  OverviewDto,
} from "./dto";
import { request, withMock } from "./http";
import { mapActiveLoan, mapApplication, mapArrears } from "./mappers";

export type PipelineStage = { count: number; amount: number };

export type ApprovalRow = {
  loanId: number;
  accountNo: string;
  client: string;
  product: string;
  amount: number;
  submittedDate: string;
  officer: string;
  daysWaiting: number;
};

function mapApprovalRow(dto: ApprovalRowDto): ApprovalRow {
  return {
    loanId: dto.loanId,
    accountNo: dto.accountNo ?? String(dto.loanId),
    client: dto.clientName ?? "—",
    product: dto.loanProductName ?? "—",
    amount: dto.amount ?? 0,
    submittedDate: dto.submittedDate ?? "",
    officer: dto.officerName || "—",
    daysWaiting: dto.daysWaiting ?? 0,
  };
}

export type ApprovalsReport = {
  count: number;
  totalAmount: number;
  rows: ApprovalRow[];
};

export type DisbursementQueueRow = {
  loanId: number | null;
  accountNo: string;
  client: string;
  product: string;
  amount: number;
  approvedDate: string;
  officer: string;
  daysSinceApproval: number;
  officeName: string;
  expectedDisbursalDate: string;
  daysToDisbursal: number | null;
};

function mapDisbursementQueueRow(dto: DisbursementQueueItemDto): DisbursementQueueRow {
  return {
    loanId: dto.loanId ?? null,
    accountNo: dto.accountNo ?? String(dto.loanId ?? ""),
    client: dto.clientName ?? "—",
    product: dto.productName ?? "—",
    amount: dto.approvedAmount ?? 0,
    approvedDate: dto.approvedDate ?? "",
    officer: dto.officerName || "—",
    daysSinceApproval: dto.daysSinceApproval ?? 0,
    officeName: dto.officeName ?? "—",
    expectedDisbursalDate: dto.expectedDisbursalDate ?? "",
    daysToDisbursal: dto.daysToDisbursal ?? null,
  };
}

export type DisbursementCompletedRow = {
  loanId: number | null;
  accountNo: string;
  client: string;
  product: string;
  amount: number;
  disbursedDate: string;
  daysAgo: number | null;
  officeName: string;
};

function mapDisbursementCompletedRow(dto: DisbursementCompletedItemDto): DisbursementCompletedRow {
  return {
    loanId: dto.loanId ?? null,
    accountNo: dto.accountNo ?? String(dto.loanId ?? ""),
    client: dto.clientName ?? "—",
    product: dto.productName ?? "—",
    amount: dto.disbursedAmount ?? 0,
    disbursedDate: dto.disbursedDate ?? "",
    daysAgo: dto.daysAgo ?? null,
    officeName: dto.officeName ?? "—",
  };
}

export type DisbursementsReport = {
  awaitingCount: number;
  awaitingAmount: number;
  todayCount: number;
  todayAmount: number;
  thisWeekCount: number;
  thisWeekAmount: number;
  pending: DisbursementQueueRow[];
  recentlyDisbursed: DisbursementCompletedRow[];
};

export type ActiveLoansReport = {
  totalOutstanding: number;
  onTimeCount: number;
  inArrearsCount: number;
  avgLoanSize: number;
  totalLoans: number;
  loans: ActiveLoan[];
};

export type LoanOverview = {
  activeCount: number;
  activeAmount: number;
  pendingApprovals: number;
  arrears: number;
  // Richer stats used by the loans landing tiles (0 when unavailable).
  pendingDisbCount: number;
  pendingDisbAmount: number;
  par30Rate: number;
  arrearsAmount: number;
  collections: number;
  pipeline: Record<string, PipelineStage>;
  arrearsAging: Record<string, PipelineStage>;
};

function stageMap(dto?: Record<string, { count?: number; amount?: number }>): Record<string, PipelineStage> {
  const out: Record<string, PipelineStage> = {};
  for (const [k, v] of Object.entries(dto ?? {})) {
    out[k] = { count: v.count ?? 0, amount: v.amount ?? 0 };
  }
  return out;
}

export const loanReportsApi = {
  overview(): Promise<LoanOverview> {
    return withMock(
      async () => {
        const dto = await request<OverviewDto>("/loan-accounts/reports/overview");
        const stats = dto.stats ?? {};
        return {
          activeCount: stats.activeLoansCount ?? 0,
          activeAmount: stats.activeLoansOutstanding ?? 0,
          pendingApprovals: dto.pipeline?.submitted?.count ?? 0,
          arrears: stats.arrearsCount ?? 0,
          pendingDisbCount: stats.pendingDisbursementsCount ?? 0,
          pendingDisbAmount: stats.pendingDisbursementsAmount ?? 0,
          par30Rate: stats.par30Rate ?? 0,
          arrearsAmount: stats.arrearsAmount ?? 0,
          collections: stats.collectionsThisMonth ?? 0,
          pipeline: stageMap(dto.pipeline),
          arrearsAging: stageMap(dto.arrearsAging),
        };
      },
      () => ({
        activeCount: ACTIVE_LOANS.filter((l) => l.status !== "Closed").length,
        activeAmount: ACTIVE_LOANS.reduce((s, l) => s + l.outstanding, 0),
        pendingApprovals: APPLICATIONS.filter((a) => a.stage === "Under Review").length,
        arrears: ACTIVE_LOANS.filter((l) => l.status === "In Arrears").length,
        pendingDisbCount: APPLICATIONS.filter((a) => a.stage === "To Disburse").length,
        pendingDisbAmount: APPLICATIONS.filter((a) => a.stage === "To Disburse").reduce(
          (s, a) => s + a.amount,
          0,
        ),
        par30Rate: 0,
        arrearsAmount: ACTIVE_LOANS.filter((l) => l.status === "In Arrears").reduce(
          (s, l) => s + l.outstanding,
          0,
        ),
        collections: 0,
        pipeline: {},
        arrearsAging: {},
      }),
    );
  },

  active(
    params: {
      /** Validated against the LOAN_PRODUCT reference category's own `code`
       * (e.g. "HOUSING_LOAN") — NOT the loan product catalogue's short code
       * ("HLN"); an unrecognized code 400s. */
      loanProductCode?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<ActiveLoansReport> {
    const { loanProductCode, limit = 20, offset = 0 } = params;
    return withMock(
      async () => {
        const dto = await request<ActiveLoansReportDto>("/loan-accounts/reports/active", {
          query: { loanProductCode, limit, offset },
        });
        return {
          totalOutstanding: dto.totalOutstanding ?? 0,
          onTimeCount: dto.onTimeCount ?? 0,
          inArrearsCount: dto.inArrearsCount ?? 0,
          avgLoanSize: dto.avgLoanSize ?? 0,
          totalLoans: dto.totalLoans ?? 0,
          loans: (dto.loans ?? []).map(mapActiveLoan),
        };
      },
      () => ({
        totalOutstanding: ACTIVE_LOANS.reduce((s, l) => s + l.outstanding, 0),
        onTimeCount: ACTIVE_LOANS.filter((l) => l.status !== "In Arrears").length,
        inArrearsCount: ACTIVE_LOANS.filter((l) => l.status === "In Arrears").length,
        avgLoanSize: ACTIVE_LOANS.length
          ? ACTIVE_LOANS.reduce((s, l) => s + l.outstanding, 0) / ACTIVE_LOANS.length
          : 0,
        totalLoans: ACTIVE_LOANS.length,
        loans: ACTIVE_LOANS,
      }),
    );
  },

  applications(
    params: {
      stage?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
      /** Filters to a single office (validated server-side against the OFFICE
       * reference category — an unknown code 400s). */
      officeCode?: string;
      /** Loan officers are modeled as staff clients; this is that client's
       * Fineract numeric id. Accepts string or number. */
      loanOfficerId?: string | number;
      /** Validated against the LOAN_PRODUCT reference category's own code
       * (e.g. "AUTO_LOAN") — NOT the product catalogue's short code
       * ("ALN"); confirmed live, same as Active Loans' loanProductCode. */
      loanProductCode?: string;
    } = {},
  ): Promise<LoanApplication[]> {
    const {
      stage,
      fromDate,
      toDate,
      limit = 20,
      offset = 0,
      officeCode,
      loanOfficerId,
      loanProductCode,
    } = params;
    return withMock(
      async () => {
        const dto = await request<ApplicationsReportDto>("/loan-accounts/reports/applications", {
          query: { stage, fromDate, toDate, limit, offset, officeCode, loanOfficerId, loanProductCode },
        });
        return (dto.applications ?? []).map(mapApplication);
      },
      () => APPLICATIONS,
    );
  },

  /** Total application count across the whole (unfiltered) result set —
   * cheap to fetch with limit=1 since we only need `total`, not the rows. */
  applicationsTotal(): Promise<number> {
    return withMock(
      async () => {
        const dto = await request<ApplicationsReportDto>("/loan-accounts/reports/applications", {
          query: { limit: 1, offset: 0 },
        });
        return dto.total ?? 0;
      },
      () => APPLICATIONS.length,
    );
  },

  /** Loans awaiting approval. Fetches one larger batch (default limit=10)
   * rather than trusting a "total" field for true offset paging — other
   * report endpoints here (active) turned out to mirror the page size
   * instead of a grand total, so pagination is done client-side to be safe. */
  approvals(params: { limit?: number; offset?: number } = {}): Promise<ApprovalsReport> {
    const { limit = 10, offset = 0 } = params;
    return withMock(
      async () => {
        const dto = await request<ApprovalsReportDto>("/loan-accounts/reports/approvals", {
          query: { limit, offset },
        });
        return {
          count: dto.count ?? 0,
          totalAmount: dto.totalAmount ?? 0,
          rows: (dto.approvals ?? []).map(mapApprovalRow),
        };
      },
      () => {
        const rows = APPLICATIONS.filter(
          (a) => a.stage === "Under Review" || a.stage === "Submitted",
        ).map(
          (a): ApprovalRow => ({
            loanId: 0,
            accountNo: a.id,
            client: a.client,
            product: a.product,
            amount: a.amount,
            submittedDate: a.submitted,
            officer: a.officer,
            daysWaiting: 0,
          }),
        );
        return { count: rows.length, totalAmount: rows.reduce((s, r) => s + r.amount, 0), rows };
      },
    );
  },

  /** By default (full unset/false) reads this catalog's own lightweight
   * report — status/limit/offset only, no officeCode needed. Set full:true
   * to use Fineract's own richer reports instead, which is what unlocks
   * officeCode/loanProductCode/fromDate/toDate — but officeCode is
   * effectively required then (confirmed live: full=true with no officeCode
   * silently returns zero rows rather than erroring). fromDate/toDate only
   * affect status="disbursed" ("Active Loans by Disbursal Period" needs a
   * range); they're silently ignored for status="pending".
   */
  disbursements(
    params: {
      status?: "pending" | "disbursed";
      full?: boolean;
      officeCode?: string;
      loanProductCode?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<DisbursementsReport> {
    const {
      status,
      full,
      officeCode,
      loanProductCode,
      fromDate,
      toDate,
      limit = 20,
      offset = 0,
    } = params;
    return withMock(
      async () => {
        const dto = await request<DisbursementsReportDto>("/loan-accounts/reports/disbursements", {
          query: { status, full, officeCode, loanProductCode, fromDate, toDate, limit, offset },
        });
        return {
          awaitingCount: dto.awaitingCount ?? 0,
          awaitingAmount: dto.awaitingAmount ?? 0,
          todayCount: dto.todayCount ?? 0,
          todayAmount: dto.todayAmount ?? 0,
          thisWeekCount: dto.thisWeekCount ?? 0,
          thisWeekAmount: dto.thisWeekAmount ?? 0,
          pending: (dto.pending ?? []).map(mapDisbursementQueueRow),
          recentlyDisbursed: (dto.recentlyDisbursed ?? []).map(mapDisbursementCompletedRow),
        };
      },
      () => {
        const pendingSeed = APPLICATIONS.filter(
          (a) => a.stage === "To Disburse" || a.stage === "Approved",
        );
        return {
          awaitingCount: pendingSeed.length,
          awaitingAmount: pendingSeed.reduce((s, a) => s + a.amount, 0),
          todayCount: 0,
          todayAmount: 0,
          thisWeekCount: 0,
          thisWeekAmount: 0,
          pending: pendingSeed.map(
            (a): DisbursementQueueRow => ({
              loanId: null,
              accountNo: a.id,
              client: a.client,
              product: a.product,
              amount: a.amount,
              approvedDate: a.submitted,
              officer: a.officer,
              daysSinceApproval: 0,
              officeName: "—",
              expectedDisbursalDate: "",
              daysToDisbursal: null,
            }),
          ),
          recentlyDisbursed: [],
        };
      },
    );
  },

  arrears(): Promise<ActiveLoan[]> {
    return withMock(
      async () => {
        const dto = await request<{ arrears?: ArrearsRowDto[] }>("/loan-accounts/reports/arrears");
        return (dto.arrears ?? []).map(mapArrears);
      },
      () => ACTIVE_LOANS.filter((l) => l.status === "In Arrears"),
    );
  },

  /** Overdue rows shaped for the Arrears "Overdue Loans" table. */
  arrearsRows(): Promise<ArrearsRow[]> {
    return withMock(
      async () => {
        const dto = await request<{ arrears?: ArrearsRowDto[] }>("/loan-accounts/reports/arrears");
        return (dto.arrears ?? []).map((a) => {
          const days = a.daysOverdue ?? 0;
          return {
            client: a.clientName ?? "",
            outstanding: (a.principalOutstanding ?? 0) + (a.interestOutstanding ?? 0),
            days,
            bucket: bucketFor(days),
          };
        });
      },
      () => [],
    );
  },
};

export type ArrearsBucket = "1–30" | "31–60" | "61–90" | "90+";
export type ArrearsRow = {
  client: string;
  outstanding: number;
  days: number;
  bucket: ArrearsBucket;
};

function bucketFor(days: number): ArrearsBucket {
  if (days <= 30) return "1–30";
  if (days <= 60) return "31–60";
  if (days <= 90) return "61–90";
  return "90+";
}
