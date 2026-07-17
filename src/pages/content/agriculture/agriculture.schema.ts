import { z } from 'zod';
import type { AgricultureAdminItem, AgriculturePayload } from '../../../types/agriculture';
import { AGRICULTURE_CATEGORIES } from '../../../types/agriculture';

const descriptionItemSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});
const highlightItemSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
});

export const agricultureFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(AGRICULTURE_CATEGORIES),
    location: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    season: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    scale: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptionItems: z.array(descriptionItemSchema).min(1, 'Cần ít nhất một đoạn thông tin').max(20, 'Tối đa 20 đoạn'),
    highlightItems: z.array(highlightItemSchema).max(20, 'Tối đa 20 điểm nổi bật'),
    support: z.string().trim().min(1, 'Bắt buộc').max(2000, 'Tối đa 2.000 ký tự'),
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

export type AgricultureFormValues = z.infer<typeof agricultureFormSchema>;

export const EMPTY_AGRICULTURE_FORM: AgricultureFormValues = {
  name: '',
  category: 'Cây trồng chủ lực',
  location: '',
  season: '',
  scale: '',
  summary: '',
  descriptionItems: [{ text: '' }],
  highlightItems: [],
  support: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
};

export function agricultureToForm(item: AgricultureAdminItem): AgricultureFormValues {
  return {
    name: item.name,
    category: item.category,
    location: item.location,
    season: item.season,
    scale: item.scale,
    summary: item.summary,
    descriptionItems: item.description.map((text) => ({ text })),
    highlightItems: item.highlights.map((text) => ({ text })),
    support: item.support,
    mediaId: item.mediaId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: item.imageAlt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function agricultureFormToPayload(value: AgricultureFormValues): AgriculturePayload {
  return {
    name: value.name.trim(),
    category: value.category,
    location: value.location.trim(),
    season: value.season.trim(),
    scale: value.scale.trim(),
    summary: value.summary.trim(),
    description: value.descriptionItems.map((item) => item.text.trim()),
    highlights: value.highlightItems.map((item) => item.text.trim()),
    support: value.support.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    sortOrder: value.sortOrder,
    isActive: value.isActive,
  };
}
