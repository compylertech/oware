// Auth session store — a module-level singleton (same pattern as
// src/api/store.ts for clients) holding the logged-in user's tokens.
//
// Deliberately dependency-free (no imports from ../backend/http) so that
// http.ts can read the access token without creating a circular import: the
// dependency direction is store.ts <- http.ts and store.ts <- auth/api.ts,
// never the other way.

import { useSyncExternalStore } from "react";

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  active?: boolean;
  defaultRole?: string;
  roleIds?: string[];
  groupIds?: string[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  // Every request must carry the tenant the token was issued for (X-Tenant-Id)
  // — a mismatch is rejected outright, so this travels with the session
  // rather than being a fixed deployment-wide constant.
  tenantCode: string;
  /** Epoch ms; informational only (e.g. for a "session expiring" banner) — the
   * source of truth for whether a token still works is the 401 it gets back. */
  expiresAt: number;
  user: AuthUser;
};

const STORAGE_KEY = "oware.auth.session";

function loadPersisted(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

function persist(next: AuthSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode, quota) — session just won't persist */
  }
}

let session: AuthSession | null = loadPersisted();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSession(): AuthSession | null {
  return session;
}

export function getAccessToken(): string | null {
  return session?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return session?.refreshToken ?? null;
}

export function setSession(next: AuthSession | null) {
  session = next;
  persist(next);
  emit();
}

export function clearSession() {
  setSession(null);
}

export function useAuthSession(): AuthSession | null {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => null,
  );
}
