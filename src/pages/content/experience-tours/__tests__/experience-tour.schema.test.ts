import { describe, expect, it } from 'vitest';
import type { ExperienceTourAdminItem } from '../../../../types/experience-tour';
import { EMPTY_EXPERIENCE_TOUR_FORM, experienceTourFormSchema, experienceTourFormToPayload, experienceTourToForm } from '../experience-tour.schema';

const item: ExperienceTourAdminItem = {
  id: 'tour-vuon', version: 2, name: 'Tour vườn cây', category: 'Nửa ngày', duration: '4 giờ',
  startTime: '08:00', priceRange: '150.000đ', meetingPoint: 'Nhà văn hóa', contactPhone: '0900 123 456',
  summary: 'Tóm tắt tour', description: ['Mô tả'], itinerary: ['Bước 1'], included: [], note: '',
  mediaId: 'media-1', imageUrl: 'https://cdn/tour.webp', imageAlt: 'Vườn cây', sortOrder: 0,
  isActive: true, updatedAt: '2026-07-16T00:00:00.000Z', updatedBy: null,
};

const validForm = {
  ...EMPTY_EXPERIENCE_TOUR_FORM,
  name: 'Tour vườn cây', duration: '4 giờ', startTime: '08:00', priceRange: '150.000đ',
  meetingPoint: 'Nhà văn hóa', contactPhone: '0900 123 456', summary: 'Tóm tắt tour',
  descriptionItems: [{ text: 'Mô tả' }], itineraryItems: [{ text: 'Bước 1' }], mediaId: 'media-1',
};

describe('experienceTourFormSchema', () => {
  it('blocks save when itinerary is missing', () => {
    const result = experienceTourFormSchema.safeParse({
      ...EMPTY_EXPERIENCE_TOUR_FORM,
      name: 'Tour vườn cây',
      duration: '4 giờ',
      startTime: '08:00',
      priceRange: '150.000đ',
      meetingPoint: 'Nhà văn hóa',
      contactPhone: '0900 123 456',
      summary: 'Tóm tắt tour',
      descriptionItems: [{ text: 'Mô tả' }],
      itineraryItems: [],
      mediaId: 'media-1',
    });

    expect(result.success).toBe(false);
  });

  it('keeps itinerary order and trims payload fields', () => {
    const payload = experienceTourFormToPayload({
      ...EMPTY_EXPERIENCE_TOUR_FORM,
      name: '  Tour vườn cây  ',
      duration: '  4 giờ ',
      startTime: ' 08:00 ',
      priceRange: ' 150.000đ ',
      meetingPoint: ' Nhà văn hóa ',
      contactPhone: '  +84 900 123 456  ',
      summary: ' Tóm tắt ',
      descriptionItems: [{ text: ' Mô tả 1 ' }],
      itineraryItems: [{ text: ' Bước 2 ' }, { text: ' Bước 1 ' }],
      includedItems: [{ text: ' Nước uống ' }],
      note: ' Ghi chú ',
      mediaId: 'media-1',
    });

    expect(payload).toEqual(expect.objectContaining({
      name: 'Tour vườn cây',
      itinerary: ['Bước 2', 'Bước 1'],
      included: ['Nước uống'],
      note: 'Ghi chú',
      contactPhone: '+84 900 123 456',
    }));
  });

  it('validates the contact phone format and length', () => {
    for (const contactPhone of ['0900 123 456', '+84 900 123 456']) {
      expect(experienceTourFormSchema.safeParse({ ...validForm, contactPhone }).success).toBe(true);
    }
    for (const contactPhone of ['', '   ', '+ ( ) -', 'abc0900', '0'.repeat(31)]) {
      expect(experienceTourFormSchema.safeParse({ ...validForm, contactPhone }).success).toBe(false);
    }
  });

  it('initializes, maps legacy responses, and trims contactPhone independently', () => {
    expect(EMPTY_EXPERIENCE_TOUR_FORM.contactPhone).toBe('');
    expect(experienceTourToForm(item).contactPhone).toBe('0900 123 456');
    expect(experienceTourToForm({ ...item, contactPhone: null } as unknown as ExperienceTourAdminItem).contactPhone).toBe('');
    expect(experienceTourToForm({ ...item, contactPhone: undefined } as unknown as ExperienceTourAdminItem).contactPhone).toBe('');
    expect(experienceTourFormToPayload({ ...validForm, contactPhone: '  0909 111 222  ' }).contactPhone).toBe('0909 111 222');
  });
});
