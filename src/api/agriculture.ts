import type { Paginated } from '../types/api';
import type { AgricultureAdminItem, AgriculturePayload, AgricultureQuery } from '../types/agriculture';
import { apiClient, unwrap, unwrapPaginated } from './client';

// apiClient already supplies the deployment-specific /api or /api/v1 prefix.
const BASE_PATH = '/admin/agriculture';

export function fetchAgricultureItems(
  query: AgricultureQuery,
  signal?: AbortSignal,
): Promise<Paginated<AgricultureAdminItem>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchAgricultureItem(id: string, signal?: AbortSignal): Promise<AgricultureAdminItem> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createAgricultureItem(payload: AgriculturePayload): Promise<AgricultureAdminItem> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateAgricultureItem(
  id: string,
  payload: AgriculturePayload & { version: number },
): Promise<AgricultureAdminItem> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteAgricultureItem(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateAgricultureStatus(
  id: string,
  isActive: boolean,
  version: number,
): Promise<AgricultureAdminItem> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}

export function reorderAgricultureItems(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<AgricultureAdminItem[]> {
  return unwrap(apiClient.patch(`${BASE_PATH}/reorder`, { items }));
}
