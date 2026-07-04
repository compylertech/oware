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

export type LoanOverview = {
  activeCount: number;
  activeAmount: number;
  pendingApprovals: number;
  arrears: number;
};

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
        };
      },
      () => ({
        activeCount: ACTIVE_LOANS.filter((l) => l.status !== "Closed").length,
        activeAmount: ACTIVE_LOANS.reduce((s, l) => s + l.outstanding, 0),
        pendingApprovals: APPLICATIONS.filter((a) => a.stage === "Under Review").length,
        arrears: ACTIVE_LOANS.filter((l) => l.status === "In Arrears").length,
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
};
