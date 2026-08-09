// Ledger service - backs the Transactions screen's journal-entry table.
//   GET /ledger/entries?officeCode=&fromDate=&toDate=&page=&size=
//
// One row per journal-entry leg (debit XOR credit), not one row per business
// transaction - a single deposit posts two rows here. See
// docs/dashboard-api-integration... (corebanking-starter repo,
// docs/transactions-ledger-integration equivalent) for the full spec.

import type { LedgerEntryDto, Page } from "./dto";
import { request, withMock } from "./http";

export type LedgerEntry = {
  accountNo: string | null;
  clientName: string | null;
  debit: number | null;
  credit: number | null;
  narration: string;
  status: "Completed" | "Reversed" | string;
  date: string;
  officeName: string;
};

function mapLedgerEntry(dto: LedgerEntryDto): LedgerEntry {
  return {
    accountNo: dto.accountNo,
    clientName: dto.clientName,
    debit: dto.debit,
    credit: dto.credit,
    narration: dto.narration,
    status: dto.status,
    date: dto.date,
    officeName: dto.officeName,
  };
}

export type LedgerEntriesParams = {
  officeCode?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
};

export type LedgerEntriesPage = {
  content: LedgerEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export const ledgerApi = {
  entries(params: LedgerEntriesParams = {}): Promise<LedgerEntriesPage> {
    const { officeCode, fromDate, toDate, page = 0, size = 20 } = params;
    return withMock(
      async () => {
        const dto = await request<Page<LedgerEntryDto>>("/ledger/entries", {
          query: { officeCode, fromDate, toDate, page, size },
        });
        return {
          content: (dto.content ?? []).map(mapLedgerEntry),
          page: dto.page ?? dto.number ?? page,
          size: dto.size ?? size,
          totalElements: dto.totalElements ?? 0,
          totalPages: dto.totalPages ?? 1,
        };
      },
      () => ({ content: [], page: 0, size, totalElements: 0, totalPages: 1 }),
    );
  },
};
