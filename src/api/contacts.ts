import type { Paginated } from '../types/api';
import type { ContactAdminItem, ContactPayload, ContactQuery } from '../types/contact';
import { apiClient, unwrap, unwrapPaginated } from './client';

const BASE_PATH = '/admin/contacts';

export function fetchContacts(query: ContactQuery, signal?: AbortSignal): Promise<Paginated<ContactAdminItem>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchContact(id: string, signal?: AbortSignal): Promise<ContactAdminItem> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createContact(payload: ContactPayload): Promise<ContactAdminItem> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateContact(id: string, payload: ContactPayload & { version: number }): Promise<ContactAdminItem> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteContact(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateContactStatus(id: string, isActive: boolean, version: number): Promise<ContactAdminItem> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}

export function reorderContacts(items: Array<{ id: string; sortOrder: number }>): Promise<ContactAdminItem[]> {
  return unwrap(apiClient.patch(`${BASE_PATH}/reorder`, { items }));
}
