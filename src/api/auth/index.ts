// Auth domain — session store + backend service.
export type { AuthUser, AuthSession } from "./store";
export { useAuthSession, getSession, getAccessToken } from "./store";
export { authApi, type TenantOption } from "./api";
