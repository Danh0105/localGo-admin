import { apiClient, unwrap, unwrapPaginated } from './client';
import type { Paginated } from '../types/api';
import type { TradeReview, TradeReviewAdminQuery, TradeReviewStatus } from '../types/trade-review';

export function fetchAdminReviews(
  query: TradeReviewAdminQuery,
): Promise<Paginated<TradeReview>> {
  return unwrapPaginated(apiClient.get('/admin/reviews', { params: query }));
}

export function moderateReview(
  id: string,
  status: Extract<TradeReviewStatus, 'PUBLISHED' | 'HIDDEN'>,
): Promise<TradeReview> {
  return unwrap(apiClient.patch(`/admin/reviews/${id}/status`, { status }));
}
