import { apiClient, unwrap, unwrapPaginated } from './client';
import type { Paginated } from '../types/api';
import type { TradePost, TradePostAdminQuery } from '../types/trade-post';
import {
  approveMockTradePost,
  archiveMockTradePost,
  deleteMockTradePost,
  featureMockTradePost,
  getMockTradePostDetail,
  getMockTradePosts,
  hideMockTradePost,
  rejectMockTradePost,
  unhideMockTradePost,
} from '../mocks/trade-posts.mock';

const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export function fetchAdminTradePosts(
  query: TradePostAdminQuery,
): Promise<Paginated<TradePost>> {
  if (useMockData) return getMockTradePosts(query);
  return unwrapPaginated(apiClient.get('/admin/trade-posts', { params: query }));
}

export function fetchAdminTradePostDetail(id: string): Promise<TradePost> {
  if (useMockData) return getMockTradePostDetail(id);
  return unwrap(apiClient.get(`/admin/trade-posts/${id}`));
}

export function approveTradePost(id: string): Promise<TradePost> {
  if (useMockData) return approveMockTradePost(id);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/approve`));
}

export function rejectTradePost(id: string, reason: string): Promise<TradePost> {
  if (useMockData) return rejectMockTradePost(id, reason);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/reject`, { reason }));
}

export function archiveTradePost(id: string): Promise<TradePost> {
  if (useMockData) return archiveMockTradePost(id);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/archive`));
}

export function hideTradePost(id: string): Promise<TradePost> {
  if (useMockData) return hideMockTradePost(id);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/hide`));
}

export function unhideTradePost(id: string): Promise<TradePost> {
  if (useMockData) return unhideMockTradePost(id);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/unhide`));
}

export async function deleteTradePost(id: string): Promise<void> {
  if (useMockData) return deleteMockTradePost(id);
  await apiClient.delete(`/admin/trade-posts/${id}`);
}

export function setTradePostFeatured(id: string, featured: boolean): Promise<TradePost> {
  if (useMockData) return featureMockTradePost(id, featured);
  return unwrap(apiClient.patch(`/admin/trade-posts/${id}/feature`, { featured }));
}
