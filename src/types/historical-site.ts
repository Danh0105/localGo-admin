export type HistoricalSiteRank = 'Cấp quốc gia' | 'Cấp tỉnh' | 'Chưa xếp hạng';

export interface HistoricalSiteAdminItem {
  id: string;
  version: number;
  name: string;
  rank: HistoricalSiteRank;
  address: string;
  recognizedYear?: number | null;
  summary: string;
  history: string[];
  highlights: string[];
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface HistoricalSiteQuery {
  page: number;
  limit: number;
  rank?: HistoricalSiteRank;
  search?: string;
}

export interface HistoricalSitePayload {
  name: string;
  rank: HistoricalSiteRank;
  address: string;
  recognizedYear?: number;
  summary: string;
  history: string[];
  highlights: string[];
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}

