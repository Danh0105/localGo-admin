export type SpecialtyCategory = 'Món ăn' | 'Trái cây' | 'Quà mang về';

export interface SpecialtyAdminItem {
  id: string;
  version: number;
  name: string;
  category: SpecialtyCategory;
  price: string;
  season: string;
  summary: string;
  description: string[];
  buyPlaces: string[];
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface SpecialtyQuery {
  page: number;
  limit: number;
  category?: SpecialtyCategory;
  search?: string;
}

export interface SpecialtyPayload {
  name: string;
  category: SpecialtyCategory;
  price: string;
  season: string;
  summary: string;
  description: string[];
  buyPlaces: string[];
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
