export const NEWS_CATEGORIES = ['Thông báo', 'Hoạt động xã', 'Du lịch', 'Nông nghiệp', 'Chuyển đổi số'] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export interface NewsAdminArticle {
  id: string;
  version: number;
  title: string;
  category: NewsCategory;
  publishedAt: string;
  author: string;
  summary: string;
  content: string[];
  tags: string[];
  relatedLinks: string[];
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface NewsQuery {
  page: number;
  limit: number;
  category?: NewsCategory;
  search?: string;
}

export interface NewsPayload {
  title: string;
  category: NewsCategory;
  publishedAt: string;
  author: string;
  summary: string;
  content: string[];
  tags: string[];
  relatedLinks: string[];
  mediaId?: string | null;
  imageAlt: string;
  isActive?: boolean;
}
