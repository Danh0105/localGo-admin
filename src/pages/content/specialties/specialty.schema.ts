import { z } from 'zod';
import type { SpecialtyAdminItem, SpecialtyPayload } from '../../../types/specialty';
import { optionalGoogleMapsUrlSchema } from '../../../utils/google-maps';
import { buyPlacesSchema, buyPlacesToPayload, normalizeBuyPlaces } from './specialty-buy-places';

const descriptionSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

export const specialtyFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(['Món ăn', 'Trái cây', 'Quà mang về']),
    price: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    season: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    googleMapsUrl: optionalGoogleMapsUrlSchema,
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptions: z.array(descriptionSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
    buyPlaces: buyPlacesSchema,
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
  });

export type SpecialtyFormValues = z.infer<typeof specialtyFormSchema>;

export const EMPTY_SPECIALTY_FORM: SpecialtyFormValues = {
  name: '',
  category: 'Món ăn',
  price: '',
  season: '',
  googleMapsUrl: '',
  summary: '',
  descriptions: [{ text: '' }],
  buyPlaces: [],
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  isActive: true,
  sortOrder: 0,
};

/** Đọc được cả dữ liệu cũ (string[]) lẫn mới (SpecialtyBuyPlace[]). */
export function specialtyToForm(item: SpecialtyAdminItem): SpecialtyFormValues {
  return {
    name: item.name,
    category: item.category,
    price: item.price,
    season: item.season,
    googleMapsUrl: item.googleMapsUrl ?? '',
    summary: item.summary,
    descriptions: item.description.map((text) => ({ text })),
    buyPlaces: normalizeBuyPlaces(item.buyPlaces),
    mediaId: item.mediaId,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  };
}

/** Payload gửi backend: buyPlaces là mảng object JSON, không phải string[]. */
export function formToPayload(value: SpecialtyFormValues): SpecialtyPayload {
  return {
    name: value.name.trim(),
    category: value.category,
    price: value.price.trim(),
    season: value.season.trim(),
    googleMapsUrl: value.googleMapsUrl.trim(),
    summary: value.summary.trim(),
    description: value.descriptions.map((item) => item.text.trim()),
    buyPlaces: buyPlacesToPayload(value.buyPlaces),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    isActive: value.isActive,
    sortOrder: value.sortOrder,
  };
}
