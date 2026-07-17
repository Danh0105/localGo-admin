export const CRAFT_VILLAGE_CATEGORIES = [
  'Thủ công truyền thống',
  'Chế biến nông sản',
  'Dịch vụ trải nghiệm',
  'Sản phẩm gia đình',
] as const;

export type CraftVillageCategory = (typeof CRAFT_VILLAGE_CATEGORIES)[number];

export interface CraftVillageAdminItem {
  id: string;
  version: number;
  name: string;
  category: CraftVillageCategory;
  address: string;
  workingTime: string;
  mainProducts: string;
  summary: string;
  description: string[];
  highlights: string[];
  visitorNote: string;
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface CraftVillageQuery {
  page: number;
  limit: number;
  category?: CraftVillageCategory;
  search?: string;
}

export interface CraftVillagePayload {
  name: string;
  category: CraftVillageCategory;
  address: string;
  workingTime: string;
  mainProducts: string;
  summary: string;
  description: string[];
  highlights: string[];
  visitorNote: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
