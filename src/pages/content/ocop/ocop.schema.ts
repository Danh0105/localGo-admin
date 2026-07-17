import { z } from 'zod';
import type { OcopAdminProduct, OcopPayload } from '../../../types/ocop';

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});
const highlightSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
});

export const ocopFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(['Thực phẩm', 'Đồ uống', 'Nông sản tươi', 'Sản phẩm chế biến']),
    rating: z.union([z.literal(3), z.literal(4), z.literal(5)]),
    producer: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    priceRange: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
    contactPhone: z
      .string()
      .trim()
      .min(1, 'Bắt buộc')
      .max(30, 'Tối đa 30 ký tự')
      .regex(/^[+0-9\s.()-]+$/, 'Chỉ được dùng chữ số và các ký tự + . - ( )')
      .regex(/\d/, 'Số điện thoại phải có ít nhất một chữ số'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptions: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
    highlights: z.array(highlightSchema).max(20, 'Tối đa 20 điểm nổi bật'),
    contactNote: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
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

export type OcopFormValues = z.infer<typeof ocopFormSchema>;

export const EMPTY_OCOP_FORM: OcopFormValues = {
  name: '', category: 'Thực phẩm', rating: 3, producer: '', address: '', priceRange: '', contactPhone: '', summary: '',
  descriptions: [{ text: '' }], highlights: [], contactNote: '', mediaId: null, imageUrl: null,
  imageAlt: '', isActive: true, sortOrder: 0,
};

export function ocopToForm(item: OcopAdminProduct): OcopFormValues {
  return {
    name: item.name, category: item.category, rating: item.rating, producer: item.producer,
    address: item.address, priceRange: item.priceRange, contactPhone: item.contactPhone ?? '', summary: item.summary,
    descriptions: item.description.map((text) => ({ text })),
    highlights: item.highlights.map((text) => ({ text })), contactNote: item.contactNote,
    mediaId: item.mediaId, imageUrl: item.imageUrl, imageAlt: item.imageAlt,
    isActive: item.isActive, sortOrder: item.sortOrder,
  };
}

export function formToOcopPayload(value: OcopFormValues): OcopPayload {
  return {
    name: value.name.trim(), category: value.category, rating: value.rating,
    producer: value.producer.trim(), address: value.address.trim(), priceRange: value.priceRange.trim(),
    contactPhone: value.contactPhone.trim(),
    summary: value.summary.trim(), description: value.descriptions.map((item) => item.text.trim()),
    highlights: value.highlights.map((item) => item.text.trim()), contactNote: value.contactNote.trim(),
    mediaId: value.mediaId, imageAlt: value.imageAlt.trim(), isActive: value.isActive, sortOrder: value.sortOrder,
  };
}
