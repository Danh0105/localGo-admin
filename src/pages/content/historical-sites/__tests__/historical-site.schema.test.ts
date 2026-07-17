import { describe, expect, it } from 'vitest';
import type { HistoricalSiteAdminItem } from '../../../../types/historical-site';
import {
  historicalSiteFormSchema,
  historicalSiteFormToPayload,
  historicalSiteToForm,
} from '../historical-site.schema';

const item: HistoricalSiteAdminItem = {
  id: 'dia-dao-truong-mit',
  version: 2,
  name: 'Địa đạo Truông Mít',
  rank: 'Cấp tỉnh',
  address: 'Ấp Thuận Bình',
  recognizedYear: 2014,
  summary: 'Tóm tắt',
  history: ['Đoạn lịch sử'],
  highlights: ['Điểm nổi bật'],
  mediaId: 'media-1',
  imageUrl: 'https://example.test/site.webp',
  imageAlt: 'Địa đạo Truông Mít',
  sortOrder: 0,
  isActive: true,
  updatedAt: '2026-07-15T00:00:00.000Z',
};

describe('historical site schema and mapper', () => {
  it('maps dynamic arrays and trims payload without changing their current order', () => {
    const form = historicalSiteToForm(item);
    const payload = historicalSiteFormToPayload({
      ...form,
      name: `  ${form.name}  `,
      historyItems: [{ text: '  Đoạn thứ hai  ' }, { text: 'Đoạn thứ nhất' }],
      highlightItems: [{ text: '  Hầm phục dựng  ' }],
    });

    expect(payload.name).toBe('Địa đạo Truông Mít');
    expect(payload.history).toEqual(['Đoạn thứ hai', 'Đoạn thứ nhất']);
    expect(payload.highlights).toEqual(['Hầm phục dựng']);
  });

  it('requires image and at least one non-empty history paragraph', () => {
    const result = historicalSiteFormSchema.safeParse({
      ...historicalSiteToForm(item),
      mediaId: null,
      imageUrl: null,
      historyItems: [{ text: '   ' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['imageUrl', 'historyItems.0.text']),
      );
    }
  });

  it('rejects a recognized year in the future without losing other form values', () => {
    const form = { ...historicalSiteToForm(item), name: 'Tên đang nhập', recognizedYear: new Date().getFullYear() + 1 };
    const result = historicalSiteFormSchema.safeParse(form);
    expect(result.success).toBe(false);
    expect(form.name).toBe('Tên đang nhập');
  });

  it('allows an omitted recognized year and omits it from payload', () => {
    const form = { ...historicalSiteToForm(item), rank: 'Chưa xếp hạng' as const, recognizedYear: null };
    expect(historicalSiteFormSchema.safeParse(form).success).toBe(true);
    expect(historicalSiteFormToPayload(form)).not.toHaveProperty('recognizedYear');
  });

  it('rejects more than 20 history paragraphs or highlights', () => {
    const form = historicalSiteToForm(item);
    expect(
      historicalSiteFormSchema.safeParse({
        ...form,
        historyItems: Array.from({ length: 21 }, (_, index) => ({ text: `Đoạn ${index}` })),
      }).success,
    ).toBe(false);
    expect(
      historicalSiteFormSchema.safeParse({
        ...form,
        highlightItems: Array.from({ length: 21 }, (_, index) => ({ text: `Điểm ${index}` })),
      }).success,
    ).toBe(false);
  });
});

