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
import type {
  ClientAddressDto,
  ClientAddressWriteDto,
  ClientCreateDto,
  ClientDto,
  ClientFamilyMemberDto,
  ClientIdentifierDto,
  ClientNoteDto,
  ClientUpdateDto,
  Page,
} from "./dto";
import { request, withMock } from "./http";
import { mapClient } from "./mappers";

export type {
  ClientAddressDto,
  ClientAddressWriteDto,
  ClientFamilyMemberDto,
  ClientIdentifierDto,
  ClientNoteDto,
  ClientUpdateDto,
} from "./dto";

export type ClientSearch = {
  page?: number;
  size?: number;
  keyword?: string;
};

function pageContent<T>(page: Page<T> | T[]): T[] {
  if (Array.isArray(page)) return page;
  return page.content ?? page.items ?? [];
}

function listContent<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const value = record[key] ?? record.content ?? record.items;
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function mockId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

function mockAddressFromWrite(addressId: number, body: ClientAddressWriteDto): ClientAddressDto {
  return {
    addressId,
    addressType: body.addressTypeCode,
    addressLine1: body.addressLine1 ?? "",
    addressLine2: body.addressLine2 ?? "",
    city: body.city ?? "",
    stateName: body.stateProvinceCode ?? "",
    countryName: body.countryCode ?? "",
    postalCode: body.postalCode ?? "",
    active: body.active ?? true,
  };
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

  update(id: string, payload: ClientUpdateDto): Promise<Client> {
    return withMock(
      async () =>
        mapClient(await request<ClientDto>(`/clients/${id}`, { method: "PUT", body: payload })),
      () => {
        const existing = SEED_CLIENTS.find((c) => c.id === id || c.clientNumber === id);
        return mapClient({
          id: existing?.id ?? id,
          displayName:
            [payload.firstName, payload.middleName, payload.lastName].filter(Boolean).join(" ") ||
            existing?.name,
          accountNo: existing?.clientNumber,
          externalId: payload.externalId ?? existing?.externalId,
          firstName: payload.firstName ?? existing?.firstName,
          middleName: payload.middleName ?? existing?.middleName,
          lastName: payload.lastName ?? existing?.lastName,
          mobileNumber: payload.mobileNumber ?? existing?.mobile,
          email: payload.email ?? existing?.email,
          officeName: existing?.officeName,
          activationDate: payload.activationDate ?? existing?.activationDate,
          staff: payload.staff ?? existing?.isStaff,
        });
      },
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

  addresses(clientId: string): Promise<ClientAddressDto[]> {
    return withMock(
      async () =>
        listContent<ClientAddressDto>(await request(`/clients/${clientId}/addresses`), "addresses"),
      () => [],
    );
  },

  addAddress(clientId: string, body: ClientAddressWriteDto): Promise<ClientAddressDto> {
    return withMock(
      async () =>
        request<ClientAddressDto>(`/clients/${clientId}/addresses`, { method: "POST", body }),
      () => mockAddressFromWrite(Date.now(), body),
    );
  },

  updateAddress(
    clientId: string,
    addressId: number | string,
    body: ClientAddressWriteDto,
  ): Promise<ClientAddressDto> {
    return withMock(
      async () =>
        request<ClientAddressDto>(`/clients/${clientId}/addresses/${addressId}`, {
          method: "PUT",
          body,
        }),
      () => mockAddressFromWrite(Number(addressId), body),
    );
  },

  familyMembers(clientId: string): Promise<ClientFamilyMemberDto[]> {
    return withMock(
      async () =>
        listContent<ClientFamilyMemberDto>(
          await request(`/clients/${clientId}/family-members`),
          "familyMembers",
        ),
      () => [],
    );
  },

  addFamilyMember(clientId: string, body: ClientFamilyMemberDto): Promise<ClientFamilyMemberDto> {
    return withMock(
      async () =>
        request<ClientFamilyMemberDto>(`/clients/${clientId}/family-members`, {
          method: "POST",
          body,
        }),
      () => ({ id: mockId("fam"), ...body }),
    );
  },

  updateFamilyMember(
    clientId: string,
    memberId: string,
    body: ClientFamilyMemberDto,
  ): Promise<ClientFamilyMemberDto> {
    return withMock(
      async () =>
        request<ClientFamilyMemberDto>(`/clients/${clientId}/family-members/${memberId}`, {
          method: "PUT",
          body,
        }),
      () => ({ id: memberId, ...body }),
    );
  },

  deleteFamilyMember(clientId: string, memberId: string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${clientId}/family-members/${memberId}`, { method: "DELETE" }),
      () => undefined,
    );
  },

  identifiers(clientId: string): Promise<ClientIdentifierDto[]> {
    return withMock(
      async () =>
        listContent<ClientIdentifierDto>(
          await request(`/clients/${clientId}/identifiers`),
          "identifiers",
        ),
      () => [],
    );
  },

  addIdentifier(clientId: string, body: ClientIdentifierDto): Promise<ClientIdentifierDto> {
    return withMock(
      async () =>
        request<ClientIdentifierDto>(`/clients/${clientId}/identifiers`, {
          method: "POST",
          body,
        }),
      () => ({ id: mockId("id"), ...body }),
    );
  },

  updateIdentifier(
    clientId: string,
    identifierId: string,
    body: ClientIdentifierDto,
  ): Promise<ClientIdentifierDto> {
    return withMock(
      async () =>
        request<ClientIdentifierDto>(`/clients/${clientId}/identifiers/${identifierId}`, {
          method: "PUT",
          body,
        }),
      () => ({ id: identifierId, ...body }),
    );
  },

  deleteIdentifier(clientId: string, identifierId: string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${clientId}/identifiers/${identifierId}`, { method: "DELETE" }),
      () => undefined,
    );
  },

  notes(clientId: string): Promise<ClientNoteDto[]> {
    return withMock(
      async () => listContent<ClientNoteDto>(await request(`/clients/${clientId}/notes`), "notes"),
      () => [],
    );
  },

  addNote(clientId: string, body: ClientNoteDto): Promise<ClientNoteDto> {
    return withMock(
      async () => request<ClientNoteDto>(`/clients/${clientId}/notes`, { method: "POST", body }),
      () => ({ id: mockId("note"), ...body }),
    );
  },

  updateNote(clientId: string, noteId: string, body: ClientNoteDto): Promise<ClientNoteDto> {
    return withMock(
      async () =>
        request<ClientNoteDto>(`/clients/${clientId}/notes/${noteId}`, { method: "PUT", body }),
      () => ({ id: noteId, ...body }),
    );
  },

  deleteNote(clientId: string, noteId: string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${clientId}/notes/${noteId}`, { method: "DELETE" }),
      () => undefined,
    );
  },
};
