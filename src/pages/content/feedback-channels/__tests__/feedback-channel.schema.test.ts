import { describe, expect, it } from 'vitest';
import type { FeedbackChannelAdminItem } from '../../../../types/feedback-channel';
import { feedbackChannelFormSchema, feedbackChannelFormToPayload, feedbackChannelToForm } from '../feedback-channel.schema';

const item: FeedbackChannelAdminItem = {
  id: 'gop-y-chung',
  version: 2,
  title: 'Góp ý chung cho địa phương',
  category: 'Góp ý chung',
  responseTime: 'Tiếp nhận trong giờ hành chính',
  requiredInfo: ['Họ tên', 'Số điện thoại'],
  summary: 'Tóm tắt',
  description: ['Đoạn thứ nhất'],
  examples: ['Ví dụ 1'],
  note: 'Lưu ý',
  mediaId: 'media-1',
  imageUrl: 'https://example.test/channel.webp',
  imageAlt: 'Góp ý chung',
  sortOrder: 0,
  isActive: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
};

describe('feedback channel form schema and mapper', () => {
  it('maps API list fields into the form and back with trimmed values', () => {
    const form = feedbackChannelToForm(item);
    const payload = feedbackChannelFormToPayload({
      ...form,
      title: `  ${form.title}  `,
      descriptions: [{ text: '  Nội dung mới  ' }],
      requiredInfoItems: [{ text: '  Họ tên  ' }],
    });

    expect(payload.title).toBe('Góp ý chung cho địa phương');
    expect(payload.description).toEqual(['Nội dung mới']);
    expect(payload.requiredInfo).toEqual(['Họ tên']);
  });

  it('requires an image, at least one description, and at least one required-info item', () => {
    const form = feedbackChannelToForm(item);
    const result = feedbackChannelFormSchema.safeParse({
      ...form,
      mediaId: null,
      imageUrl: null,
      descriptions: [{ text: '   ' }],
      requiredInfoItems: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['imageUrl', 'descriptions.0.text', 'requiredInfoItems']),
      );
    }
  });

  it('allows an empty examples list but rejects more than 20 items', () => {
    const form = feedbackChannelToForm(item);
    const emptyExamples = feedbackChannelFormSchema.safeParse({ ...form, exampleItems: [] });
    expect(emptyExamples.success).toBe(true);

    const tooMany = feedbackChannelFormSchema.safeParse({
      ...form,
      exampleItems: Array.from({ length: 21 }, (_, index) => ({ text: `Ví dụ ${index}` })),
    });
    expect(tooMany.success).toBe(false);
  });
});
