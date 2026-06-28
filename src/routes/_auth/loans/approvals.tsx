import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LOAN } from "@/lib/tokens";
import { LoansShell } from "@/components/loans/LoansShell";
import { Table, Td, Th, THead, Tr, TypePill, fontMono } from "@/components/loans/ui";
import { fmtGHS } from "@/api/loans";
import { Tabs, Button, TableCard } from "@/components/patterns";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/_auth/loans/approvals")({
  component: ApprovalsPage,
});

type Row = {
  type: "Loan Approval" | "Disbursement" | "Reschedule" | "Write-off" | "Product Change";
  client: string;
  amount: string;
  detail: string;
  maker: string;
  when: string;
};

const ROWS: Row[] = [
  {
    type: "Loan Approval",
    client: "Kwame Mensah",
    amount: fmtGHS(85000),
    detail: "SME LN-20451",
    maker: "A.Owusu",
    when: "1h",
  },
  {
    type: "Disbursement",
    client: "Abena Boateng",
    amount: fmtGHS(12500),
    detail: "LN-20448",
    maker: "K.Asante",
    when: "3h",
  },
  {
    type: "Reschedule",
    client: "Yaw Darko",
    amount: "extend 6mo",
    detail: "LN-20288",
    maker: "V.Yeboah",
    when: "5h",
  },
  {
    type: "Write-off",
    client: "Paa Anann",
    amount: fmtGHS(21500),
    detail: "LN-19877 · 96d",
    maker: "K.Asante",
    when: "1d",
  },
  {
    type: "Product Change",
    client: "Salary Advance",
    amount: "rate 5%→5.5%",
    detail: "affects 538 loans",
    maker: "A.Owusu",
    when: "1d",
  },
];

const TYPE_STYLE: Record<Row["type"], { c: string; bg: string }> = {
  "Loan Approval": { c: LOAN.blue, bg: LOAN.blueBg },
  Disbursement: { c: LOAN.green, bg: LOAN.greenBg },
  Reschedule: { c: LOAN.amber, bg: LOAN.amberBg },
  "Write-off": { c: LOAN.red, bg: LOAN.redBg },
  "Product Change": { c: LOAN.purple, bg: LOAN.purpleBg },
};

function ApprovalsPage() {
  const [tab, setTab] = useState<"my" | "all" | "history">("my");
  const [confirm, setConfirm] = useState<{ row: Row; action: "approve" | "reject" } | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(ROWS.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = ROWS.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Destructive actions (reject anything, or approve an irreversible Write-off)
  // are confirm-gated so a single mis-click can't action real money.
  function onApprove(r: Row) {
    if (r.type === "Write-off") setConfirm({ row: r, action: "approve" });
  }

  return (
    <LoansShell>
      <Tabs
        style={{ marginBottom: 12 }}
        value={tab}
        onChange={setTab}
        items={[
          { key: "my", label: "My queue (9)" },
          { key: "all", label: "All pending" },
          { key: "history", label: "History" },
        ]}
      />

      <TableCard
        title="Approval Queue"
        resultLabel={`${ROWS.length} approvals`}
        pagination={{
          page: currentPage,
          totalPages,
          totalItems: ROWS.length,
          itemLabel: "approvals",
          onPageChange: setPage,
        }}
      >
        <Table>
          <THead>
            <Th>Type</Th>
            <Th>Client</Th>
            <Th>Amount</Th>
            <Th>Detail</Th>
            <Th>Maker</Th>
            <Th>Age</Th>
            <Th style={{ textAlign: "right" }}>Actions</Th>
          </THead>
          <tbody>
            {pageRows.map((r) => {
              const s = TYPE_STYLE[r.type];
              return (
                <Tr key={`${r.type}-${r.client}-${r.detail}`} hover>
                  <Td>
                    <TypePill label={r.type} color={s.c} bg={s.bg} />
                  </Td>
                  <Td style={{ fontWeight: 300 }}>{r.client}</Td>
                  <Td style={{ fontWeight: 100 }}>{r.amount}</Td>
                  <Td>
                    <span style={{ ...fontMono, color: LOAN.muted }}>{r.detail}</span>
                  </Td>
                  <Td>{r.maker}</Td>
                  <Td>{r.when} ago</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="dangerOutline"
                        size="sm"
                        icon={<X size={14} />}
                        onClick={() => setConfirm({ row: r, action: "reject" })}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="successOutline"
                        size="sm"
                        icon={<Check size={14} />}
                        onClick={() => onApprove(r)}
                      >
                        Approve
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </TableCard>

      {confirm && (
        <ConfirmDialog
          row={confirm.row}
          action={confirm.action}
          onCancel={() => setConfirm(null)}
          onConfirm={() => setConfirm(null)}
        />
      )}
    </LoansShell>
  );
}

const PAGE_SIZE = 10;

function ConfirmDialog({
  row,
  action,
  onCancel,
  onConfirm,
}: {
  row: Row;
  action: "approve" | "reject";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isReject = action === "reject";
  const title = isReject ? `Reject ${row.type}?` : `Approve ${row.type}?`;
  const body = isReject
    ? `This will reject ${row.client}'s ${row.type.toLowerCase()} (${row.amount}). The maker (${row.maker}) will be notified.`
    : `This will approve an irreversible ${row.type.toLowerCase()} of ${row.amount} for ${row.client}. This cannot be undone.`;
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(13,27,62,0.45)",
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, padding: 24, width: 400, maxWidth: "100%" }}
      >
        <div style={{ fontSize: 17, fontWeight: 200, color: LOAN.ink }}>{title}</div>
        <p style={{ fontSize: 13, color: LOAN.muted, marginTop: 8, lineHeight: 1.5 }}>{body}</p>
        <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "danger" : "success"}
            icon={isReject ? <X size={14} /> : <Check size={14} />}
            onClick={onConfirm}
          >
            {isReject ? "Reject" : "Approve write-off"}
          </Button>
        </div>
      </div>
    </div>
  );
}
