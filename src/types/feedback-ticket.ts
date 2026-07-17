export type FeedbackTicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export const FEEDBACK_TICKET_STATUSES: FeedbackTicketStatus[] = ['new', 'in_progress', 'resolved', 'closed'];

export const FEEDBACK_TICKET_STATUS_LABEL: Record<FeedbackTicketStatus, string> = {
  new: 'Mới',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng',
};

export const FEEDBACK_TICKET_STATUS_COLOR: Record<FeedbackTicketStatus, string> = {
  new: 'blue',
  in_progress: 'gold',
  resolved: 'green',
  closed: 'default',
};

/** Valid forward transitions; a status can also be "kept" (no-op) but never move backward. */
export const FEEDBACK_TICKET_STATUS_TRANSITIONS: Record<FeedbackTicketStatus, FeedbackTicketStatus[]> = {
  new: ['new', 'in_progress'],
  in_progress: ['in_progress', 'resolved', 'closed'],
  resolved: ['resolved', 'closed'],
  closed: ['closed'],
};

export interface FeedbackTicketListItem {
  id: string;
  ticketCode: string;
  fullName: string;
  phoneMasked: string;
  channelId: string | null;
  channelTitle: string | null;
  contentSummary: string;
  submittedAt: string;
  status: FeedbackTicketStatus;
}

export interface FeedbackTicketDetail {
  id: string;
  ticketCode: string;
  fullName: string;
  phone: string;
  channelId: string | null;
  channelTitle: string | null;
  content: string;
  submittedAt: string;
  status: FeedbackTicketStatus;
  adminNote: string | null;
  lastHandledBy: string | null;
  lastHandledAt: string | null;
}

export interface FeedbackTicketQuery {
  page: number;
  limit: number;
  status?: FeedbackTicketStatus;
  channelId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  search?: string;
}

export interface FeedbackTicketStatusPayload {
  status: FeedbackTicketStatus;
  adminNote?: string;
}
