// In-memory store shared by the clients and cooperative domains. Clients and
// coop members share a single subscription so that removing a client also
// detaches their cooperative membership.
import { useSyncExternalStore } from "react";
import type { Client } from "./clients/types";
import type { CoopMember } from "./cooperative/types";

let clients: Client[] = [];
let coopMembers: CoopMember[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getClients() {
  return clients;
}

export function getCoopMembers() {
  return coopMembers;
}

export function nextClientNumber() {
  const max = clients.reduce((m, c) => {
    const n = parseInt(c.clientNumber.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return String(max + 1).padStart(4, "0");
}

export function addClient(c: Client) {
  clients = [c, ...clients];
  emit();
}

export function removeClient(id: string) {
  clients = clients.filter((c) => c.id !== id);
  coopMembers = coopMembers.filter((m) => m.clientId !== id);
  emit();
}

/** Replace the client registry (used when hydrating from the backend). */
export function setClients(next: Client[]) {
  clients = next;
  emit();
}

// Hydrate the registry from the corebanking backend once, on the client. The
// store starts empty and fills with live clients once this resolves; every
// `useClients()` consumer re-renders automatically.
let hydrated = false;
export async function hydrateClients() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const { clientsApi } = await import("./backend/clients");
    const live = await clientsApi.search({ size: 200 });
    setClients(live);
  } catch {
    // Keep the (empty) registry on any failure — the UI must not break.
  }
}

if (typeof window !== "undefined") {
  void hydrateClients();
}

export function addCoopMember(m: CoopMember) {
  coopMembers = [m, ...coopMembers];
  emit();
}

export function useClients() {
  return useSyncExternalStore(
    subscribe,
    () => clients,
    () => clients,
  );
}

export function useCoopMembers() {
  return useSyncExternalStore(
    subscribe,
    () => coopMembers,
    () => coopMembers,
  );
}
