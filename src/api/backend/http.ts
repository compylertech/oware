// HTTP transport for the corebanking backend.
//
// Requests go to the app's own same-origin proxy (`/api/v1/*`, handled in
// src/server.ts), which forwards to the real backend. This keeps the browser
// free of CORS problems and hides the real backend host.
//
// Responsibilities:
//   - build the same-origin URL and attach JSON headers
//   - attach the logged-in user's Bearer token (auth is end-to-end JWT now —
//     the backend no longer accepts HTTP Basic) and transparently refresh it
//     once on a 401 before giving up
//   - attach an Idempotency-Key on writes (matches the Postman collection)
//   - unwrap the `{ success, message, data, error }` envelope
//   - surface BackendUnavailable (mock/SSR/proxy-down) so callers fall back to
//     the in-memory fixtures, keeping the UI working with no backend

import { API_PREFIX, FORCE_MOCK } from "./config";
import type { ApiEnvelope } from "./dto";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSession,
  setSession,
} from "../auth/store";

export class BackendUnavailable extends Error {
  constructor(cause?: unknown) {
    super("corebanking backend is not reachable");
    this.name = "BackendUnavailable";
    if (cause) this.cause = cause;
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Pull the human-readable message out of a failed request, e.g.
 * `{ success: false, message: "Client cannot be closed…", error: { providerErrors: [...] } }`.
 * Falls back to a generic message for anything else (network errors, mock mode).
 */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof ApiError) {
    const body = err.body as
      | {
          message?: string;
          error?: { providerErrors?: { message?: string }[] };
        }
      | undefined;
    return (
      body?.error?.providerErrors?.[0]?.message ||
      body?.message ||
      `Request failed (${err.status}).`
    );
  }
  if (err instanceof BackendUnavailable) return "Backend is not reachable right now.";
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Writes send an Idempotency-Key by default; set false to opt out. */
  idempotent?: boolean;
  signal?: AbortSignal;
  /**
   * Overrides the X-Tenant-Id header for this call. Needed for login (the
   * tenant was just resolved via the tenant lookup and there's no session yet
   * to read it from). Every other call defaults to the current session's
   * tenantCode automatically.
   */
  tenantId?: string;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_PREFIX}${clean}`, origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function guid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as ApiEnvelope<T>).data;
    if (data !== undefined && data !== null) return data as T;
  }
  return payload as T;
}

// Auth endpoints are public (no bearer token to send) and must never trigger
// the refresh-on-401 dance below — refresh itself hits /auth/refresh, and a
// failed login is a real "wrong password", not an expired-token situation.
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/register"]);

/** Single request attempt — no refresh/retry logic. */
async function rawRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  // Only run in the browser: SSR renders fixtures, the browser hydrates live data.
  if (FORCE_MOCK || typeof window === "undefined") throw new BackendUnavailable();

  const method = opts.method ?? "GET";
  const isWrite = method !== "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (isWrite && opts.idempotent !== false) headers["Idempotency-Key"] = guid();
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenantId = opts.tenantId ?? getSession()?.tenantCode;
  if (tenantId) headers["X-Tenant-Id"] = tenantId;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    throw new BackendUnavailable(err);
  }

  // Proxy signals a missing/unreachable backend with 502/503/504 → fall back.
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new BackendUnavailable();
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  const json = (await res.json()) as ApiEnvelope<T> | T;
  return unwrap<T>(json);
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  user: import("../auth/store").AuthUser;
};

// Concurrent 401s during the same window should trigger exactly one refresh
// call, not one per in-flight request.
let refreshInFlight: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");
  const data = await rawRequest<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    idempotent: false,
  });
  const current = getSession();
  setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    tenantCode: current?.tenantCode ?? "",
    expiresAt: Date.now() + data.accessTokenExpiresInSeconds * 1000,
    user: data.user ?? current?.user,
  });
}

/**
 * Perform a JSON request against the same-origin proxy. Throws
 * {@link BackendUnavailable} in mock mode, during SSR, or when the proxy/backend
 * is unreachable so callers can fall back to fixtures; {@link ApiError} on other
 * non-2xx responses. A 401 (other than from the auth endpoints themselves)
 * triggers one transparent refresh-and-retry before giving up; if the refresh
 * also fails the session is cleared so the app's route guard redirects to
 * sign-in.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, opts);
  } catch (err) {
    const shouldRefresh =
      err instanceof ApiError &&
      err.status === 401 &&
      !NO_REFRESH_PATHS.has(path) &&
      getRefreshToken();
    if (!shouldRefresh) throw err;

    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null;
      });
      await refreshInFlight;
    } catch {
      clearSession();
      throw err;
    }
    return rawRequest<T>(path, opts);
  }
}

/**
 * Run a live request, falling back to a mock producer whenever the backend is
 * unavailable. This is the seam that keeps the UI working with no backend.
 */
export async function withMock<T>(live: () => Promise<T>, mock: () => T | Promise<T>): Promise<T> {
  try {
    return await live();
  } catch (err) {
    if (err instanceof BackendUnavailable) return mock();
    throw err;
  }
}
