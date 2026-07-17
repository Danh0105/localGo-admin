import type { Paginated } from '../types/api';
import type { SpecialtyAdminItem, SpecialtyPayload, SpecialtyQuery } from '../types/specialty';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchSpecialties(query: SpecialtyQuery, signal?: AbortSignal): Promise<Paginated<SpecialtyAdminItem>> {
  return unwrapPaginated(apiClient.get('/admin/specialties', { params: query, signal }));
}

export function fetchSpecialty(id: string, signal?: AbortSignal): Promise<SpecialtyAdminItem> {
  return unwrap(apiClient.get(`/admin/specialties/${id}`, { signal }));
}

export function createSpecialty(payload: SpecialtyPayload): Promise<SpecialtyAdminItem> {
  return unwrap(apiClient.post('/admin/specialties', payload));
}

export function updateSpecialty(id: string, payload: SpecialtyPayload & { version: number }): Promise<SpecialtyAdminItem> {
  return unwrap(apiClient.put(`/admin/specialties/${id}`, payload));
}

export async function deleteSpecialty(id: string): Promise<void> {
  await apiClient.delete(`/admin/specialties/${id}`);
}

export function updateSpecialtyStatus(id: string, isActive: boolean, version: number): Promise<SpecialtyAdminItem> {
  return unwrap(apiClient.patch(`/admin/specialties/${id}/status`, { isActive, version }));
}

export function reorderSpecialties(items: Array<{ id: string; sortOrder: number }>): Promise<SpecialtyAdminItem[]> {
  return unwrap(apiClient.patch('/admin/specialties/reorder', { items }));
}
