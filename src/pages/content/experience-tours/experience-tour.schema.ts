import { z } from 'zod';
import type { ExperienceTourAdminItem, ExperienceTourPayload } from '../../../types/experience-tour';
import { EXPERIENCE_TOUR_CATEGORIES } from '../../../types/experience-tour';

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

const shortTextSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(300, 'Tối đa 300 ký tự'),
});

export const experienceTourFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(EXPERIENCE_TOUR_CATEGORIES),
    duration: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    startTime: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    priceRange: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    meetingPoint: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    contactPhone: z
      .string()
      .trim()
      .min(1, 'Bắt buộc')
      .max(30, 'Tối đa 30 ký tự')
      .regex(/^[+0-9\s.()-]+$/, 'Chỉ được dùng chữ số và các ký tự + . - ( )')
      .regex(/\d/, 'Số điện thoại phải có ít nhất một chữ số'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptionItems: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn mô tả').max(20, 'Tối đa 20 đoạn'),
    itineraryItems: z.array(shortTextSchema).min(1, 'Cần ít nhất một bước lịch trình').max(30, 'Tối đa 30 bước'),
    includedItems: z.array(shortTextSchema).max(20, 'Tối đa 20 mục bao gồm'),
    note: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
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

export type ExperienceTourFormValues = z.infer<typeof experienceTourFormSchema>;

export const EMPTY_EXPERIENCE_TOUR_FORM: ExperienceTourFormValues = {
  name: '',
  category: 'Nửa ngày',
  duration: '',
  startTime: '',
  priceRange: '',
  meetingPoint: '',
  contactPhone: '',
  summary: '',
  descriptionItems: [{ text: '' }],
  itineraryItems: [{ text: '' }],
  includedItems: [],
  note: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
};

export function experienceTourToForm(item: ExperienceTourAdminItem): ExperienceTourFormValues {
  return {
    name: item.name,
    category: item.category,
    duration: item.duration,
    startTime: item.startTime,
    priceRange: item.priceRange,
    meetingPoint: item.meetingPoint,
    contactPhone: item.contactPhone ?? '',
    summary: item.summary,
    descriptionItems: item.description.map((text) => ({ text })),
    itineraryItems: item.itinerary.map((text) => ({ text })),
    includedItems: item.included.map((text) => ({ text })),
    note: item.note,
    mediaId: item.mediaId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: item.imageAlt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function experienceTourFormToPayload(value: ExperienceTourFormValues): ExperienceTourPayload {
  return {
    name: value.name.trim(),
    category: value.category,
    duration: value.duration.trim(),
    startTime: value.startTime.trim(),
    priceRange: value.priceRange.trim(),
    meetingPoint: value.meetingPoint.trim(),
    contactPhone: value.contactPhone.trim(),
    summary: value.summary.trim(),
    description: value.descriptionItems.map((item) => item.text.trim()),
    itinerary: value.itineraryItems.map((item) => item.text.trim()),
    included: value.includedItems.map((item) => item.text.trim()),
    note: value.note.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    sortOrder: value.sortOrder,
    isActive: value.isActive,
  };
}
