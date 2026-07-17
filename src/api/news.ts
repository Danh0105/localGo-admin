import type { Paginated } from '../types/api';
import type { NewsAdminArticle, NewsPayload, NewsQuery } from '../types/news';
import { apiClient, unwrap, unwrapPaginated } from './client';

const BASE_PATH = '/admin/news';

export function fetchNews(query: NewsQuery, signal?: AbortSignal): Promise<Paginated<NewsAdminArticle>> {
  return unwrapPaginated(apiClient.get(BASE_PATH, { params: query, signal }));
}

export function fetchNewsArticle(id: string, signal?: AbortSignal): Promise<NewsAdminArticle> {
  return unwrap(apiClient.get(`${BASE_PATH}/${id}`, { signal }));
}

export function createNewsArticle(payload: NewsPayload): Promise<NewsAdminArticle> {
  return unwrap(apiClient.post(BASE_PATH, payload));
}

export function updateNewsArticle(id: string, payload: NewsPayload & { version: number }): Promise<NewsAdminArticle> {
  return unwrap(apiClient.put(`${BASE_PATH}/${id}`, payload));
}

export async function deleteNewsArticle(id: string): Promise<void> {
  await apiClient.delete(`${BASE_PATH}/${id}`);
}

export function updateNewsStatus(id: string, isActive: boolean, version: number): Promise<NewsAdminArticle> {
  return unwrap(apiClient.patch(`${BASE_PATH}/${id}/status`, { isActive, version }));
}
