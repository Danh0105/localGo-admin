import type { Paginated } from '../types/api';
import type {
  CreateTradePostCategoryInput,
  ReorderTradePostCategoriesInput,
  TradePostCategoryAdminItem,
  TradePostCategoryAdminQuery,
  TradePostCategoryStatusInput,
  UpdateTradePostCategoryInput,
} from '../types/trade-post-category';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchAdminTradePostCategories(
  query: TradePostCategoryAdminQuery,
  signal?: AbortSignal,
): Promise<Paginated<TradePostCategoryAdminItem>> {
  return unwrapPaginated(
    apiClient.get('/admin/trade-post-categories', { params: query, signal }),
  );
}

export function fetchAdminTradePostCategory(
  id: string,
  signal?: AbortSignal,
): Promise<TradePostCategoryAdminItem> {
  return unwrap(apiClient.get(`/admin/trade-post-categories/${id}`, { signal }));
}

export function createTradePostCategory(
  input: CreateTradePostCategoryInput,
): Promise<TradePostCategoryAdminItem> {
  return unwrap(apiClient.post('/admin/trade-post-categories', input));
}

export function updateTradePostCategory(
  id: string,
  input: UpdateTradePostCategoryInput,
): Promise<TradePostCategoryAdminItem> {
  return unwrap(apiClient.patch(`/admin/trade-post-categories/${id}`, input));
}

export function toggleTradePostCategoryStatus(
  id: string,
  input: TradePostCategoryStatusInput,
): Promise<TradePostCategoryAdminItem> {
  return unwrap(apiClient.patch(`/admin/trade-post-categories/${id}/status`, input));
}

export function reorderTradePostCategories(
  input: ReorderTradePostCategoriesInput,
): Promise<void> {
  return apiClient.patch('/admin/trade-post-categories/reorder', input).then(() => undefined);
}

export function deleteTradePostCategory(id: string): Promise<void> {
  return apiClient.delete(`/admin/trade-post-categories/${id}`).then(() => undefined);
}
