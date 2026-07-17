import { describe, expect, it } from 'vitest';
import { EMPTY_NEWS_FORM, newsFormSchema, newsFormToPayload } from '../news.schema';

describe('newsFormSchema', () => {
  it('blocks save when content is missing', () => {
    const result = newsFormSchema.safeParse({
      ...EMPTY_NEWS_FORM,
      title: 'Thông báo',
      author: 'UBND xã',
      summary: 'Tóm tắt',
      mediaId: 'media-1',
      contentItems: [],
    });

    expect(result.success).toBe(false);
  });

  it('trims payload fields and keeps publishedAt as ISO datetime', () => {
    const payload = newsFormToPayload({
      ...EMPTY_NEWS_FORM,
      title: '  Thông báo  ',
      publishedAt: '2026-01-01T08:00:00.000Z',
      author: ' UBND xã ',
      summary: ' Tóm tắt ',
      contentItems: [{ text: ' Nội dung 1 ' }],
      tagItems: [{ text: ' tag ' }],
      relatedItems: [{ text: ' liên quan ' }],
      mediaId: 'media-1',
    });

    expect(payload).toEqual(expect.objectContaining({
      title: 'Thông báo',
      publishedAt: '2026-01-01T08:00:00.000Z',
      author: 'UBND xã',
      content: ['Nội dung 1'],
      tags: ['tag'],
      relatedLinks: ['liên quan'],
    }));
  });
});
