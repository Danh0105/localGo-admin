import { z } from 'zod';
import type { MapPlaceAdminItem, MapPlacePayload } from '../../../types/map-place';
import { MAP_PLACE_CATEGORIES } from '../../../types/map-place';

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

const highlightSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
});

const coordinateNumber = (min: number, max: number, minMessage: string, maxMessage: string) =>
  z.number({ error: 'Bắt buộc' }).min(min, minMessage).max(max, maxMessage);

export const mapPlaceFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(MAP_PLACE_CATEGORIES),
    address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    coordinates: z.object({
      lat: coordinateNumber(-90, 90, 'Vĩ độ phải từ -90 đến 90', 'Vĩ độ phải từ -90 đến 90'),
      lng: coordinateNumber(-180, 180, 'Kinh độ phải từ -180 đến 180', 'Kinh độ phải từ -180 đến 180'),
    }),
    openTime: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    distanceFromCenter: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptionItems: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn mô tả').max(20, 'Tối đa 20 đoạn'),
    highlightItems: z.array(highlightSchema).max(20, 'Tối đa 20 điểm nổi bật'),
    directionNote: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
    mediaId: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    imageAlt: z.string().trim().max(150, 'Tối đa 150 ký tự'),
    sortOrder: z.number().int().min(0),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.mediaId && !value.imageUrl) {
      context.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Vui lòng chọn ảnh đại diện' });
    }
  });

export type MapPlaceFormValues = z.infer<typeof mapPlaceFormSchema>;

export const EMPTY_MAP_PLACE_FORM: MapPlaceFormValues = {
  name: '',
  category: 'Hành chính',
  address: '',
  coordinates: { lat: 0, lng: 0 },
  openTime: '',
  distanceFromCenter: '',
  summary: '',
  descriptionItems: [{ text: '' }],
  highlightItems: [],
  directionNote: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
};

export function mapPlaceToForm(item: MapPlaceAdminItem): MapPlaceFormValues {
  return {
    name: item.name,
    category: item.category,
    address: item.address,
    coordinates: {
      lat: item.coordinates.lat,
      lng: item.coordinates.lng,
    },
    openTime: item.openTime,
    distanceFromCenter: item.distanceFromCenter,
    summary: item.summary,
    descriptionItems: item.description.map((text) => ({ text })),
    highlightItems: item.highlights.map((text) => ({ text })),
    directionNote: item.directionNote,
    mediaId: item.mediaId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: item.imageAlt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function mapPlaceFormToPayload(value: MapPlaceFormValues): MapPlacePayload {
  return {
    name: value.name.trim(),
    category: value.category,
    address: value.address.trim(),
    coordinates: {
      lat: value.coordinates.lat,
      lng: value.coordinates.lng,
    },
    openTime: value.openTime.trim(),
    distanceFromCenter: value.distanceFromCenter.trim(),
    summary: value.summary.trim(),
    description: value.descriptionItems.map((item) => item.text.trim()),
    highlights: value.highlightItems.map((item) => item.text.trim()),
    directionNote: value.directionNote.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    sortOrder: value.sortOrder,
    isActive: value.isActive,
  };
}
