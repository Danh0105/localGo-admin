export const AGRICULTURE_CATEGORIES = [
  'Cây trồng chủ lực',
  'Chăn nuôi',
  'Thủy lợi',
  'Mô hình sản xuất',
] as const;

export type AgricultureCategory = (typeof AGRICULTURE_CATEGORIES)[number];

export interface AgricultureAdminItem {
  id: string;
  version: number;
  name: string;
  category: AgricultureCategory;
  location: string;
  season: string;
  scale: string;
  summary: string;
  description: string[];
  highlights: string[];
  support: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface AgricultureQuery {
  page: number;
  limit: number;
  category?: AgricultureCategory;
  search?: string;
}

export interface AgriculturePayload {
  name: string;
  category: AgricultureCategory;
  location: string;
  season: string;
  scale: string;
  summary: string;
  description: string[];
  highlights: string[];
  support: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
