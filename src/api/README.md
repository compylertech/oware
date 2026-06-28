# API layer (mock backend)

Everything the UI treats as "the backend" lives here, grouped by domain so the
folders mirror the services a real backend would expose. Routes and components
import from `@/api/<domain>` and never reach for raw fixtures directly.

## Structure

```
api/
  client.ts        Shared transport helpers (mockFetch, mockDelay, request)
  store.ts         In-memory reactive store shared by clients + cooperative
  loans/           Applications, active loans, product catalogue
  clients/         Client registry + store accessors
  cooperative/     Membership register (layered on clients)
  investments/     Institutions, proposals, positions, alerts, exposure
                   (types.ts · data.ts · store.ts · index.ts)
  <domain>/        types.ts · data.ts (fixtures) · index.ts (public API)
```

Each domain folder follows the same shape:

- **`types.ts`** — the domain's TypeScript types.
- **`data.ts`** — the seed/fixture data.
- **`index.ts`** — the public surface the app imports. Today it re-exports
  fixtures; swap these bodies to call `request()` when a real backend exists.

## Adding a domain

1. Create `api/<domain>/{types.ts,data.ts,index.ts}`.
2. Export the public accessors from `index.ts`.
3. Import via `@/api/<domain>` from routes/components.

## Going live

When the real backend is ready, wire `request()` in `client.ts` to `fetch` and
replace each domain `index.ts` accessor with a `request()` call. Call sites stay
unchanged because they only depend on the domain's public API, not the fixtures.
```
