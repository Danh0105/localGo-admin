import type { Paginated } from '../types/api';
import type { ExperienceTourAdminItem, ExperienceTourPayload, ExperienceTourQuery } from '../types/experience-tour';
import { apiClient, unwrap, unwrapPaginated } from './client';

const BASE_PATH = '/admin/experience-tours';

export function fetchExperienceTours(
  query: ExperienceTourQuery,
  signal?: AbortSignal,
): Promise<Paginated<ExperienceTourAdminItem>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchExperienceTour(id: string, signal?: AbortSignal): Promise<ExperienceTourAdminItem> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createExperienceTour(payload: ExperienceTourPayload): Promise<ExperienceTourAdminItem> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateExperienceTour(
  id: string,
  payload: ExperienceTourPayload & { version: number },
): Promise<ExperienceTourAdminItem> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteExperienceTour(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateExperienceTourStatus(
  id: string,
  isActive: boolean,
  version: number,
): Promise<ExperienceTourAdminItem> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}

export function reorderExperienceTours(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<ExperienceTourAdminItem[]> {
  return unwrap(apiClient.patch(`${BASE_PATH}/reorder`, { items }));
}
