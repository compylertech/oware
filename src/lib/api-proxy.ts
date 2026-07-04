// Same-origin API proxy.
//
// The browser calls `/api/v1/*` on the app's own origin; this forwards those
// requests to the corebanking backend with server-side HTTP Basic auth. Keeping
// it server-side avoids CORS and never exposes credentials to the client.
//
// Configuration (server env; on Cloudflare these arrive via the `env` binding,
// locally via process.env):
//   OWARE_BACKEND_URL       backend base, e.g. https://host  (no /api/v1)
//   OWARE_BACKEND_USER      Basic-auth user (default: admin)
//   OWARE_BACKEND_PASSWORD  Basic-auth pass (default: admin)
//
// If no backend URL is configured the proxy returns 503 and the frontend
// transparently falls back to its in-memory fixtures.

const PROXY_PREFIX = "/api/v1/";

// Temporary default so the app shows live data out of the box against the
// current demo backend. Override with OWARE_BACKEND_URL in any real deployment
// (the demo tunnel is ephemeral and will stop resolving).
const DEFAULT_BACKEND_URL = "https://2d62-41-210-20-252.ngrok-free.app";

type Env = Record<string, string | undefined> | undefined;

function readEnv(key: string, env: Env): string | undefined {
  if (env && typeof env[key] === "string") return env[key];
  if (typeof process !== "undefined" && process.env && typeof process.env[key] === "string") {
    return process.env[key];
  }
  return undefined;
}

function base64(input: string): string {
  if (typeof btoa === "function") return btoa(input);
  return Buffer.from(input, "utf-8").toString("base64");
}

function backendConfig(env: Env) {
  const base = (readEnv("OWARE_BACKEND_URL", env) ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
  const user = readEnv("OWARE_BACKEND_USER", env) ?? "admin";
  const pass = readEnv("OWARE_BACKEND_PASSWORD", env) ?? "admin";
  return { base, auth: `Basic ${base64(`${user}:${pass}`)}` };
}

/**
 * If the request targets the API proxy path, forward it to the backend and
 * return the response. Otherwise return undefined so normal SSR handling runs.
 */
export async function proxyApiRequest(request: Request, env?: Env): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(PROXY_PREFIX)) return undefined;

  const { base, auth } = backendConfig(env);
  if (!base) {
    return json({ error: "backend not configured" }, 503);
  }

  // Preserve the full path (…/api/v1/…) and query string.
  const target = `${base}${url.pathname}${url.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Authorization", auth);
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
