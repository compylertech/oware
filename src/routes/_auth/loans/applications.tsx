import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Ava, Table, THead, Tr, Th, Td, fontDisplay, fontMono } from "@/components/loans/ui";
import { StagePill } from "@/components/loans/StagePill";
import { fmtGHS, loanProductsApi, loanReportsApi, type AppStage } from "@/api/loans";
import { useClients } from "@/api/clients";
import { referencesApi } from "@/api/backend";
import { useBackendData } from "@/api/useBackendData";
import { Button, TableCard } from "@/components/patterns";

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

type FilterOption = { key: string; label: string };

/** Pill-button dropdown shared by the Products/Branches/Officer filters —
 * shows `placeholder` when nothing is selected, closes on outside click. */
function FilterDropdown({
  placeholder,
  options,
  selectedKey,
  onSelect,
}: {
  placeholder: string;
  options: FilterOption[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedLabel = options.find((o) => o.key === selectedKey)?.label ?? null;

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        iconRight={<ChevronDown size={12} />}
        onClick={() => setOpen((v) => !v)}
      >
        {selectedLabel ?? placeholder}
      </Button>
      {open && (
        <div
          className="absolute z-10 mt-1 bg-white"
          style={{
            border: `1px solid ${LOAN.border}`,
            borderRadius: 8,
            minWidth: 200,
            maxHeight: 280,
            overflowY: "auto",
            padding: 4,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="block w-full text-left"
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              fontSize: 13,
              color: LOAN.ink,
              background: !selectedKey ? LOAN.pageBg : "transparent",
            }}
          >
            {placeholder}
          </button>
          {options.length === 0 && (
            <div style={{ padding: "8px 10px", fontSize: 12, color: LOAN.muted }}>
              None found
            </div>
          )}
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onSelect(o.key);
                setOpen(false);
              }}
              className="block w-full text-left"
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 13,
                color: LOAN.ink,
                background: selectedKey === o.key ? LOAN.pageBg : "transparent",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsPage() {
  const [officeFilter, setOfficeFilter] = useState<string | null>(null);
  const [officerFilter, setOfficerFilter] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<string | null>(null);

  // officeCode/loanOfficerId are real server-side filters (confirmed live);
  // product has no such param, so it's applied client-side below instead.
  const { data } = useBackendData(`loans:applications:${officeFilter ?? ""}:${officerFilter ?? ""}`, () =>
    loanReportsApi.applications({
      limit: 200,
      officeCode: officeFilter ?? undefined,
      loanOfficerId: officerFilter ?? undefined,
    }),
  );
  const allApplications = data ?? [];

  const { data: productsData } = useBackendData("loans:products", () => loanProductsApi.list());
  const products = productsData ?? [];
  const productOptions: FilterOption[] = products.map((p) => ({ key: p.name, label: p.name }));

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

  const APPLICATIONS = productFilter
    ? allApplications.filter((a) => a.product === productFilter)
    : allApplications;

  const [view, setView] = useState<"board" | "table">("table");
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(APPLICATIONS.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = APPLICATIONS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

const PAGE_SIZE = 10;
