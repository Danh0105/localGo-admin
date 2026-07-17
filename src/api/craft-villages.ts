import type { Paginated } from '../types/api';
import type { CraftVillageAdminItem, CraftVillagePayload, CraftVillageQuery } from '../types/craft-village';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchCraftVillages(query: CraftVillageQuery, signal?: AbortSignal): Promise<Paginated<CraftVillageAdminItem>> {
  return unwrapPaginated(apiClient.get('/admin/craft-villages', { params: query, signal }));
}
export function fetchCraftVillage(id: string, signal?: AbortSignal): Promise<CraftVillageAdminItem> {
  return unwrap(apiClient.get(`/admin/craft-villages/${id}`, { signal }));
}
export function createCraftVillage(payload: CraftVillagePayload): Promise<CraftVillageAdminItem> {
  return unwrap(apiClient.post('/admin/craft-villages', payload));
}
export function updateCraftVillage(id: string, payload: CraftVillagePayload & { version: number }): Promise<CraftVillageAdminItem> {
  return unwrap(apiClient.put(`/admin/craft-villages/${id}`, payload));
}
export async function deleteCraftVillage(id: string): Promise<void> {
  await apiClient.delete(`/admin/craft-villages/${id}`);
}
export function updateCraftVillageStatus(id: string, isActive: boolean, version: number): Promise<CraftVillageAdminItem> {
  return unwrap(apiClient.patch(`/admin/craft-villages/${id}/status`, { isActive, version }));
}
export function reorderCraftVillages(items: Array<{ id: string; sortOrder: number }>): Promise<CraftVillageAdminItem[]> {
  return unwrap(apiClient.patch('/admin/craft-villages/reorder', { items }));
}
