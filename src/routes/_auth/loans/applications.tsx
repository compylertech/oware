import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, THead, Tr, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { FilterDropdown, type FilterOption } from "@/components/loans/FilterDropdown";
import { fmtGHS, loanReportsApi, type AppStage } from "@/api/loans";
import { useClients } from "@/api/clients";
import { referencesApi } from "@/api/backend";
import { useBackendData } from "@/api/useBackendData";
import { Button, TableCard, PAGE_SIZE_OPTIONS } from "@/components/patterns";

export const Route = createFileRoute("/_auth/loans/applications")({
  component: ApplicationsPage,
});

const COLUMNS: { stage: AppStage; dot: string }[] = [
  { stage: "Submitted", dot: LOAN.muted },
  { stage: "Under Review", dot: LOAN.blue },
  { stage: "Approved", dot: LOAN.amber },
  { stage: "To Disburse", dot: LOAN.green },
  { stage: "Rejected", dot: LOAN.red },
];

function ApplicationsPage() {
  const [officeFilter, setOfficeFilter] = useState<string | null>(null);
  const [officerFilter, setOfficerFilter] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string | null>(null);

  // officeCode/loanOfficerId/loanProductCode are all real server-side
  // filters (confirmed live, including all three combined at once) — the
  // fetch itself changes per filter combination, not a client-side re-slice
  // of one big batch.
  const { data } = useBackendData(
    `loans:applications:${officeFilter ?? ""}:${officerFilter ?? ""}:${productFilter ?? ""}`,
    () =>
      loanReportsApi.applications({
        limit: 500,
        officeCode: officeFilter ?? undefined,
        loanOfficerId: officerFilter ?? undefined,
        loanProductCode: productFilter ?? undefined,
      }),
  );
  const APPLICATIONS = data ?? [];

  // Validated against the LOAN_PRODUCT reference category's own code (e.g.
  // "AUTO_LOAN"), not the product catalogue's short code ("ALN") — same
  // mismatch already noted for Active Loans' product filter.
  const [productOptions, setProductOptions] = useState<FilterOption[]>([]);
  useEffect(() => {
    void referencesApi
      .list("LOAN_PRODUCT")
      .then((opts) => setProductOptions(opts.map((o) => ({ key: o.code, label: o.name }))));
  }, []);

  const [officeOptions, setOfficeOptions] = useState<FilterOption[]>([]);
  useEffect(() => {
    void referencesApi
      .list("OFFICE")
      .then((opts) => setOfficeOptions(opts.map((o) => ({ key: o.code, label: o.name }))));
  }, []);

  // Loan officers are modeled as staff clients — filter the app-wide client
  // registry (already hydrated) instead of a dedicated (currently 500ing)
  // staff/officer endpoint, per direction.
  const clients = useClients();
  const officerOptions: FilterOption[] = clients
    .filter((c) => c.isStaff && c.fineractClientId != null)
    .map((c) => ({ key: String(c.fineractClientId), label: c.name }));

  const [view, setView] = useState<"board" | "table">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(APPLICATIONS.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = APPLICATIONS.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <LoansShell>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <FilterDropdown
            placeholder="All Products"
            options={productOptions}
            selectedKey={productFilter}
            onSelect={(key) => {
              setProductFilter(key);
              setPage(1);
            }}
          />
          <FilterDropdown
            placeholder="All Branches"
            options={officeOptions}
            selectedKey={officeFilter}
            onSelect={(key) => {
              setOfficeFilter(key);
              setPage(1);
            }}
          />
          <FilterDropdown
            placeholder="Officer"
            options={officerOptions}
            selectedKey={officerFilter}
            onSelect={(key) => {
              setOfficerFilter(key);
              setPage(1);
            }}
          />
        </div>
        <div
          style={{
            display: "inline-flex",
            border: `1px solid ${LOAN.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {(["board", "table"] as const).map((v) => (
            <Button
              type="button"
              key={v}
              onClick={() => setView(v)}
              variant={view === v ? "primary" : "outline"}
              size="sm"
              style={{
                textTransform: "capitalize",
                borderRadius: 0,
              }}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {view === "board" ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {COLUMNS.map((col) => {
            const items = APPLICATIONS.filter((a) => a.stage === col.stage);
            return (
              <div
                key={col.stage}
                style={{ background: LOAN.pageBg, borderRadius: 12, padding: 10 }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ padding: "4px 6px 10px" }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: col.dot }} />
                    <span style={{ fontSize: 12, fontWeight: 100, color: LOAN.ink }}>
                      {col.stage}
                    </span>
                  </div>
                  <span
                    style={{
                      background: "#fff",
                      border: `1px solid ${LOAN.border}`,
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontSize: 10,
                      fontWeight: 100,
                      color: LOAN.muted,
                    }}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        background: "#fff",
                        border: `1px solid ${LOAN.border}`,
                        borderRadius: 10,
                        padding: 10,
                        cursor: "grab",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Ava name={a.client} bg={a.avatar} size={26} />
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 12, fontWeight: 100, color: LOAN.ink }}>
                            {a.client}
                          </div>
                          <div style={{ ...fontMono, fontSize: 10, color: LOAN.muted }}>{a.id}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: LOAN.muted, marginTop: 8 }}>
                        {a.product}
                      </div>
                      <div
                        style={{
                          ...fontDisplay,
                          fontSize: 14,
                          fontWeight: 200,
                          color: LOAN.ink,
                          marginTop: 2,
                        }}
                      >
                        {fmtGHS(a.amount)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: LOAN.muted,
                          marginTop: 6,
                          borderTop: `1px solid ${LOAN.border}`,
                          paddingTop: 6,
                        }}
                      >
                        {a.submitted} · {a.officer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <TableCard
          title="Loan Applications"
          resultLabel={`${APPLICATIONS.length} applications`}
          pagination={{
            page: currentPage,
            totalPages,
            totalItems: APPLICATIONS.length,
            itemLabel: "applications",
            onPageChange: setPage,
            pageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        >
          <Table>
            <THead>
              <Th>Applicant</Th>
              <Th>Product</Th>
              <Th>Amount</Th>
              <Th>Stage</Th>
              <Th>Officer</Th>
              <Th>Submitted</Th>
            </THead>
            <tbody>
              {pageRows.map((a) => (
                <Tr key={a.id} hover style={{ cursor: "pointer" }}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Ava name={a.client} bg={a.avatar} size={28} />
                      <div>
                        <div style={{ fontWeight: 300 }}>{a.client}</div>
                        <div style={{ ...fontMono, fontSize: 11, color: LOAN.muted }}>{a.id}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{a.product}</Td>
                  <Td style={{ fontWeight: 100 }}>{fmtGHS(a.amount)}</Td>
                  <Td>
                    <StagePill stage={a.stage} />
                  </Td>
                  <Td>{a.officer}</Td>
                  <Td>{a.submitted}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      )}
    </LoansShell>
  );
}
