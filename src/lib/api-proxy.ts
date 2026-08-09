// Same-origin API proxy.
//
// The browser calls `/api/v1/*` on the app's own origin; this forwards those
// requests to the corebanking backend. Keeping it server-side avoids CORS and
// means the frontend never needs to know the real backend host.
//
// Auth is now Bearer-token based end to end (HTTP Basic was removed on the
// backend) - the proxy forwards whatever `Authorization: Bearer <token>`
// header the client sent, it does not inject credentials of its own. Every
// request also needs `X-Tenant-Id` (multi-tenancy): a login issued for one
// tenant is rejected on any request that doesn't carry that same tenant
// header. There's no single tenant for this app - it's resolved per email via
// the tenant-lookup endpoint at sign-in time - so the proxy forwards whatever
// `X-Tenant-Id` the client sent (matching that user's session) rather than
// injecting a fixed one; BACKEND_TENANT_ID is only a fallback for the rare
// case a request has no tenant context at all (e.g. manual testing).
//
// Configuration (server env; on Cloudflare these arrive via the `env` binding
// per wrangler.toml, locally via process.env):
//   BACKEND_URL        backend base, e.g. https://host  (no /api/v1) - set as
//                      a [vars] entry in wrangler.toml (see there)
//   BACKEND_TENANT_ID  fallback X-Tenant-Id when the client sends none
//
// If no backend URL is configured the proxy returns 503 and the frontend
// transparently falls back to its in-memory fixtures.

const PROXY_PREFIX = "/api/v1/";

// Temporary default so the app shows live data out of the box before BACKEND_URL
// is set. Override via wrangler.toml [vars] (deployed) or the BACKEND_URL env var
// (local) - the demo tunnel below is ephemeral and will stop resolving.
const DEFAULT_BACKEND_URL = "http://localhost:8084";

type Env = Record<string, string | undefined> | undefined;

function readEnv(key: string, env: Env): string | undefined {
  if (env && typeof env[key] === "string") return env[key];
  if (typeof process !== "undefined" && process.env && typeof process.env[key] === "string") {
    return process.env[key];
  }
  return undefined;
}

function backendConfig(env: Env) {
  const base = (readEnv("BACKEND_URL", env) ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
  const fallbackTenantId = readEnv("BACKEND_TENANT_ID", env);
  return { base, fallbackTenantId };
}

/**
 * If the request targets the API proxy path, forward it to the backend and
 * return the response. Otherwise return undefined so normal SSR handling runs.
 */
export async function proxyApiRequest(request: Request, env?: Env): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(PROXY_PREFIX)) return undefined;

  const { base, fallbackTenantId } = backendConfig(env);
  if (!base) {
    return json({ error: "backend not configured" }, 503);
  }

  // Preserve the full path (…/api/v1/…) and query string.
  const target = `${base}${url.pathname}${url.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  // The tenant the client's own session belongs to, if any (tenant-lookup
  // itself intentionally sends none - it has no session yet).
  const tenantId = request.headers.get("x-tenant-id") ?? fallbackTenantId;
  if (tenantId) headers.set("X-Tenant-Id", tenantId);
  // Forward the caller's own bearer token - the proxy holds no credentials.
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);
  // Bypass the ngrok free-tier browser interstitial (no-op for other hosts).
  headers.set("ngrok-skip-browser-warning", "true");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idem = request.headers.get("idempotency-key");
  if (idem) headers.set("Idempotency-Key", idem);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let res: Response;
  try {
    res = await fetch(target, { method, headers, body });
  } catch {
    return json({ error: "backend unreachable" }, 502);
  }

  // Relay status + body; only forward a safe content-type header.
  const outHeaders = new Headers();
  const resType = res.headers.get("content-type");
  if (resType) outHeaders.set("Content-Type", resType);
  const buf = await res.arrayBuffer();
  return new Response(buf, { status: res.status, headers: outHeaders });
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
