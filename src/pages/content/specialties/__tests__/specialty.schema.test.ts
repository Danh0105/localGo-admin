import { describe, expect, it } from 'vitest';
import type { SpecialtyAdminItem } from '../../../../types/specialty';
import { formToPayload, specialtyFormSchema, specialtyToForm } from '../specialty.schema';

const item: SpecialtyAdminItem = {
  id: 'nem-nuong-ninh-hoa',
  version: 2,
  name: 'Nem nướng Ninh Hòa',
  category: 'Món ăn',
  price: '80.000đ/phần',
  season: 'Quanh năm',
  summary: 'Tóm tắt',
  description: ['Đoạn thứ nhất'],
  buyPlaces: ['Chợ Đầm, Nha Trang'],
  mediaId: 'media-1',
  imageUrl: 'https://example.test/nem.webp',
  imageAlt: 'Nem nướng Ninh Hòa',
  sortOrder: 0,
  isActive: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
};

describe('specialty form schema and mapper', () => {
  it('maps API description/buyPlaces lists into the form and back, trimming on submit', () => {
    const form = specialtyToForm(item);
    const payload = formToPayload({
      ...form,
      name: `  ${form.name}  `,
      descriptions: [{ text: '  Nội dung mới  ' }],
      buyPlaces: [{ text: '  Siêu thị Co.op  ' }],
    });

    expect(form.buyPlaces).toEqual([{ text: 'Chợ Đầm, Nha Trang' }]);
    expect(payload.name).toBe('Nem nướng Ninh Hòa');
    expect(payload.description).toEqual(['Nội dung mới']);
    expect(payload.buyPlaces).toEqual(['Siêu thị Co.op']);
  });

  it('requires an image and at least one non-empty description', () => {
    const form = specialtyToForm(item);
    const result = specialtyFormSchema.safeParse({
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

  it('requires name, category, price, season and summary', () => {
    const result = specialtyFormSchema.safeParse({
      ...specialtyToForm(item),
      name: '',
      price: '',
      season: '',
      summary: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['name', 'price', 'season', 'summary']));
    }
  });

  it('rejects more than 20 descriptions and more than 20 buy places', () => {
    const form = specialtyToForm(item);
    const tooManyDescriptions = specialtyFormSchema.safeParse({
      ...form,
      descriptions: Array.from({ length: 21 }, (_, index) => ({ text: `Đoạn ${index}` })),
    });
    const tooManyBuyPlaces = specialtyFormSchema.safeParse({
      ...form,
      buyPlaces: Array.from({ length: 21 }, (_, index) => ({ text: `Địa điểm ${index}` })),
    });

    expect(tooManyDescriptions.success).toBe(false);
    expect(tooManyBuyPlaces.success).toBe(false);
  });

  it('accepts an empty buyPlaces list (not required)', () => {
    const result = specialtyFormSchema.safeParse({ ...specialtyToForm(item), buyPlaces: [] });
    expect(result.success).toBe(true);
  });
});
