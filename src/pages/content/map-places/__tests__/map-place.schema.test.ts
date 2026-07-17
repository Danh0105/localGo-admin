import { describe, expect, it } from 'vitest';
import { EMPTY_MAP_PLACE_FORM, mapPlaceFormSchema, mapPlaceFormToPayload } from '../map-place.schema';

describe('mapPlaceFormSchema', () => {
  it('blocks coordinates outside the valid range', () => {
    const result = mapPlaceFormSchema.safeParse({
      ...EMPTY_MAP_PLACE_FORM,
      name: 'UBND xã',
      address: 'Trung tâm xã',
      openTime: '07:30 - 17:00',
      distanceFromCenter: '0 km',
      summary: 'Tóm tắt',
      descriptionItems: [{ text: 'Mô tả' }],
      coordinates: { lat: 91, lng: 106.2 },
      mediaId: 'media-1',
    });

    expect(result.success).toBe(false);
  });

  it('trims payload fields and keeps coordinates as numbers', () => {
    const payload = mapPlaceFormToPayload({
      ...EMPTY_MAP_PLACE_FORM,
      name: '  UBND xã  ',
      address: ' Trung tâm xã ',
      coordinates: { lat: 11.2418, lng: 106.2024 },
      openTime: ' 07:30 - 17:00 ',
      distanceFromCenter: ' 0 km ',
      summary: ' Tóm tắt ',
      descriptionItems: [{ text: ' Mô tả 1 ' }],
      highlightItems: [{ text: ' Bãi đỗ xe ' }],
      directionNote: ' Ghi chú ',
      mediaId: 'media-1',
    });

    expect(payload).toEqual(expect.objectContaining({
      name: 'UBND xã',
      coordinates: { lat: 11.2418, lng: 106.2024 },
      description: ['Mô tả 1'],
      highlights: ['Bãi đỗ xe'],
      directionNote: 'Ghi chú',
    }));
    expect(typeof payload.coordinates.lat).toBe('number');
    expect(typeof payload.coordinates.lng).toBe('number');
  });
});
