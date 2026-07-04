// Backend integration configuration.
//
// The corebanking-starter service (see postman/corebanking-starter.postman_collection.json)
// is a Spring Boot API secured with HTTP Basic auth. All settings are read from
// Vite env vars so the same build can target local, staging or a mock.
//
//   VITE_API_BASE_URL   e.g. http://localhost:8084   (unset ⇒ mock mode)
//   VITE_API_USER       Basic-auth user  (default: admin)
//   VITE_API_PASSWORD   Basic-auth pass  (default: admin)
//   VITE_API_MOCK       "true" to force mock even when a base URL is set
//
// When no base URL is configured, or the backend cannot be reached, every
// service transparently falls back to the in-memory fixtures so the UI keeps
// rendering exactly as it does today.

type ViteEnv = {
  VITE_API_BASE_URL?: string;
  VITE_API_USER?: string;
  VITE_API_PASSWORD?: string;
  VITE_API_MOCK?: string;
};

const env: ViteEnv =
  typeof import.meta !== "undefined" && (import.meta as { env?: ViteEnv }).env
    ? (import.meta as { env: ViteEnv }).env
    : {};

export const API_BASE_URL = (env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
export const API_USER = env.VITE_API_USER ?? "admin";
export const API_PASSWORD = env.VITE_API_PASSWORD ?? "admin";

/** Mock mode is on when no backend URL is configured or it is explicitly forced. */
export const USE_MOCK = !API_BASE_URL || env.VITE_API_MOCK === "true";

/** Base64 Basic-auth header value, computed once. */
export function basicAuthHeader(): string {
  const raw = `${API_USER}:${API_PASSWORD}`;
  const b64 =
    typeof btoa === "function"
      ? btoa(raw)
      : // Node/SSR fallback
        Buffer.from(raw, "utf-8").toString("base64");
  return `Basic ${b64}`;
}
