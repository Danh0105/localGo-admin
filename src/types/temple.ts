export type TempleType = 'Đình' | 'Chùa' | 'Miếu';

export interface TempleEvent {
  id: string;
  time: string;
  name: string;
}

export interface TempleAdminItem {
  id: string;
  version: number;
  name: string;
  type: TempleType;
  address: string;
  openHours: string;
  summary: string;
  description: string[];
  events: TempleEvent[];
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

export interface TempleQuery {
  page: number;
  limit: number;
  type?: TempleType;
  search?: string;
}

export interface TemplePayload {
  name: string;
  type: TempleType;
  address: string;
  openHours: string;
  summary: string;
  description: string[];
  events: Array<{ id?: string; time: string; name: string }>;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}

