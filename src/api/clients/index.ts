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
} from "../store";
