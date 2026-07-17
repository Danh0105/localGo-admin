export const EXPERIENCE_TOUR_CATEGORIES = ['Nửa ngày', 'Một ngày', 'Gia đình', 'Học sinh', 'Nông nghiệp'] as const;

export type ExperienceTourCategory = (typeof EXPERIENCE_TOUR_CATEGORIES)[number];

export interface ExperienceTourAdminItem {
  id: string;
  version: number;
  name: string;
  category: ExperienceTourCategory;
  duration: string;
  startTime: string;
  priceRange: string;
  meetingPoint: string;
  contactPhone: string;
  summary: string;
  description: string[];
  itinerary: string[];
  included: string[];
  note: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface ExperienceTourQuery {
  page: number;
  limit: number;
  category?: ExperienceTourCategory;
  search?: string;
}

export interface ExperienceTourPayload {
  name: string;
  category: ExperienceTourCategory;
  duration: string;
  startTime: string;
  priceRange: string;
  meetingPoint: string;
  contactPhone: string;
  summary: string;
  description: string[];
  itinerary: string[];
  included: string[];
  note: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
