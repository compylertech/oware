// Mock API client.
//
// Every domain folder under `src/api/*` exposes typed data and accessors that
// stand in for a real backend. Today they return in-memory fixtures; when a
// real backend lands, swap the body of each domain's `index.ts` to call
// `request()` (or your fetcher of choice) without touching the call sites.
//
// Keep this file dependency-free so it can be shared by every domain module.

/** Simulate network latency so loading states can be exercised in the UI. */
export function mockDelay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolve a fixture asynchronously, mimicking a fetch response. */
export async function mockFetch<T>(data: T, ms = 300): Promise<T> {
  await mockDelay(ms);
  return clone(data);
}

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Placeholder for the eventual real transport. Wire this to `fetch` once the
 * backend exists; domain modules already import from here.
 */
export async function request<T>(_path: string, _init?: RequestInit): Promise<T> {
  throw new Error("request() is not wired to a backend yet — domain modules return mock fixtures.");
}
