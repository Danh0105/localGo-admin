export const MAP_PLACE_CATEGORIES = ['Hành chính', 'Du lịch', 'Di tích', 'Ẩm thực', 'Dịch vụ'] as const;

export type MapPlaceCategory = (typeof MAP_PLACE_CATEGORIES)[number];

export interface MapPlaceCoordinates {
  lat: number;
  lng: number;
}

export interface MapPlaceAdminItem {
  id: string;
  version: number;
  name: string;
  category: MapPlaceCategory;
  address: string;
  coordinates: MapPlaceCoordinates;
  openTime: string;
  distanceFromCenter: string;
  summary: string;
  description: string[];
  highlights: string[];
  directionNote: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface MapPlaceQuery {
  page: number;
  limit: number;
  category?: MapPlaceCategory;
  search?: string;
}

export interface MapPlacePayload {
  name: string;
  category: MapPlaceCategory;
  address: string;
  coordinates: MapPlaceCoordinates;
  openTime: string;
  distanceFromCenter: string;
  summary: string;
  description: string[];
  highlights: string[];
  directionNote: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
