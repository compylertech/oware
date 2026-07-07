// Clients domain — registry of clients and the in-memory store accessors.
export * from "./types";
export {
  getClients,
  useClients,
  subscribe,
  nextClientNumber,
  addClient,
  removeClient,
  setClients,
  hydrateClients,
} from "../store";

// Backend service (live-only — falls back to an empty result when offline).
export { clientsApi } from "../backend/clients";
export type { ClientSearch } from "../backend/clients";
