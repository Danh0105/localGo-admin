import { describe, expect, it } from 'vitest';
import type { AboutAdminState } from '../../types/about';
import { normalizeAboutAdminState } from '../about';

describe('normalizeAboutAdminState', () => {
  it('flattens the backend draft envelope before the form mapper reads hero', () => {
    const state: AboutAdminState = {
      draft: {
        title: 'Giới thiệu',
        hero: { mediaId: 'media-1', imageAlt: 'Ảnh hero' },
        overview: { title: 'Tổng quan', paragraphs: ['Đoạn 1'] },
        statistics: [],
        highlightsSectionTitle: 'Điểm nổi bật',
        highlights: [],
        milestonesSectionTitle: 'Dấu mốc',
        milestones: [],
      },
      version: 4,
      publishedVersion: 3,
      publishedAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T01:00:00.000Z',
      hasUnpublishedChanges: true,
    };

    const draft = normalizeAboutAdminState(state);

    expect(draft.hero.mediaId).toBe('media-1');
    expect(draft.version).toBe(4);
    expect(draft.hasUnpublishedChanges).toBe(true);
    expect(draft).not.toHaveProperty('draft');
  });

  it('normalizes null publishedAt to undefined for the UI model', () => {
    const state = {
      draft: {
        title: 'Giới thiệu',
        hero: { imageAlt: '' },
        overview: { title: 'Tổng quan', paragraphs: [] },
        statistics: [],
        highlightsSectionTitle: 'Điểm nổi bật',
        highlights: [],
        milestonesSectionTitle: 'Dấu mốc',
        milestones: [],
      },
      version: 1,
      publishedVersion: 0,
      publishedAt: null,
      updatedAt: '2026-07-15T01:00:00.000Z',
      hasUnpublishedChanges: true,
    } satisfies AboutAdminState;

    expect(normalizeAboutAdminState(state).publishedAt).toBeUndefined();
  });
});

