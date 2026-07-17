import { describe, expect, it } from 'vitest';
import type { OcopAdminProduct } from '../../../../types/ocop';
import { EMPTY_OCOP_FORM, formToOcopPayload, ocopFormSchema, ocopToForm } from '../ocop.schema';

export const ocopItem: OcopAdminProduct = {
  id: 'coffee', version: 2, name: 'Cà phê OCOP', category: 'Đồ uống', rating: 4,
  producer: 'Hợp tác xã LocalGo', address: 'Lâm Đồng', priceRange: '100.000đ - 200.000đ',
  contactPhone: '0900 123 456',
  summary: 'Cà phê rang xay', description: ['Đoạn giới thiệu'], highlights: ['Canh tác bền vững'],
  contactNote: 'Liên hệ hợp tác xã', mediaId: 'media-1', imageUrl: 'https://cdn/coffee.webp',
  imageAlt: 'Hạt cà phê', sortOrder: 0, isActive: true, updatedAt: '2026-07-15T00:00:00.000Z', updatedBy: null,
};

describe('OCOP schema and mapper', () => {
  it('maps array fields and trims the API payload', () => {
    const payload = formToOcopPayload({ ...ocopToForm(ocopItem), name: '  Cà phê mới  ', descriptions: [{ text: '  Dòng 1\nDòng 2  ' }] });
    expect(payload.name).toBe('Cà phê mới');
    expect(payload.description).toEqual(['Dòng 1\nDòng 2']);
    expect(payload.rating).toBe(4);
    expect(payload.contactPhone).toBe('0900 123 456');
  });

  it('validates the contact phone format and length', () => {
    const form = ocopToForm(ocopItem);
    for (const contactPhone of ['0900 123 456', '+84 900 123 456']) {
      expect(ocopFormSchema.safeParse({ ...form, contactPhone }).success).toBe(true);
    }
    for (const contactPhone of ['', '   ', '+ ( ) -', 'abc0900', '0'.repeat(31)]) {
      expect(ocopFormSchema.safeParse({ ...form, contactPhone }).success).toBe(false);
    }
  });

  it('initializes, maps legacy responses, and trims contactPhone independently', () => {
    expect(EMPTY_OCOP_FORM.contactPhone).toBe('');
    expect(ocopToForm(ocopItem).contactPhone).toBe('0900 123 456');
    expect(ocopToForm({ ...ocopItem, contactPhone: null } as unknown as OcopAdminProduct).contactPhone).toBe('');
    expect(ocopToForm({ ...ocopItem, contactPhone: undefined } as unknown as OcopAdminProduct).contactPhone).toBe('');
    expect(formToOcopPayload({ ...ocopToForm(ocopItem), contactPhone: '  +84 900 123 456  ' }).contactPhone).toBe('+84 900 123 456');
  });

  it('accepts only official OCOP ranks 3, 4 and 5', () => {
    const form = ocopToForm(ocopItem);
    expect(ocopFormSchema.safeParse({ ...form, rating: 3 }).success).toBe(true);
    expect(ocopFormSchema.safeParse({ ...form, rating: 5 }).success).toBe(true);
    expect(ocopFormSchema.safeParse({ ...form, rating: 2 }).success).toBe(false);
    expect(ocopFormSchema.safeParse({ ...form, rating: 6 }).success).toBe(false);
  });

  it('requires core fields, an image and at least one non-empty paragraph', () => {
    const result = ocopFormSchema.safeParse({ ...ocopToForm(ocopItem), name: '', producer: '', address: '', priceRange: '', contactPhone: '', summary: '', mediaId: null, imageUrl: null, descriptions: [{ text: ' ' }] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(expect.arrayContaining(['name','producer','address','priceRange','contactPhone','summary','imageUrl','descriptions.0.text']));
  });

  it('limits descriptions and highlights to 20 items', () => {
    const form = ocopToForm(ocopItem);
    expect(ocopFormSchema.safeParse({ ...form, descriptions: Array.from({ length: 21 }, () => ({ text: 'Đoạn' })) }).success).toBe(false);
    expect(ocopFormSchema.safeParse({ ...form, highlights: Array.from({ length: 21 }, () => ({ text: 'Điểm' })) }).success).toBe(false);
  });
});
