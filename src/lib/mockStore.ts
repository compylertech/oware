import { useSyncExternalStore } from "react";

export type ClientStatus = "Active" | "Pending";

export type Client = {
  id: string;
  name: string;
  clientNumber: string;
  externalId: string;
  status: ClientStatus;
  officeName: string;
  activationDate: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  isStaff?: boolean;
};

export type CoopMember = {
  id: string;
  clientId: string;
  commonBondGroup: string;
  shareClass: string;
  initialShares: number;
  status: "Pending" | "Active";
};

const OFFICES = ["Accra Main", "Kumasi", "Takoradi", "Head Office"];

const SEED_CLIENTS: Client[] = [
  ["Kwame Mensah", "Active", 0],
  ["Akosua Owusu", "Active", 1],
  ["Yaw Boateng", "Pending", 2],
  ["Ama Asantewaa", "Active", 3],
  ["Kojo Annan", "Active", 0],
  ["Efua Sutherland", "Pending", 1],
  ["Kwesi Appiah", "Active", 2],
  ["Adwoa Safo", "Active", 3],
  ["Nana Akufo", "Pending", 0],
  ["Abena Pokuaa", "Active", 1],
  ["Kofi Nyantakyi", "Active", 2],
  ["Esi Bondzie", "Pending", 3],
].map(([name, status, off], i) => {
  const n = String(i + 1).padStart(4, "0");
  const d = new Date(2024, (i * 2) % 12, ((i * 5) % 27) + 1);
  return {
    id: `clt-${n}`,
    name: name as string,
    clientNumber: `CLT-${n}`,
    externalId: `EXT-${n}`,
    status: status as ClientStatus,
    officeName: OFFICES[off as number],
    activationDate: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
});

let clients: Client[] = [...SEED_CLIENTS];
let coopMembers: CoopMember[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getClients() {
  return clients;
}
export function getCoopMembers() {
  return coopMembers;
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
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
