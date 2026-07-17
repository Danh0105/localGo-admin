import { describe, expect, it } from 'vitest';
import type { AboutDraft } from '../../../../types/about';
import { draftToFormValues, formValuesToDraftPayload } from '../about.mapper';

function makeDraft(overrides: Partial<AboutDraft> = {}): AboutDraft {
  return {
    id: 'about',
    version: 3,
    title: 'Về LocalGo',
    hero: { mediaId: 'm1', imageUrl: 'https://cdn/hero.jpg', imageAlt: 'Hero alt' },
    overview: { title: 'Tổng quan', paragraphs: ['Đoạn 1', 'Đoạn 2'] },
    statistics: [
      { id: 's2', sortOrder: 1, isActive: true, value: '2', unit: 'K', label: 'B' },
      { id: 's1', sortOrder: 0, isActive: true, value: '1', unit: 'K', label: 'A' },
    ],
    highlightsSectionTitle: 'Điểm nổi bật',
    highlights: [],
    milestonesSectionTitle: 'Dấu mốc',
    milestones: [],
    hasUnpublishedChanges: false,
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('draftToFormValues', () => {
  it('sorts array sections by sortOrder and wraps paragraphs for useFieldArray', () => {
    const values = draftToFormValues(makeDraft());
    expect(values.statistics.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(values.overview.paragraphs).toEqual([{ text: 'Đoạn 1' }, { text: 'Đoạn 2' }]);
  });
});

describe('formValuesToDraftPayload', () => {
  it('normalizes sortOrder to 0..n-1 by current array order and unwraps paragraphs', () => {
    const values = draftToFormValues(
      makeDraft({
        statistics: [
          { id: 's1', sortOrder: 5, isActive: true, value: '1', unit: 'K', label: 'A' },
          { id: 's2', sortOrder: 9, isActive: true, value: '2', unit: 'K', label: 'B' },
        ],
      }),
    );

    const payload = formValuesToDraftPayload(values, 7);

    expect(payload.version).toBe(7);
    expect(payload.statistics.map((s) => s.sortOrder)).toEqual([0, 1]);
    expect(payload.overview.paragraphs).toEqual(['Đoạn 1', 'Đoạn 2']);
  });

  it('reflects reordering — moving the last item to the front renumbers sortOrder accordingly', () => {
    const values = draftToFormValues(makeDraft());
    const reordered = [...values.statistics].reverse();
    const payload = formValuesToDraftPayload({ ...values, statistics: reordered }, 1);

    expect(payload.statistics.map((s) => s.id)).toEqual(['s2', 's1']);
    expect(payload.statistics.map((s) => s.sortOrder)).toEqual([0, 1]);
  });
});
