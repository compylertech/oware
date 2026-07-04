// HTTP transport for the corebanking-starter backend.
//
// Responsibilities:
//   - prefix requests with the configured base URL and /api/v1
//   - attach HTTP Basic auth and JSON headers
//   - attach an Idempotency-Key on writes (matches the Postman collection)
//   - unwrap the `{ data }` envelope when present
//   - surface a typed BackendUnavailable error so services can fall back to mock
//
// Nothing here is UI-aware; services in this folder compose it.

import { API_BASE_URL, USE_MOCK, basicAuthHeader } from "./config";
import type { ApiEnvelope } from "./dto";

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

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Writes send an Idempotency-Key by default; set false to opt out. */
  idempotent?: boolean;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}/api/v1${clean}`);
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

/**
 * Perform a JSON request against the backend. Throws {@link BackendUnavailable}
 * in mock mode or on a network failure so callers can fall back to fixtures,
 * and {@link ApiError} on a non-2xx response.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (USE_MOCK) throw new BackendUnavailable();

  const method = opts.method ?? "GET";
  const isWrite = method !== "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: basicAuthHeader(),
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (isWrite && opts.idempotent !== false) headers["Idempotency-Key"] = guid();

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    // DNS/refused/CORS/offline → treat as unavailable so the UI degrades to mock.
    throw new BackendUnavailable(err);
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
