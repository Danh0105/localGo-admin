export const CONTACT_CATEGORIES = ['Hành chính', 'Khẩn cấp', 'Du lịch', 'Nông nghiệp', 'Phản ánh'] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface ContactAdminItem {
  id: string;
  version: number;
  name: string;
  category: ContactCategory;
  role: string;
  phone: string;
  email?: string | null;
  address: string;
  workingTime: string;
  summary: string;
  description: string[];
  supportTopics: string[];
  note: string;
  mediaId?: string | null;
  imageUrl?: string | null;
  imageAlt: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface ContactQuery {
  page: number;
  limit: number;
  category?: ContactCategory;
  search?: string;
}

export interface ContactPayload {
  name: string;
  category: ContactCategory;
  role: string;
  phone: string;
  email?: string;
  address: string;
  workingTime: string;
  summary: string;
  description: string[];
  supportTopics: string[];
  note: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
