import type { UserRole } from './user';

/** Only ADMIN may publish the About page; MODERATOR can view and save drafts. See docs decision log in AboutPage.tsx header comment. */
export const ABOUT_PUBLISHER_ROLES: UserRole[] = ['ADMIN'];

export const ABOUT_LIMITS = {
  title: 150,
  label: 120,
  value: 50,
  unit: 30,
  alt: 255,
  longText: 5000,
  maxStatistics: 20,
  maxHighlights: 50,
  maxMilestones: 100,
  maxParagraphs: 20,
} as const;

export interface AboutStatusItem {
  id: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AboutHero {
  mediaId?: string;
  imageUrl?: string;
  imageAlt: string;
}

export interface AboutOverview {
  title: string;
  paragraphs: string[];
}

export interface AboutStatistic extends AboutStatusItem {
  value: string;
  unit: string;
  label: string;
}

export interface AboutHighlight extends AboutStatusItem {
  title: string;
  description: string;
  mediaId?: string;
  imageUrl?: string;
  imageAlt: string;
}

export interface AboutMilestone extends AboutStatusItem {
  year: string;
  title?: string;
  description: string;
}

export interface AboutDraft {
  id: 'about';
  version: number;
  title: string;
  hero: AboutHero;
  overview: AboutOverview;
  statistics: AboutStatistic[];
  highlightsSectionTitle: string;
  highlights: AboutHighlight[];
  milestonesSectionTitle: string;
  milestones: AboutMilestone[];
  hasUnpublishedChanges: boolean;
  publishedAt?: string;
  publishedBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

/** Wire response của GET/PUT /admin/about và POST /admin/about/discard-draft. */
export interface AboutAdminState {
  draft: Pick<
    AboutDraft,
    | 'title'
    | 'hero'
    | 'overview'
    | 'statistics'
    | 'highlightsSectionTitle'
    | 'highlights'
    | 'milestonesSectionTitle'
    | 'milestones'
  >;
  version: number;
  publishedVersion: number;
  publishedAt: string | null;
  updatedAt: string;
  hasUnpublishedChanges: boolean;
}

/** Payload for PUT /admin/about — the editable fields plus the version being edited from. */
export type AboutDraftPayload = Pick<
  AboutDraft,
  | 'title'
  | 'hero'
  | 'overview'
  | 'statistics'
  | 'highlightsSectionTitle'
  | 'highlights'
  | 'milestonesSectionTitle'
  | 'milestones'
> & { version: number };

/** Resolved, publish-ready view used for the admin "Xem trước" mock — only active items, media already resolved to URLs. */
export interface AboutPreview {
  title: string;
  hero: { imageUrl?: string; imageAlt: string };
  overview: AboutOverview;
  statistics: Array<{ id: string; value: string; unit: string; label: string }>;
  highlightsSectionTitle: string;
  highlights: Array<{ id: string; title: string; description: string; imageUrl?: string; imageAlt: string }>;
  milestonesSectionTitle: string;
  milestones: Array<{ id: string; year: string; title?: string; description: string }>;
}
