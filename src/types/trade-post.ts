export type TradePostCategory = 'PRODUCT' | 'SERVICE' | 'BUY_REQUEST' | 'PROMOTION';
export type TradePostPriceType = 'FIXED' | 'NEGOTIABLE' | 'CONTACT';
export type TradePostStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PUBLISHED'
  | 'HIDDEN'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ARCHIVED';

export interface TradePostImageView {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  sortOrder: number;
}

export interface TradePostOwnerView {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'BUSINESS';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
}

export interface TradePost {
  id: string;
  slug: string;
  ownerId: string;
  owner?: TradePostOwnerView;
  category: TradePostCategory;
  title: string;
  summary: string;
  description: string;
  priceType: TradePostPriceType;
  price: string | null;
  priceLabel: string | null;
  address: string;
  lat: string | null;
  lng: string | null;
  contactName: string;
  contactPhone: string;
  contactZalo: string | null;
  thumbnailUrl: string | null;
  status: TradePostStatus;
  featured: boolean;
  promotionPercent: number | null;
  promotionStartAt: string | null;
  promotionEndAt: string | null;
  expiresAt: string | null;
  viewCount: number;
  averageRating: string;
  reviewCount: number;
  publishedAt: string | null;
  rejectedReason: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images?: TradePostImageView[];
}

export interface TradePostAdminQuery {
  page?: number;
  limit?: number;
  status?: TradePostStatus;
  category?: TradePostCategory;
  search?: string;
  ownerId?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
}

export const TRADE_POST_STATUS_LABEL: Record<TradePostStatus, string> = {
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ duyệt',
  PUBLISHED: 'Đã xuất bản',
  HIDDEN: 'Đã ẩn',
  REJECTED: 'Bị từ chối',
  EXPIRED: 'Hết hạn',
  ARCHIVED: 'Đã lưu trữ',
};

export const TRADE_POST_STATUS_COLOR: Record<TradePostStatus, string> = {
  DRAFT: 'default',
  PENDING: 'gold',
  PUBLISHED: 'green',
  HIDDEN: 'orange',
  REJECTED: 'red',
  EXPIRED: 'default',
  ARCHIVED: 'default',
};

export const TRADE_POST_CATEGORY_LABEL: Record<TradePostCategory, string> = {
  PRODUCT: 'Sản phẩm',
  SERVICE: 'Dịch vụ',
  BUY_REQUEST: 'Cần mua',
  PROMOTION: 'Khuyến mãi',
};
