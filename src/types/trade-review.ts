export type TradeReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN';

export interface TradeReviewImageView {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  sortOrder: number;
}

export interface TradeReview {
  id: string;
  tradePostId: string;
  userId: string;
  rating: number;
  content: string;
  status: TradeReviewStatus;
  createdAt: string;
  updatedAt: string;
  images: TradeReviewImageView[];
}

export interface TradeReviewAdminQuery {
  page?: number;
  limit?: number;
  status?: TradeReviewStatus;
  tradePostId?: string;
}

export const TRADE_REVIEW_STATUS_LABEL: Record<TradeReviewStatus, string> = {
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã duyệt',
  HIDDEN: 'Đã ẩn',
};

export const TRADE_REVIEW_STATUS_COLOR: Record<TradeReviewStatus, string> = {
  PENDING: 'gold',
  PUBLISHED: 'green',
  HIDDEN: 'default',
};
