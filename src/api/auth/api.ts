// Auth service - maps to the "Auth" and "Platform" groups of the Postman
// collection.
//   GET  /platform/tenants/lookup  email -> which tenant(s) this email belongs to
//   POST /auth/login                email + password (+ tenant) -> tokens + user
//   POST /auth/refresh              refreshToken -> new tokens + user
//   POST /auth/logout               revoke the current session (best-effort)
//   POST /auth/logout-all           revoke every session for this user
//   POST /auth/forgot-password      email (+ tenant) -> generic "sent if it exists"
//   GET  /users/me                  current user (id/email/name/role/...)
//
// Auth is Bearer-token based end to end (HTTP Basic was removed on the
// backend) and every request needs an X-Tenant-Id header matching the tenant
// the token was issued for - a mismatch is rejected outright, even for a
// request that otherwise carries a perfectly valid token. There is no fixed
// tenant for this app: the sign-in flow resolves it per email via the tenant
// lookup endpoint (see lookupTenants) before a password is ever entered.

import { request } from "../backend/http";
import { clearSession, getSession, setSession, type AuthUser } from "./store";

export type TenantOption = {
  tenantCode: string;
  tenantName: string;
};

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  user: AuthUser;
};

export const authApi = {
  /** Cross-tenant lookup - deliberately sent with no X-Tenant-Id (there is no
   * session yet, and the whole point is to discover which tenant(s) an email
   * belongs to before attempting to log in). */
  lookupTenants(email: string): Promise<TenantOption[]> {
    return request<TenantOption[]>("/platform/tenants/lookup", { query: { email } });
  },

  async login(email: string, password: string, tenantCode: string): Promise<AuthUser> {
    const data = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      tenantId: tenantCode,
      idempotent: false,
    });
    setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tenantCode,
      expiresAt: Date.now() + data.accessTokenExpiresInSeconds * 1000,
      user: data.user,
    });
    return data.user;
  },

  /** Best-effort - clears the local session regardless of whether the backend call succeeds. */
  async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", { method: "POST", idempotent: false });
    } finally {
      clearSession();
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await request<void>("/auth/logout-all", { method: "POST", idempotent: false });
    } finally {
      clearSession();
    }
  },

  forgotPassword(email: string, tenantCode: string): Promise<void> {
    return request<void>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      tenantId: tenantCode,
      idempotent: false,
    });
  },

  me(): Promise<AuthUser> {
    return request<AuthUser>("/users/me");
  },

  currentUser(): AuthUser | null {
    return getSession()?.user ?? null;
  },
};
