import { describe, expect, it } from 'vitest';
import type { TempleAdminItem } from '../../../../types/temple';
import { formToPayload, templeFormSchema, templeToForm } from '../temple.schema';

const item: TempleAdminItem = {
  id: 'dinh-truong-mit',
  version: 2,
  name: 'Đình Truông Mít',
  type: 'Đình',
  address: 'Ấp Thuận Bình',
  openHours: '05:00 - 18:00',
  summary: 'Tóm tắt',
  description: ['Đoạn thứ nhất'],
  events: [{ id: 'event-1', time: '16/3 âm lịch', name: 'Lễ Kỳ Yên' }],
  mediaId: 'media-1',
  imageUrl: 'https://example.test/temple.webp',
  imageAlt: 'Đình Truông Mít',
  sortOrder: 0,
  isActive: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
};

describe('temple form schema and mapper', () => {
  it('maps API descriptions and stable event IDs into the form and back', () => {
    const form = templeToForm(item);
    const payload = formToPayload({
      ...form,
      name: `  ${form.name}  `,
      descriptions: [{ text: '  Nội dung mới  ' }],
    });

    expect(form.events[0].id).toBe('event-1');
    expect(payload.name).toBe('Đình Truông Mít');
    expect(payload.description).toEqual(['Nội dung mới']);
    expect(payload.events[0].id).toBe('event-1');
  });

  it('requires an image and at least one non-empty description', () => {
    const form = templeToForm(item);
    const result = templeFormSchema.safeParse({
      ...form,
      mediaId: null,
      imageUrl: null,
      descriptions: [{ text: '   ' }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining(['imageUrl', 'descriptions.0.text']),
      );
    }
  });

  it('rejects more than 30 events', () => {
    const form = templeToForm(item);
    const result = templeFormSchema.safeParse({
      ...form,
      events: Array.from({ length: 31 }, (_, index) => ({ time: `${index}`, name: `Sự kiện ${index}` })),
    });
    expect(result.success).toBe(false);
  });
});

