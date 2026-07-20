export interface TradePostCategoryAdminItem {
  id: string;
  code: string;
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
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  requiresPromotionDetails: boolean;
  isActive: boolean;
}
