import type { Paginated } from '../types/api';
import type {
  HistoricalSiteAdminItem,
  HistoricalSitePayload,
  HistoricalSiteQuery,
} from '../types/historical-site';
import { apiClient, unwrap, unwrapPaginated } from './client';

const BASE_PATH = '/admin/historical-sites';

export function fetchHistoricalSites(
  query: HistoricalSiteQuery,
  signal?: AbortSignal,
): Promise<Paginated<HistoricalSiteAdminItem>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchHistoricalSite(id: string, signal?: AbortSignal): Promise<HistoricalSiteAdminItem> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createHistoricalSite(payload: HistoricalSitePayload): Promise<HistoricalSiteAdminItem> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateHistoricalSite(
  id: string,
  payload: HistoricalSitePayload & { version: number },
): Promise<HistoricalSiteAdminItem> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteHistoricalSite(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateHistoricalSiteStatus(
  id: string,
  isActive: boolean,
  version: number,
): Promise<HistoricalSiteAdminItem> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}

export function reorderHistoricalSites(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<HistoricalSiteAdminItem[]> {
  return unwrap(apiClient.patch(`${BASE_PATH}/reorder`, { items }));
}

