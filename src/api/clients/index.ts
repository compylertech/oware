// Clients domain — registry of clients and the in-memory store accessors.
export * from "./types";
export { SEED_CLIENTS } from "./data";
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

// Backend service (falls back to the seed registry when offline).
export { clientsApi } from "../backend/clients";
export type { ClientSearch } from "../backend/clients";
