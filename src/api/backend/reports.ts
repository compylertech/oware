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
  ApplicationRowDto,
  ApprovalRowDto,
  ArrearsRowDto,
  DisbursementRowDto,
  OverviewDto,
} from "./dto";
import { request, withMock } from "./http";
import { mapActiveLoan, mapApplication, mapApproval, mapArrears, mapDisbursement } from "./mappers";

export type PipelineStage = { count: number; amount: number };

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

  active(): Promise<ActiveLoan[]> {
    return withMock(
      async () => {
        const dto = await request<{ loans?: ActiveLoanRowDto[] }>("/loan-accounts/reports/active");
        return (dto.loans ?? []).map(mapActiveLoan);
      },
      () => ACTIVE_LOANS,
    );
  },

  applications(
    params: {
      stage?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<LoanApplication[]> {
    const { stage, fromDate, toDate, limit = 20, offset = 0 } = params;
    return withMock(
      async () => {
        const dto = await request<{ applications?: ApplicationRowDto[] }>(
          "/loan-accounts/reports/applications",
          { query: { stage, fromDate, toDate, limit, offset } },
        );
        return (dto.applications ?? []).map(mapApplication);
      },
      () => APPLICATIONS,
    );
  },

  approvals(): Promise<LoanApplication[]> {
    return withMock(
      async () => {
        const dto = await request<{ approvals?: ApprovalRowDto[] }>(
          "/loan-accounts/reports/approvals",
        );
        return (dto.approvals ?? []).map(mapApproval);
      },
      () => APPLICATIONS.filter((a) => a.stage === "Under Review" || a.stage === "Submitted"),
    );
  },

  disbursements(status?: "pending" | "disbursed"): Promise<LoanApplication[]> {
    return withMock(
      async () => {
        const dto = await request<{ pending?: DisbursementRowDto[] }>(
          "/loan-accounts/reports/disbursements",
          { query: { status } },
        );
        return (dto.pending ?? []).map(mapDisbursement);
      },
      () => APPLICATIONS.filter((a) => a.stage === "To Disburse" || a.stage === "Approved"),
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
