import { describe, expect, it } from 'vitest';
import type { CuisineAdminItem } from '../../../../types/cuisine';
import {
  cuisineFormSchema,
  cuisineToForm,
  EMPTY_CUISINE_FORM,
  formToCuisinePayload,
  type CuisineFormValues,
} from '../cuisine.schema';

const fullMapsUrl = 'https://www.google.com/maps/place/Quan+trung+tam';

const item: CuisineAdminItem = {
  id: 'pho',
  version: 2,
  name: 'Phở LocalGo',
  category: 'Món nước',
  priceRange: '40.000đ - 70.000đ',
  bestTime: 'Buổi sáng',
  suggestedPlaceDetails: [{
    id: 'place-center',
    name: 'Quán trung tâm',
    address: '12 Đường LocalGo',
    googleMapsUrl: fullMapsUrl,
  }],
  summary: 'Món nước truyền thống',
  description: ['Nước dùng thanh'],
  highlights: ['Nấu từ xương'],
  tip: 'Dùng khi nóng',
  mediaId: 'media-1',
  imageUrl: 'https://cdn/pho.webp',
  imageAlt: 'Tô phở',
  sortOrder: 0,
  isActive: true,
  updatedAt: '2026-07-15T00:00:00.000Z',
  updatedBy: null,
};

const validForm = cuisineToForm(item);

describe('Cuisine schema and mapper', () => {
  it('accepts supported full and shortened Google Maps links', () => {
    const acceptedUrls = [
      'https://www.google.com/maps/place/Quan+A',
      'https://google.com/maps/dir/?api=1&destination=11%2C106',
      'https://maps.google.com/?q=Quan+A',
      'https://maps.app.goo.gl/AbCdEf123',
      'https://goo.gl/maps/AbCdEf123',
    ];

    for (const googleMapsUrl of acceptedUrls) {
      expect(cuisineFormSchema.safeParse({
        ...validForm,
        suggestedPlaces: [{ ...validForm.suggestedPlaces[0], googleMapsUrl }],
      }).success).toBe(true);
    }
  });

  it('rejects unsafe, fake, malformed and oversized Google Maps links', () => {
    const rejectedUrls = [
      '',
      'http://www.google.com/maps/place/Quan+A',
      'javascript:alert(1)',
      'https://google.com.evil.example/maps/place/Quan+A',
      'https://user:password@www.google.com/maps/place/Quan+A',
      'https://www.google.com:444/maps/place/Quan+A',
      'https://www.google.com/search?q=Quan+A',
      'not a url',
      `https://www.google.com/maps/${'a'.repeat(2050)}`,
    ];

    for (const googleMapsUrl of rejectedUrls) {
      expect(cuisineFormSchema.safeParse({
        ...validForm,
        suggestedPlaces: [{ ...validForm.suggestedPlaces[0], googleMapsUrl }],
      }).success).toBe(false);
    }

    expect(cuisineFormSchema.safeParse({
      ...validForm,
      isActive: false,
      suggestedPlaces: [{ ...validForm.suggestedPlaces[0], address: '', googleMapsUrl: '' }],
    }).success).toBe(true);
  });

  it('blocks active items when a place is missing name, address or link', () => {
    const result = cuisineFormSchema.safeParse({
      ...validForm,
      suggestedPlaces: [{ ...validForm.suggestedPlaces[0], name: ' ', address: '', googleMapsUrl: '' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(expect.arrayContaining([
        'suggestedPlaces.0.name',
        'suggestedPlaces.0.address',
        'suggestedPlaces.0.googleMapsUrl',
      ]));
    }
  });

  it('maps legacy names to stable temporary ids without losing order', () => {
    const legacyItem: CuisineAdminItem = {
      ...item,
      suggestedPlaceDetails: undefined,
      suggestedPlaces: ['Quán A', 'Quán A', 'Quán B'],
      isActive: false,
    };
    const first = cuisineToForm(legacyItem);
    const second = cuisineToForm(legacyItem);

    expect(first.suggestedPlaces.map((place) => place.name)).toEqual(['Quán A', 'Quán A', 'Quán B']);
    expect(first.suggestedPlaces.map((place) => place.id)).toEqual(second.suggestedPlaces.map((place) => place.id));
    expect(new Set(first.suggestedPlaces.map((place) => place.id))).toHaveLength(3);
    expect(first.suggestedPlaces[0]).toEqual(expect.objectContaining({ address: '', googleMapsUrl: '' }));
  });

  it('keeps intermediate object names and addresses while requiring a real pasted link', () => {
    const intermediateItem = {
      ...item,
      suggestedPlaceDetails: [{
        id: 'intermediate-place',
        name: 'Quán trung gian',
        address: '34 Đường cũ',
        coordinates: { lat: 11.1, lng: 106.1 },
      }],
      isActive: false,
    } as unknown as CuisineAdminItem;

    expect(cuisineToForm(intermediateItem).suggestedPlaces[0]).toEqual({
      id: 'intermediate-place',
      name: 'Quán trung gian',
      address: '34 Đường cũ',
      googleMapsUrl: '',
    });
  });

  it('prefers detailed places and sends only the new trimmed object contract in order', () => {
    const form = cuisineToForm({ ...item, suggestedPlaces: ['Không được dùng'] });
    const reordered: CuisineFormValues = {
      ...form,
      suggestedPlaces: [
        { id: ' second ', name: ' Quán B ', address: ' Địa chỉ B ', googleMapsUrl: ' https://maps.app.goo.gl/Second ' },
        { id: ' first ', name: ' Quán A ', address: ' Địa chỉ A ', googleMapsUrl: ' https://www.google.com/maps/place/First ' },
      ],
    };
    const payload = formToCuisinePayload(reordered);

    expect(form.suggestedPlaces.map((place) => place.name)).toEqual(['Quán trung tâm']);
    expect(payload.suggestedPlaceDetails).toEqual([
      { id: 'second', name: 'Quán B', address: 'Địa chỉ B', googleMapsUrl: 'https://maps.app.goo.gl/Second' },
      { id: 'first', name: 'Quán A', address: 'Địa chỉ A', googleMapsUrl: 'https://www.google.com/maps/place/First' },
    ]);
    expect(payload).not.toHaveProperty('suggestedPlaces');
  });

  it('requires core fields and limits every dynamic list to 20 items', () => {
    const result = cuisineFormSchema.safeParse({
      ...validForm,
      name: '',
      priceRange: '',
      bestTime: '',
      summary: '',
      mediaId: null,
      imageUrl: null,
      descriptions: [{ text: ' ' }],
    });
    expect(result.success).toBe(false);

    expect(cuisineFormSchema.safeParse({ ...validForm, descriptions: Array.from({ length: 21 }, () => ({ text: 'Đoạn' })) }).success).toBe(false);
    expect(cuisineFormSchema.safeParse({ ...validForm, highlights: Array.from({ length: 21 }, () => ({ text: 'Điểm' })) }).success).toBe(false);
    expect(cuisineFormSchema.safeParse({
      ...EMPTY_CUISINE_FORM,
      suggestedPlaces: Array.from({ length: 21 }, (_, index) => ({ id: `place-${index}`, name: 'Quán', address: '', googleMapsUrl: '' })),
    }).success).toBe(false);
  });
});
