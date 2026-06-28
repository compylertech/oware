// In-memory reactive store for the investments domain. Mirrors the backend
// aggregate transitions (approve/suspend, proposal workflow, position
// maturity, alert acknowledgement, exposure calculation). Components read via
// the `use*` hooks and mutate via the action functions.
//
// Going live: replace each action body with a `request()` call (see
// `../client.ts`) and refetch — call sites only depend on this module's API.
import { useSyncExternalStore } from "react";
import {
  SEED_ALERTS,
  SEED_EXPOSURE,
  SEED_INSTITUTIONS,
  SEED_POSITIONS,
  SEED_PROPOSALS,
} from "./data";
import type {
  InvestmentExposureSnapshot,
  InvestmentInstitution,
  InvestmentMaturityAlert,
  InvestmentPosition,
  InvestmentProposal,
  InvestmentProposalStatus,
  NewExposureSnapshot,
  NewInstitution,
  NewMaturityAlert,
  NewPosition,
  NewProposal,
} from "./types";

let institutions: InvestmentInstitution[] = [...SEED_INSTITUTIONS];
let proposals: InvestmentProposal[] = [...SEED_PROPOSALS];
let positions: InvestmentPosition[] = [...SEED_POSITIONS];
let alerts: InvestmentMaturityAlert[] = [...SEED_ALERTS];
let exposures: InvestmentExposureSnapshot[] = [...SEED_EXPOSURE];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let seq = 0;
function uid(prefix: string) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

// ---- Getters ----
export const getInstitutions = () => institutions;
export const getProposals = () => proposals;
export const getPositions = () => positions;
export const getMaturityAlerts = () => alerts;
export const getExposureSnapshots = () => exposures;

export const institutionName = (id: string) =>
  institutions.find((i) => i.id === id)?.name ?? "—";

// ---- Institutions ----
export function addInstitution(input: NewInstitution): InvestmentInstitution {
  const created: InvestmentInstitution = {
    id: uid("inst"),
    name: input.name.trim(),
    institutionType: input.institutionType,
    riskRating: input.riskRating,
    status: "PENDING_APPROVAL",
    approvalReference: null,
    approvedAt: null,
  };
  institutions = [created, ...institutions];
  emit();
  return created;
}
export function approveInstitution(id: string, approvalReference?: string) {
  institutions = institutions.map((i) =>
    i.id === id && i.status === "PENDING_APPROVAL" && i.riskRating !== "PROHIBITED"
      ? {
          ...i,
          status: "APPROVED",
          approvalReference: approvalReference ?? i.approvalReference ?? "—",
          approvedAt: new Date().toISOString(),
        }
      : i,
  );
  emit();
}
export function suspendInstitution(id: string) {
  institutions = institutions.map((i) =>
    i.id === id && i.status !== "CLOSED" ? { ...i, status: "SUSPENDED" } : i,
  );
  emit();
}
export function removeInstitution(id: string) {
  institutions = institutions.filter((i) => i.id !== id);
  emit();
}

// ---- Proposals ----
const PROPOSAL_NEXT: Partial<Record<InvestmentProposalStatus, InvestmentProposalStatus>> = {
  DRAFT: "TREASURER_REVIEW",
  TREASURER_REVIEW: "RISK_REVIEW",
  RISK_REVIEW: "BOARD_APPROVAL",
  BOARD_APPROVAL: "APPROVED",
  APPROVED: "PLACED",
};
export const nextProposalStatus = (s: InvestmentProposalStatus) => PROPOSAL_NEXT[s];

export function addProposal(input: NewProposal): InvestmentProposal {
  const created: InvestmentProposal = {
    id: uid("prop"),
    institutionId: input.institutionId,
    principalAmount: input.principalAmount,
    interestRate: input.interestRate,
    proposedPlacementDate: input.proposedPlacementDate,
    proposedMaturityDate: input.proposedMaturityDate,
    purpose: input.purpose.trim(),
    status: "DRAFT",
    reviewNotes: null,
  };
  proposals = [created, ...proposals];
  emit();
  return created;
}
export function advanceProposal(id: string) {
  proposals = proposals.map((p) => {
    if (p.id !== id) return p;
    const next = PROPOSAL_NEXT[p.status];
    return next ? { ...p, status: next } : p;
  });
  emit();
}
export function rejectProposal(id: string, reviewNotes?: string) {
  proposals = proposals.map((p) =>
    p.id === id && p.status !== "PLACED"
      ? { ...p, status: "REJECTED", reviewNotes: reviewNotes ?? p.reviewNotes }
      : p,
  );
  emit();
}

// ---- Positions ----
export function addPosition(input: NewPosition): InvestmentPosition {
  const created: InvestmentPosition = {
    id: uid("pos"),
    proposalId: input.proposalId ?? null,
    institutionId: input.institutionId,
    principalAmount: input.principalAmount,
    interestRate: input.interestRate,
    placementDate: input.placementDate,
    maturityDate: input.maturityDate,
    linkedGlAccountId: input.linkedGlAccountId,
    status: "PLACED",
  };
  positions = [created, ...positions];
  emit();
  return created;
}
export function maturePosition(id: string) {
  positions = positions.map((p) =>
    p.id === id && p.status === "PLACED" ? { ...p, status: "MATURED" } : p,
  );
  emit();
}
export function closePosition(id: string) {
  positions = positions.map((p) =>
    p.id === id && (p.status === "PLACED" || p.status === "MATURED")
      ? { ...p, status: "CLOSED" }
      : p,
  );
  emit();
}

// ---- Maturity alerts ----
export function addMaturityAlert(input: NewMaturityAlert): InvestmentMaturityAlert {
  const created: InvestmentMaturityAlert = {
    id: uid("alert"),
    investmentPositionId: input.investmentPositionId,
    alertDate: input.alertDate,
    alertType: input.alertType,
    status: "PENDING",
  };
  alerts = [created, ...alerts];
  emit();
  return created;
}
export function markAlertSent(id: string) {
  alerts = alerts.map((a) =>
    a.id === id && a.status === "PENDING" ? { ...a, status: "SENT" } : a,
  );
  emit();
}
export function acknowledgeAlert(id: string) {
  alerts = alerts.map((a) =>
    a.id === id && (a.status === "PENDING" || a.status === "SENT")
      ? { ...a, status: "ACKNOWLEDGED" }
      : a,
  );
  emit();
}

// ---- Exposure snapshots ----
export function addExposureSnapshot(input: NewExposureSnapshot): InvestmentExposureSnapshot {
  const exposurePercent =
    input.totalInvestmentsAmount > 0
      ? (input.institutionExposureAmount / input.totalInvestmentsAmount) * 100
      : 0;
  const created: InvestmentExposureSnapshot = {
    id: uid("exp"),
    institutionId: input.institutionId,
    institutionExposureAmount: input.institutionExposureAmount,
    totalInvestmentsAmount: input.totalInvestmentsAmount,
    exposurePercent,
    allowedPercent: input.allowedPercent,
    breach: exposurePercent > input.allowedPercent,
    calculatedAt: new Date().toISOString(),
  };
  exposures = [created, ...exposures];
  emit();
  return created;
}

// ---- Hooks ----
export const useInstitutions = () =>
  useSyncExternalStore(subscribe, getInstitutions, getInstitutions);
export const useProposals = () => useSyncExternalStore(subscribe, getProposals, getProposals);
export const usePositions = () => useSyncExternalStore(subscribe, getPositions, getPositions);
export const useMaturityAlerts = () =>
  useSyncExternalStore(subscribe, getMaturityAlerts, getMaturityAlerts);
export const useExposureSnapshots = () =>
  useSyncExternalStore(subscribe, getExposureSnapshots, getExposureSnapshots);
