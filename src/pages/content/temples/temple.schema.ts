import { z } from 'zod';
import type { TempleAdminItem, TemplePayload } from '../../../types/temple';

const descriptionSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự') });
const eventSchema = z.object({
  id: z.string().optional(),
  time: z.string().trim().min(1, 'Bắt buộc').max(50, 'Tối đa 50 ký tự'),
  name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
});

export const templeFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    type: z.enum(['Đình', 'Chùa', 'Miếu']),
    address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    openHours: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptions: z.array(descriptionSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
    events: z.array(eventSchema).max(30, 'Tối đa 30 sự kiện'),
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

export type TempleFormValues = z.infer<typeof templeFormSchema>;

export const EMPTY_TEMPLE_FORM: TempleFormValues = {
  name: '',
  type: 'Đình',
  address: '',
  openHours: '',
  summary: '',
  descriptions: [{ text: '' }],
  events: [],
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  isActive: true,
  sortOrder: 0,
};

export function templeToForm(item: TempleAdminItem): TempleFormValues {
  return {
    name: item.name,
    type: item.type,
    address: item.address,
    openHours: item.openHours,
    summary: item.summary,
    descriptions: item.description.map((text) => ({ text })),
    events: item.events.map(({ id, time, name }) => ({ id, time, name })),
    mediaId: item.mediaId,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  };
}

export function formToPayload(value: TempleFormValues): TemplePayload {
  return {
    name: value.name.trim(),
    type: value.type,
    address: value.address.trim(),
    openHours: value.openHours.trim(),
    summary: value.summary.trim(),
    description: value.descriptions.map((item) => item.text.trim()),
    events: value.events.map((event) => ({ id: event.id, time: event.time.trim(), name: event.name.trim() })),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    isActive: value.isActive,
    sortOrder: value.sortOrder,
  };
}

