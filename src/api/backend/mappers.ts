// Translate backend DTOs into the UI-facing domain types the app already uses.
//
// The UI types (Client, LoanApplication, ActiveLoan, LoanProduct) are the
// contract every component relies on. Keeping the translation here means the
// backend's wire format can evolve without any route or component changing.
// Shapes here are verified against a live corebanking-starter instance.

import type { Client, ClientStatus } from "../clients/types";
import type {
  ActiveLoan,
  ActiveLoanStatus,
  AppStage,
  LoanApplication,
  LoanProduct,
} from "../loans/types";
import type {
  ActiveLoanRowDto,
  ApplicationRowDto,
  ArrearsRowDto,
  ClientDto,
  DisbursementRowDto,
  ProductDto,
} from "./dto";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDay(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** "HEAD_OFFICE" → "Head Office". */
function titleCase(code?: string): string {
  if (!code) return "";
  return code
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

const AVATARS = ["#3B5BDB", "#7C3AED", "#059669", "#B45309", "#1565C0", "#0F6E56", "#DC2626"];
function avatarFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATARS[h % AVATARS.length];
}

// ── Clients ─────────────────────────────────────────────────────────────────

function clientStatusFrom(raw?: string): ClientStatus {
  const s = (raw ?? "").toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s.includes("PENDING")) return "Pending";
  return "Inactive"; // CLOSED, REJECTED, WITHDRAWN, etc.
}

export function mapClient(dto: ClientDto): Client {
  const status = clientStatusFrom(dto.status);
  const name =
    dto.displayName ||
    [dto.firstName, dto.middleName, dto.lastName].filter(Boolean).join(" ").trim() ||
    "—";
  return {
    id: dto.id,
    name,
    clientNumber: dto.accountNo ?? dto.externalId ?? dto.id,
    externalId: dto.externalId ?? "",
    status,
    officeName: dto.officeName ?? titleCase(dto.officeCode),
    activationDate: fmtDate(dto.activationDate),
    firstName: dto.firstName,
    middleName: dto.middleName,
    lastName: dto.lastName,
    mobile: dto.mobileNumber,
    email: dto.email,
    isStaff: dto.staff,
    fineractClientId: dto.fineractClientId,
    officeCode: dto.officeCode,
    genderCode: dto.genderCode ?? undefined,
    dateOfBirth: dto.dateOfBirth ?? undefined,
    submittedOnDate: dto.submittedOnDate,
  };
}

// ── Loan products ─────────────────────────────────────────────────────────────

const fmtK = (n?: number | null): string => {
  if (!n) return "—";
  if (n >= 1_000_000) return `GH₵${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1_000) return `GH₵${Math.round(n / 1_000)}K`;
  return `GH₵${n}`;
};

const PRODUCT_COLORS = ["#3B5BDB", "#059669", "#B45309", "#7C3AED", "#DC2626"];

export function mapLoanProduct(dto: ProductDto, index = 0): LoanProduct {
  // Fineract interestType: "1" = flat, "0" = declining balance.
  const flat = dto.interestType === "1";
  const rate = dto.annualNominalInterestRate;
  return {
    name: dto.name,
    type: flat ? "Flat rate" : "Declining balance",
    typeColor: PRODUCT_COLORS[index % PRODUCT_COLORS.length],
    rate: rate != null ? (flat ? `${rate}% flat` : `${rate}% p.a.`) : "—",
    term: dto.numberOfRepayments != null ? `${dto.numberOfRepayments} periods` : "—",
    max: fmtK(dto.maxPrincipal ?? dto.principal),
    extra: dto.shortName ?? dto.code,
    active: (dto.status ?? "").toUpperCase() === "ACTIVE" && dto.active !== false,
    count: 0,
  };
}

// ── Loan applications ─────────────────────────────────────────────────────────

function appStageFrom(statusId?: number, statusName?: string): AppStage {
  // Fineract loan status ids take precedence when present.
  switch (statusId) {
    case 100:
      return "Submitted";
    case 200:
      return "Approved";
    case 300:
    case 800: // approved, awaiting disbursal / active
      return "To Disburse";
    case 400: // withdrawn
    case 500: // rejected
      return "Rejected";
  }
  const s = (statusName ?? "").toLowerCase();
  if (s.includes("reject") || s.includes("withdraw") || s.includes("declin")) return "Rejected";
  if (s.includes("pending")) return "Submitted"; // "…and pending approval"
  if (s.includes("disburse")) return "To Disburse";
  if (s.includes("approv")) return "Approved";
  if (s.includes("review")) return "Under Review";
  return "Submitted";
}

export function mapApplication(dto: ApplicationRowDto): LoanApplication {
  const client = dto.clientName ?? "";
  return {
    id: dto.accountNo ?? String(dto.loanId ?? ""),
    client,
    product: dto.productName ?? "",
    amount: dto.amount ?? 0,
    stage: appStageFrom(dto.statusId, dto.statusName),
    officer: dto.officerName || "—",
    submitted: fmtDay(dto.submittedDate),
    avatar: avatarFor(client || String(dto.loanId)),
  };
}

export function mapDisbursement(dto: DisbursementRowDto): LoanApplication {
  const client = dto.clientName ?? "";
  return {
    id: dto.accountNo ?? String(dto.loanId ?? ""),
    client,
    product: dto.productName ?? "",
    amount: dto.approvedAmount ?? 0,
    stage: "To Disburse",
    officer: dto.officerName || "—",
    submitted: fmtDay(dto.approvedDate),
    avatar: avatarFor(client || String(dto.loanId)),
  };
}

// ── Active loans & arrears ────────────────────────────────────────────────────

function activeStatus(dto: ActiveLoanRowDto): ActiveLoanStatus {
  const label = (dto.statusLabel ?? "").toLowerCase();
  if (label.includes("overdue") || label.includes("arrear")) return "In Arrears";
  if ((dto.outstandingBalance ?? 0) <= 0) return "Closed";
  if (label.includes("due")) return "Due Soon";
  return "Current";
}

export function mapActiveLoan(dto: ActiveLoanRowDto): ActiveLoan {
  const client = dto.clientName ?? "";
  return {
    id: dto.accountNo ?? String(dto.loanId ?? ""),
    client,
    product: dto.productName ?? "",
    outstanding: dto.outstandingBalance ?? 0,
    nextDue: dto.nextDueDate ? fmtDay(dto.nextDueDate) : (dto.statusLabel ?? "—"),
    repaid: Math.round(dto.repaidPercent ?? 0),
    status: activeStatus(dto),
    avatar: avatarFor(client || String(dto.loanId)),
  };
}

export function mapArrears(dto: ArrearsRowDto): ActiveLoan {
  const client = dto.clientName ?? "";
  const outstanding = (dto.principalOutstanding ?? 0) + (dto.interestOutstanding ?? 0);
  return {
    id: dto.accountNo ?? String(dto.loanId ?? ""),
    client,
    product: dto.productName ?? "",
    outstanding,
    nextDue: dto.daysOverdue != null ? `${dto.daysOverdue}d overdue` : "—",
    repaid: 0,
    status: "In Arrears",
    avatar: avatarFor(client || String(dto.loanId)),
  };
}
