import { z } from 'zod';
import type { CuisineAdminItem, CuisinePayload, CuisineSuggestedPlace } from '../../../types/cuisine';
import { isValidGoogleMapsUrl } from './google-maps';

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

const shortItemSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
});

const suggestedPlaceSchema = z.object({
  id: z.string().trim().min(1, 'Thiếu mã địa điểm'),
  name: z.string().trim().min(1, 'Bắt buộc').max(200, 'Tối đa 200 ký tự'),
  address: z.string().trim().max(255, 'Tối đa 255 ký tự'),
  googleMapsUrl: z.string().trim().max(2048, 'Tối đa 2.048 ký tự'),
});

export const cuisineFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(['Món nước', 'Món nướng', 'Món cuốn', 'Ăn vặt', 'Món chay']),
    priceRange: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    bestTime: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    suggestedPlaces: z.array(suggestedPlaceSchema).max(20, 'Tối đa 20 địa điểm'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptions: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
    highlights: z.array(shortItemSchema).max(20, 'Tối đa 20 điểm nổi bật'),
    tip: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
    mediaId: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    imageAlt: z.string().trim().max(150, 'Tối đa 150 ký tự'),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0),
  })
  .superRefine((value, context) => {
    if (!value.mediaId && !value.imageUrl) {
      context.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Vui lòng chọn ảnh đại diện' });
    }

    value.suggestedPlaces.forEach((place, index) => {
      const googleMapsUrl = place.googleMapsUrl.trim();
      if (googleMapsUrl && !isValidGoogleMapsUrl(googleMapsUrl)) {
        context.addIssue({
          code: 'custom',
          path: ['suggestedPlaces', index, 'googleMapsUrl'],
          message: 'Link phải là URL HTTPS hợp lệ của Google Maps',
        });
      }

      if (!value.isActive) return;
      if (!place.address.trim()) {
        context.addIssue({ code: 'custom', path: ['suggestedPlaces', index, 'address'], message: 'Bắt buộc khi món đang hiển thị' });
      }
      if (!googleMapsUrl) {
        context.addIssue({
          code: 'custom',
          path: ['suggestedPlaces', index, 'googleMapsUrl'],
          message: 'Bắt buộc khi món đang hiển thị',
        });
      }
    });
  });

export type CuisineFormValues = z.infer<typeof cuisineFormSchema>;
export type CuisineSuggestedPlaceFormValue = CuisineFormValues['suggestedPlaces'][number];

export const EMPTY_CUISINE_FORM: CuisineFormValues = {
  name: '',
  category: 'Món nước',
  priceRange: '',
  bestTime: '',
  suggestedPlaces: [],
  summary: '',
  descriptions: [{ text: '' }],
  highlights: [],
  tip: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  isActive: true,
  sortOrder: 0,
};

let temporaryPlaceSequence = 0;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function legacyPlacesToForm(names: string[]): CuisineSuggestedPlaceFormValue[] {
  const occurrences = new Map<string, number>();
  return names.map((rawName) => {
    const name = typeof rawName === 'string' ? rawName : '';
    const occurrence = (occurrences.get(name) ?? 0) + 1;
    occurrences.set(name, occurrence);
    return {
      id: `legacy-${stableHash(`${name}\u0000${occurrence}`)}`,
      name,
      address: '',
      googleMapsUrl: '',
    };
  });
}

function detailsToForm(details: CuisineSuggestedPlace[]): CuisineSuggestedPlaceFormValue[] {
  const missingIdOccurrences = new Map<string, number>();
  return details.map((place) => {
    const name = typeof place?.name === 'string' ? place.name : '';
    const address = typeof place?.address === 'string' ? place.address : '';
    const googleMapsUrl = typeof place?.googleMapsUrl === 'string' ? place.googleMapsUrl : '';
    const identitySource = `${name}\u0000${address}`;
    const occurrence = (missingIdOccurrences.get(identitySource) ?? 0) + 1;
    missingIdOccurrences.set(identitySource, occurrence);

    return {
      id: typeof place?.id === 'string' && place.id.trim()
        ? place.id
        : `legacy-${stableHash(`${identitySource}\u0000${occurrence}`)}`,
      name,
      address,
      googleMapsUrl,
    };
  });
}

export function createEmptyCuisineSuggestedPlace(): CuisineSuggestedPlaceFormValue {
  const id = globalThis.crypto?.randomUUID?.()
    ?? `temp-${Date.now().toString(36)}-${(temporaryPlaceSequence += 1).toString(36)}`;
  return { id, name: '', address: '', googleMapsUrl: '' };
}

export function cuisineToForm(item: CuisineAdminItem): CuisineFormValues {
  const suggestedPlaces = Array.isArray(item.suggestedPlaceDetails)
    ? detailsToForm(item.suggestedPlaceDetails)
    : legacyPlacesToForm(Array.isArray(item.suggestedPlaces) ? item.suggestedPlaces : []);

  return {
    name: item.name,
    category: item.category,
    priceRange: item.priceRange,
    bestTime: item.bestTime,
    suggestedPlaces,
    summary: item.summary,
    descriptions: item.description.map((text) => ({ text })),
    highlights: item.highlights.map((text) => ({ text })),
    tip: item.tip,
    mediaId: item.mediaId,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  };
}

export function formToCuisinePayload(value: CuisineFormValues): CuisinePayload {
  return {
    name: value.name.trim(),
    category: value.category,
    priceRange: value.priceRange.trim(),
    bestTime: value.bestTime.trim(),
    suggestedPlaceDetails: value.suggestedPlaces.map((place) => ({
      id: place.id.trim(),
      name: place.name.trim(),
      address: place.address.trim(),
      googleMapsUrl: place.googleMapsUrl.trim(),
    })),
    summary: value.summary.trim(),
    description: value.descriptions.map((item) => item.text.trim()),
    highlights: value.highlights.map((item) => item.text.trim()),
    tip: value.tip.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    isActive: value.isActive,
    sortOrder: value.sortOrder,
  };
}
