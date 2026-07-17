import type { Paginated } from '../types/api';
import type { MapPlaceAdminItem, MapPlacePayload, MapPlaceQuery } from '../types/map-place';
import { apiClient, unwrap, unwrapPaginated } from './client';

const BASE_PATH = '/admin/map-places';

export function fetchMapPlaces(query: MapPlaceQuery, signal?: AbortSignal): Promise<Paginated<MapPlaceAdminItem>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchMapPlace(id: string, signal?: AbortSignal): Promise<MapPlaceAdminItem> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createMapPlace(payload: MapPlacePayload): Promise<MapPlaceAdminItem> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateMapPlace(id: string, payload: MapPlacePayload & { version: number }): Promise<MapPlaceAdminItem> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteMapPlace(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateMapPlaceStatus(id: string, isActive: boolean, version: number): Promise<MapPlaceAdminItem> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}

export function reorderMapPlaces(items: Array<{ id: string; sortOrder: number }>): Promise<MapPlaceAdminItem[]> {
  return unwrap(apiClient.patch(`${BASE_PATH}/reorder`, { items }));
}
