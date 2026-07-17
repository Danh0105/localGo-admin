export const CUISINE_CATEGORIES = ['Món nước', 'Món nướng', 'Món cuốn', 'Ăn vặt', 'Món chay'] as const;

export type CuisineCategory = (typeof CUISINE_CATEGORIES)[number];

export interface CuisineSuggestedPlace {
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
}

export interface CuisineAdminItem {
  id: string;
  version: number;
  name: string;
  category: CuisineCategory;
  priceRange: string;
  bestTime: string;
  suggestedPlaceDetails?: CuisineSuggestedPlace[] | null;
  /** Legacy field kept only while backend records are being migrated. */
  suggestedPlaces?: string[] | null;
  summary: string;
  description: string[];
  highlights: string[];
  tip: string;
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface CuisineQuery {
  page: number;
  limit: number;
  category?: CuisineCategory;
  search?: string;
}

export interface CuisinePayload {
  name: string;
  category: CuisineCategory;
  priceRange: string;
  bestTime: string;
  suggestedPlaceDetails: CuisineSuggestedPlace[];
  summary: string;
  description: string[];
  highlights: string[];
  tip: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
