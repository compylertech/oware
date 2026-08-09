// Clients service - maps to the "Clients" group of the Postman collection.
//   GET    /clients            search (paged)
//   GET    /clients/{id}       get one
//   POST   /clients            create
//   PUT    /clients/{id}       update
//   POST   /clients/{id}/activate | /reactivate | /close
//
// Live calls hit the backend; when it is unavailable, list/detail reads fall
// back to an empty result (rather than fabricated data) so the UI degrades
// gracefully instead of breaking.

import type { Client } from "../clients/types";
import type {
  ClientAccountsSummaryDto,
  ClientAddressDto,
  ClientAddressWriteDto,
  ClientCreateDto,
  ClientDto,
  ClientFamilyMemberDto,
  ClientFamilyMemberWriteDto,
  ClientIdentifierDto,
  ClientIdentifierWriteDto,
  ClientNoteDto,
  ClientNoteWriteDto,
  ClientUpdateDto,
  Page,
} from "./dto";
import { request, withMock } from "./http";
import { mapClient } from "./mappers";

export type {
  ClientAccountsSummaryDto,
  ClientAddressDto,
  ClientAddressWriteDto,
  ClientFamilyMemberDto,
  ClientFamilyMemberWriteDto,
  ClientIdentifierDto,
  ClientIdentifierWriteDto,
  ClientNoteDto,
  ClientNoteWriteDto,
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

function mockFamilyMemberFromWrite(
  id: number,
  body: ClientFamilyMemberWriteDto,
): ClientFamilyMemberDto {
  return {
    id,
    firstName: body.firstName,
    middleName: body.middleName,
    lastName: body.lastName,
    qualification: body.qualification,
    relationship: body.relationshipCode ?? undefined,
    gender: body.genderCode ?? undefined,
    profession: body.professionCode ?? undefined,
    maritalStatus: body.maritalStatusCode ?? undefined,
    dateOfBirth: body.dateOfBirth ?? undefined,
    age: body.age,
    dependent: body.dependent ?? false,
  };
}

function mockIdentifierFromWrite(id: number, body: ClientIdentifierWriteDto): ClientIdentifierDto {
  return {
    id,
    documentTypeName: body.documentTypeCode,
    documentKey: body.documentKey,
    description: body.description,
    status: body.status,
  };
}

function mockNoteFromWrite(id: number, body: ClientNoteWriteDto): ClientNoteDto {
  const now = new Date().toISOString();
  return {
    id,
    note: body.note,
    createdByUsername: "you",
    createdOn: now,
    updatedByUsername: "you",
    updatedOn: now,
  };
}

export const clientsApi = {
  /** Search/list clients. Falls back to an empty list when offline. */
  search(params: ClientSearch = {}): Promise<Client[]> {
    const { page = 0, size = 20, keyword } = params;
    return withMock(
      async () => {
        const res = await request<Page<ClientDto> | ClientDto[]>("/clients", {
          query: { page, size, keyword },
        });
        return pageContent(res).map(mapClient);
      },
      () => [],
    );
  },

  get(id: string): Promise<Client | undefined> {
    return withMock(
      async () => mapClient(await request<ClientDto>(`/clients/${id}`)),
      () => undefined,
    );
  },

  update(id: string, payload: ClientUpdateDto): Promise<Client> {
    return request<ClientDto>(`/clients/${id}`, { method: "PUT", body: payload }).then(mapClient);
  },

  create(payload: ClientCreateDto): Promise<Client> {
    return request<ClientDto>("/clients", { method: "POST", body: payload }).then(mapClient);
  },

  activate(id: string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${id}/activate`, { method: "POST" }),
      () => undefined,
    );
  },

  close(id: string, closureReasonCode: string, closureDate?: string): Promise<void> {
    return withMock(
      () =>
        request<void>(`/clients/${id}/close`, {
          method: "POST",
          body: { closureReasonCode, closureDate: closureDate ?? null },
        }),
      () => undefined,
    );
  },

  /** Combined loan/savings/share account summary for a client. */
  accountsSummary(clientId: string): Promise<ClientAccountsSummaryDto> {
    return withMock(
      () => request<ClientAccountsSummaryDto>(`/clients/${clientId}/accounts`),
      () => ({ loanAccounts: [], savingsAccounts: [], shareAccounts: [] }),
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

  deleteAddress(
    clientId: string,
    addressId: number | string,
    addressTypeCode: string,
  ): Promise<void> {
    return withMock(
      () =>
        request<void>(`/clients/${clientId}/addresses/${addressId}`, {
          method: "DELETE",
          query: { addressTypeCode },
        }),
      () => undefined,
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

  addFamilyMember(
    clientId: string,
    body: ClientFamilyMemberWriteDto,
  ): Promise<ClientFamilyMemberDto> {
    return withMock(
      async () =>
        request<ClientFamilyMemberDto>(`/clients/${clientId}/family-members`, {
          method: "POST",
          body,
        }),
      () => mockFamilyMemberFromWrite(Date.now(), body),
    );
  },

  updateFamilyMember(
    clientId: string,
    memberId: number | string,
    body: ClientFamilyMemberWriteDto,
  ): Promise<ClientFamilyMemberDto> {
    return withMock(
      async () =>
        request<ClientFamilyMemberDto>(`/clients/${clientId}/family-members/${memberId}`, {
          method: "PUT",
          body,
        }),
      () => mockFamilyMemberFromWrite(Number(memberId), body),
    );
  },

  deleteFamilyMember(clientId: string, memberId: number | string): Promise<void> {
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

  addIdentifier(clientId: string, body: ClientIdentifierWriteDto): Promise<ClientIdentifierDto> {
    return withMock(
      async () =>
        request<ClientIdentifierDto>(`/clients/${clientId}/identifiers`, {
          method: "POST",
          body,
        }),
      () => mockIdentifierFromWrite(Date.now(), body),
    );
  },

  updateIdentifier(
    clientId: string,
    identifierId: number | string,
    body: ClientIdentifierWriteDto,
  ): Promise<ClientIdentifierDto> {
    return withMock(
      async () =>
        request<ClientIdentifierDto>(`/clients/${clientId}/identifiers/${identifierId}`, {
          method: "PUT",
          body,
        }),
      () => mockIdentifierFromWrite(Number(identifierId), body),
    );
  },

  deleteIdentifier(clientId: string, identifierId: number | string): Promise<void> {
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

  addNote(clientId: string, body: ClientNoteWriteDto): Promise<ClientNoteDto> {
    return withMock(
      async () => request<ClientNoteDto>(`/clients/${clientId}/notes`, { method: "POST", body }),
      () => mockNoteFromWrite(Date.now(), body),
    );
  },

  updateNote(
    clientId: string,
    noteId: number | string,
    body: ClientNoteWriteDto,
  ): Promise<ClientNoteDto> {
    return withMock(
      async () =>
        request<ClientNoteDto>(`/clients/${clientId}/notes/${noteId}`, { method: "PUT", body }),
      () => mockNoteFromWrite(Number(noteId), body),
    );
  },

  deleteNote(clientId: string, noteId: number | string): Promise<void> {
    return withMock(
      () => request<void>(`/clients/${clientId}/notes/${noteId}`, { method: "DELETE" }),
      () => undefined,
    );
  },
};
