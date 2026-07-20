import type { Paginated } from '../types/api';
import type {
  CreateTradePostCategoryInput,
  TradePostCategoryAdminItem,
  TradePostCategoryAdminQuery,
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

export function createTradePostCategory(
  input: CreateTradePostCategoryInput,
): Promise<TradePostCategoryAdminItem> {
  return unwrap(apiClient.post('/admin/trade-post-categories', input));
}
