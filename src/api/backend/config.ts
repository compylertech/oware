// Backend integration configuration (client side).
//
// The browser never talks to the corebanking backend directly - it would be
// blocked by CORS and would expose credentials. Instead every call goes to the
// app's own same-origin proxy at `/api/v1/*` (see src/server.ts), which forwards
// to the real backend with server-side auth.
//
// The only knob the client needs is an optional mock override:
//   VITE_API_MOCK=true   → always use in-memory fixtures, never hit the proxy.

type ViteEnv = { VITE_API_MOCK?: string };

const env: ViteEnv =
  typeof import.meta !== "undefined" && (import.meta as { env?: ViteEnv }).env
    ? (import.meta as { env: ViteEnv }).env
    : {};

/** Same-origin path the server proxy listens on. */
export const API_PREFIX = "/api/v1";

/** Force fixtures regardless of backend availability (opt-in, for tests/offline). */
export const FORCE_MOCK = env.VITE_API_MOCK === "true";
