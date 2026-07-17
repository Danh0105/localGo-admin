export const OCOP_CATEGORIES = [
  'Thực phẩm',
  'Đồ uống',
  'Nông sản tươi',
  'Sản phẩm chế biến',
] as const;

export type OcopCategory = (typeof OCOP_CATEGORIES)[number];
export type OcopRating = 3 | 4 | 5;

export interface OcopAdminProduct {
  id: string;
  version: number;
  name: string;
  category: OcopCategory;
  rating: OcopRating;
  producer: string;
  address: string;
  priceRange: string;
  contactPhone: string;
  summary: string;
  description: string[];
  highlights: string[];
  contactNote: string;
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface OcopQuery {
  page: number;
  limit: number;
  category?: OcopCategory;
  rating?: OcopRating;
  search?: string;
}

export interface OcopPayload {
  name: string;
  category: OcopCategory;
  rating: OcopRating;
  producer: string;
  address: string;
  priceRange: string;
  contactPhone: string;
  summary: string;
  description: string[];
  highlights: string[];
  contactNote: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
