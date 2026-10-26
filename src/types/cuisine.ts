
export const CUISINE_CATEGORIES = [
  'Món nước',
  'Món nướng',
  'Món cuốn',
  'Ăn vặt',
  'Món chay',
] as const;

export type CuisineCategory =
  (typeof CUISINE_CATEGORIES)[number];

export interface CuisineSuggestedPlace {
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
}

export interface CuisineMenuItem {
  id: string;
  name: string;
  price: string;
  description: string;
}

export interface CuisineReview {
  id: string;
  reviewerName: string;
  rating: number;
  feedback: string;
  adminResponse: string;
}

export interface CuisineGalleryImage {
  mediaId: string;
  imageUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
}

export interface CuisineAdminItem {
  id: string;
  version: number;
  name: string;
  category: CuisineCategory;
  priceRange: string;
  bestTime: string;
  googleMapsUrl?: string;

  suggestedPlaceDetails?:
  CuisineSuggestedPlace[] | null;

  /** @deprecated Legacy field */
  suggestedPlaces?: string[] | null;

  summary: string;
  description: string[];
  highlights: string[];
  tip: string;

  contactPhone: string;
  menu: CuisineMenuItem[];
  reviews: CuisineReview[];

  /** Calculated by backend */
  averageRating: number;
  reviewCount: number;

  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;

  galleryMediaIds: string[];
  galleryImages: CuisineGalleryImage[];

  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
  createdAt?: string;
}

export interface CuisinePublicListItem {
  id: string;
  name: string;
  category: CuisineCategory;
  priceRange: string;
  bestTime: string;
  summary: string;

  imageUrl: string | null;
  imageAlt: string;

  averageRating: number;
  reviewCount: number;

  /** @deprecated */
  suggestedPlaces: string[];

  suggestedPlaceDetails?: CuisineSuggestedPlace[];
  googleMapsUrl?: string;
  sortOrder?: number;
}

export interface CuisinePublicDetailItem
  extends CuisinePublicListItem {
  description: string[];
  highlights: string[];
  tip: string;

  suggestedPlaceDetails: CuisineSuggestedPlace[];

  contactPhone: string;
  menu: CuisineMenuItem[];
  reviews: CuisineReview[];
  galleryImages: CuisineGalleryImage[];
}

export interface CuisineQuery {
  page: number;
  limit: number;
  category?: CuisineCategory;
  search?: string;
}

export interface CuisinePayload {
  /** Optional slug when creating */
  id?: string;

  name: string;
  category: CuisineCategory;
  priceRange: string;
  bestTime: string;
  googleMapsUrl?: string;

  suggestedPlaceDetails: CuisineSuggestedPlace[];

  /** @deprecated Ignored if details exist */
  suggestedPlaces?: string[];

  summary: string;
  description: string[];
  highlights: string[];
  tip: string;

  contactPhone: string;
  menu: CuisineMenuItem[];
  reviews: CuisineReview[];

  mediaId?: string | null;
  galleryMediaIds: string[];
  imageAlt: string;

  sortOrder?: number;
  isActive?: boolean;
}

export type CuisineCreatePayload = CuisinePayload;

export type CuisineUpdatePayload =
  CuisinePayload & {
    version: number;
  };

export interface CuisineStatusPayload {
  version: number;
  isActive: boolean;
}

export type CuisineCalculatedFields =
  | 'averageRating'
  | 'reviewCount';
