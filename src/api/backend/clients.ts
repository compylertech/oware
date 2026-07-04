// Clients service — maps to the "Clients" group of the Postman collection.
//   GET    /clients            search (paged)
//   GET    /clients/{id}       get one
//   POST   /clients            create
//   PUT    /clients/{id}       update
//   POST   /clients/{id}/activate | /reactivate | /close
//
// Live calls hit the backend; when it is unavailable every method falls back to
// the seed fixtures so the UI is unaffected.

import type { Client } from "../clients/types";
import { SEED_CLIENTS } from "../clients/data";
import type { ClientCreateDto, ClientDto, Page } from "./dto";
import { request, withMock } from "./http";
import { mapClient } from "./mappers";

export type ClientSearch = {
  page?: number;
  size?: number;
  keyword?: string;
};

function pageContent<T>(page: Page<T> | T[]): T[] {
  if (Array.isArray(page)) return page;
  return page.content ?? page.items ?? [];
}

export const clientsApi = {
  /** Search/list clients. Falls back to the seed registry when offline. */
  search(params: ClientSearch = {}): Promise<Client[]> {
    const { page = 0, size = 20, keyword } = params;
    return withMock(
      async () => {
        const res = await request<Page<ClientDto> | ClientDto[]>("/clients", {
          query: { page, size, keyword },
        });
        return pageContent(res).map(mapClient);
      },
      () => {
        if (!keyword) return SEED_CLIENTS;
        const q = keyword.toLowerCase();
        return SEED_CLIENTS.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.clientNumber.toLowerCase().includes(q) ||
            c.externalId.toLowerCase().includes(q),
        );
      },
    );
  },

  get(id: string): Promise<Client | undefined> {
    return withMock(
      async () => mapClient(await request<ClientDto>(`/clients/${id}`)),
      () => SEED_CLIENTS.find((c) => c.id === id || c.clientNumber === id),
    );
  },

  create(payload: ClientCreateDto): Promise<Client> {
    return withMock(
      async () =>
        mapClient(await request<ClientDto>("/clients", { method: "POST", body: payload })),
      () => ({
        id: `clt-${Date.now()}`,
        name: [payload.firstName, payload.middleName, payload.lastName].filter(Boolean).join(" "),
        clientNumber: `CLT-${Date.now().toString().slice(-4)}`,
        externalId: payload.externalId ?? "",
        status: payload.activeOnCreation ? "Active" : "Pending",
        officeName: payload.officeCode ?? "",
        activationDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        firstName: payload.firstName,
        middleName: payload.middleName ?? undefined,
        lastName: payload.lastName,
        mobile: payload.mobileNumber ?? undefined,
        email: payload.email ?? undefined,
        isStaff: payload.staff,
      }),
    );
  },

  activate(id: string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${id}/activate`, { method: "POST" }),
      () => undefined,
    );
  },

  close(id: string, closureDate?: string): Promise<void> {
    return withMock(
      () =>
        request<void>(`/clients/${id}/close`, {
          method: "POST",
          body: { closureReasonCode: null, closureDate: closureDate ?? null },
        }),
      () => undefined,
    );
  },
};
