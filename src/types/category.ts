/** Mirrors CATEGORY_DOMAINS in the backend (src/modules/categories/categories.constants.ts). */
export const CATEGORY_DOMAINS = [
  'AGRICULTURE',
  'ATTRACTION',
  'TEMPLE',
  'HISTORICAL_SITE',
  'SPECIALTY',
  'CUISINE',
  'CRAFT_VILLAGE',
  'FESTIVAL',
  'EXPERIENCE_TOUR',
  'OCOP',
  'MAP_PLACE',
  'NEWS',
  'CONTACT',
  'TRADE_POST',
] as const;

export type CategoryDomain = (typeof CATEGORY_DOMAINS)[number];

export const CATEGORY_DOMAIN_LABEL: Record<CategoryDomain, string> = {
  AGRICULTURE: 'Nông nghiệp',
  ATTRACTION: 'Điểm tham quan',
  TEMPLE: 'Đền, chùa, miếu',
  HISTORICAL_SITE: 'Di tích lịch sử',
  SPECIALTY: 'Đặc sản',
  CUISINE: 'Ẩm thực',
  CRAFT_VILLAGE: 'Làng nghề',
  FESTIVAL: 'Lễ hội',
  EXPERIENCE_TOUR: 'Tour trải nghiệm',
  OCOP: 'Sản phẩm OCOP',
  MAP_PLACE: 'Bản đồ địa phương',
  NEWS: 'Tin tức',
  CONTACT: 'Liên hệ',
  TRADE_POST: 'Tin giao thương',
};

export interface Category {
  id: string;
  domain: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryInput {
  domain: CategoryDomain;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput> & {
  isActive?: boolean;
};
