
export type SpecialtyCategory =
  | 'Món ăn'
  | 'Trái cây'
  | 'Quà mang về';

export interface SpecialtyBuyPlace {
  id: string;
  name: string;
  address: string;
  googleMapsUrl: string;
  phone: string;
  email: string;
}

export interface SpecialtyAdminItem {
  id: string;
  version: number;
  name: string;
  category: SpecialtyCategory;
  price: string;
  season: string;
  googleMapsUrl?: string;
  summary: string;
  description: string[];
  buyPlaces: SpecialtyBuyPlace[];
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface SpecialtyQuery {
  page: number;
  limit: number;
  category?: SpecialtyCategory;
  search?: string;
  includeDeleted?: boolean;
}

export interface SpecialtyPayload {
  name: string;
  category: SpecialtyCategory;
  price: string;
  season: string;
  googleMapsUrl?: string;
  summary: string;
  description: string[];
  buyPlaces: SpecialtyBuyPlace[];
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
