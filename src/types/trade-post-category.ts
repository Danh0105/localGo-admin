export interface TradePostCategoryAdminItem {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  requiresPromotionDetails: boolean;
  isActive: boolean;
  version: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TradePostCategoryAdminQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateTradePostCategoryInput {
  name: string;
  description?: string | null;
  sortOrder: number;
  requiresPromotionDetails: boolean;
  isActive: boolean;
}

export interface UpdateTradePostCategoryInput {
  name: string;
  description: string | null;
  sortOrder: number;
  requiresPromotionDetails: boolean;
  version: number;
}

export interface TradePostCategoryStatusInput {
  isActive: boolean;
  version: number;
}

export interface TradePostCategoryReorderItem {
  id: string;
  sortOrder: number;
  version: number;
}

export interface ReorderTradePostCategoriesInput {
  items: TradePostCategoryReorderItem[];
}
