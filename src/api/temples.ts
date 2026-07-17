import type { Paginated } from '../types/api';
import type { TempleAdminItem, TemplePayload, TempleQuery } from '../types/temple';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchTemples(query: TempleQuery, signal?: AbortSignal): Promise<Paginated<TempleAdminItem>> {
  return unwrapPaginated(apiClient.get('/admin/temples', { params: query, signal }));
}

export function fetchTemple(id: string, signal?: AbortSignal): Promise<TempleAdminItem> {
  return unwrap(apiClient.get(`/admin/temples/${id}`, { signal }));
}

export function createTemple(payload: TemplePayload): Promise<TempleAdminItem> {
  return unwrap(apiClient.post('/admin/temples', payload));
}

export function updateTemple(id: string, payload: TemplePayload & { version: number }): Promise<TempleAdminItem> {
  return unwrap(apiClient.put(`/admin/temples/${id}`, payload));
}

export async function deleteTemple(id: string): Promise<void> {
  await apiClient.delete(`/admin/temples/${id}`);
}

export function updateTempleStatus(id: string, isActive: boolean, version: number): Promise<TempleAdminItem> {
  return unwrap(apiClient.patch(`/admin/temples/${id}/status`, { isActive, version }));
}

export function reorderTemples(items: Array<{ id: string; sortOrder: number }>): Promise<TempleAdminItem[]> {
  return unwrap(apiClient.patch('/admin/temples/reorder', { items }));
}

