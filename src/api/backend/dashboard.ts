// Dashboard service — maps to the "Dashboard" group backing the client/
// transaction dashboard's two charts and summary cards.
//   GET /dashboard/client-growth?fromDate=&toDate=
//   GET /dashboard/transaction-volume?fromDate=&toDate=
//   GET /dashboard/summary
//
// See docs/dashboard-api-integration.md (corebanking-starter repo) for the
// full spec. Known gaps confirmed against that doc, not bugs here:
//  - Growth chart's "+X% vs last month" badge and the summary cards' "vs
//    last month" deltas aren't returned by any endpoint — computed
//    client-side where possible (growth), omitted where not (summary).
//  - Sparse months (zero activity) are absent from the array entirely, not
//    a zero row — callers fill gaps to a continuous window themselves.

import type { ClientGrowthPointDto, DashboardSummaryDto, TransactionVolumePointDto } from "./dto";
import { request, withMock } from "./http";

export type ClientGrowthPoint = { year: number; month: number; newClientsCount: number };

export type TransactionVolumePoint = {
  year: number;
  month: number;
  transactionCount: number;
  netVolume: number;
  variance: number;
};

export type DashboardSummary = {
  totalClients: number;
  activeAccounts: number;
  depositsThisMonth: number;
  pendingKycCount: number;
};

export type DashboardDateRange = { fromDate?: string; toDate?: string };

export const dashboardApi = {
  clientGrowth(params: DashboardDateRange = {}): Promise<ClientGrowthPoint[]> {
    return withMock(
      async () => request<ClientGrowthPointDto[]>("/dashboard/client-growth", { query: params }),
      () => [],
    );
  },

  transactionVolume(params: DashboardDateRange = {}): Promise<TransactionVolumePoint[]> {
    return withMock(
      async () =>
        request<TransactionVolumePointDto[]>("/dashboard/transaction-volume", { query: params }),
      () => [],
    );
  },

  summary(): Promise<DashboardSummary | undefined> {
    return withMock(
      () => request<DashboardSummaryDto>("/dashboard/summary"),
      () => undefined,
    );
  },
};
