// Moved to src/api/{clients,cooperative}. This shim keeps existing
// `@/lib/mockStore` imports working; prefer `@/api/clients` / `@/api/cooperative`
// in new code.
export type { Client, ClientStatus } from "@/api/clients";
export type { CoopMember } from "@/api/cooperative";
export {
  getClients,
  useClients,
  subscribe,
  nextClientNumber,
  addClient,
  removeClient,
} from "@/api/clients";
export { getCoopMembers, useCoopMembers, addCoopMember } from "@/api/cooperative";
