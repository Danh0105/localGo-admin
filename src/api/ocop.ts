import type { Paginated } from '../types/api';
import type { OcopAdminProduct, OcopPayload, OcopQuery } from '../types/ocop';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchOcopProducts(query: OcopQuery, signal?: AbortSignal): Promise<Paginated<OcopAdminProduct>> {
  return unwrapPaginated(apiClient.get('/admin/ocop', { params: query, signal }));
}

export function fetchOcopProduct(id: string, signal?: AbortSignal): Promise<OcopAdminProduct> {
  return unwrap(apiClient.get(`/admin/ocop/${id}`, { signal }));
}

export function createOcopProduct(payload: OcopPayload): Promise<OcopAdminProduct> {
  return unwrap(apiClient.post('/admin/ocop', payload));
}

export function updateOcopProduct(id: string, payload: OcopPayload & { version: number }): Promise<OcopAdminProduct> {
  return unwrap(apiClient.put(`/admin/ocop/${id}`, payload));
}

export async function deleteOcopProduct(id: string): Promise<void> {
  await apiClient.delete(`/admin/ocop/${id}`);
}

export function updateOcopStatus(id: string, isActive: boolean, version: number): Promise<OcopAdminProduct> {
  return unwrap(apiClient.patch(`/admin/ocop/${id}/status`, { isActive, version }));
}

export function reorderOcopProducts(items: Array<{ id: string; sortOrder: number }>): Promise<OcopAdminProduct[]> {
  return unwrap(apiClient.patch('/admin/ocop/reorder', { items }));
}
