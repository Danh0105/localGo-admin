export type FeedbackCategory = 'Góp ý chung' | 'Phản ánh hạ tầng' | 'Dịch vụ công' | 'Du lịch' | 'Mini App';

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  'Góp ý chung',
  'Phản ánh hạ tầng',
  'Dịch vụ công',
  'Du lịch',
  'Mini App',
];

export interface FeedbackChannelAdminItem {
  id: string;
  version: number;
  title: string;
  category: FeedbackCategory;
  responseTime: string;
  requiredInfo: string[];
  summary: string;
  description: string[];
  examples: string[];
  note: string;
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

export interface FeedbackChannelQuery {
  page: number;
  limit: number;
  category?: FeedbackCategory;
  search?: string;
}

export interface FeedbackChannelPayload {
  title: string;
  category: FeedbackCategory;
  responseTime: string;
  requiredInfo: string[];
  summary: string;
  description: string[];
  examples: string[];
  note: string;
  mediaId?: string | null;
  imageAlt: string;
  sortOrder?: number;
  isActive?: boolean;
}
