import type { Paginated } from '../types/api';
import type {
  FeedbackTicketDetail,
  FeedbackTicketListItem,
  FeedbackTicketQuery,
  FeedbackTicketStatusPayload,
} from '../types/feedback-ticket';
import { apiClient, unwrap, unwrapPaginated } from './client';

export function fetchFeedbackTickets(
  query: FeedbackTicketQuery,
  signal?: AbortSignal,
): Promise<Paginated<FeedbackTicketListItem>> {
  return unwrapPaginated(apiClient.get('/admin/feedback/tickets', { params: query, signal }));
}

export function fetchFeedbackTicket(id: string, signal?: AbortSignal): Promise<FeedbackTicketDetail> {
  return unwrap(apiClient.get(`/admin/feedback/tickets/${id}`, { signal }));
}

export function updateFeedbackTicketStatus(
  id: string,
  payload: FeedbackTicketStatusPayload,
): Promise<FeedbackTicketDetail> {
  return unwrap(apiClient.patch(`/admin/feedback/tickets/${id}/status`, payload));
}
