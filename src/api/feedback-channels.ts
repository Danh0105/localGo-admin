import type { Paginated } from '../types/api';
import type { FeedbackChannelAdminItem, FeedbackChannelPayload, FeedbackChannelQuery } from '../types/feedback-channel';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchFeedbackChannels(
  query: FeedbackChannelQuery,
  signal?: AbortSignal,
): Promise<Paginated<FeedbackChannelAdminItem>> {
  return unwrapPaginated(apiClient.get('/admin/feedback/channels', { params: query, signal }));
}

export function fetchFeedbackChannel(id: string, signal?: AbortSignal): Promise<FeedbackChannelAdminItem> {
  return unwrap(apiClient.get(`/admin/feedback/channels/${id}`, { signal }));
}

export function createFeedbackChannel(payload: FeedbackChannelPayload): Promise<FeedbackChannelAdminItem> {
  return unwrap(apiClient.post('/admin/feedback/channels', payload));
}

export function updateFeedbackChannel(
  id: string,
  payload: FeedbackChannelPayload & { version: number },
): Promise<FeedbackChannelAdminItem> {
  return unwrap(apiClient.put(`/admin/feedback/channels/${id}`, payload));
}

export async function deleteFeedbackChannel(id: string): Promise<void> {
  await apiClient.delete(`/admin/feedback/channels/${id}`);
}

export function updateFeedbackChannelStatus(
  id: string,
  isActive: boolean,
  version: number,
): Promise<FeedbackChannelAdminItem> {
  return unwrap(apiClient.patch(`/admin/feedback/channels/${id}/status`, { isActive, version }));
}

export function reorderFeedbackChannels(
  items: Array<{ id: string; sortOrder: number }>,
): Promise<FeedbackChannelAdminItem[]> {
  return unwrap(apiClient.patch('/admin/feedback/channels/reorder', { items }));
}
