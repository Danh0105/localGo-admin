import { z } from 'zod';
import type { ContactAdminItem, ContactPayload } from '../../../types/contact';
import { CONTACT_CATEGORIES } from '../../../types/contact';

const phonePattern = /^\+?[0-9\s]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

const supportTopicSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự'),
});

export const contactFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(CONTACT_CATEGORIES),
    role: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    phone: z.string().trim().min(1, 'Bắt buộc').max(30, 'Tối đa 30 ký tự'),
    email: z.string().trim().max(255, 'Tối đa 255 ký tự'),
    address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    workingTime: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptionItems: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn mô tả').max(20, 'Tối đa 20 đoạn'),
    supportTopicItems: z.array(supportTopicSchema).max(20, 'Tối đa 20 nội dung hỗ trợ'),
    note: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
    mediaId: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    imageAlt: z.string().trim().max(150, 'Tối đa 150 ký tự'),
    sortOrder: z.number().int().min(0),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!phonePattern.test(value.phone.trim())) {
      context.addIssue({ code: 'custom', path: ['phone'], message: 'Số điện thoại chỉ gồm số, khoảng trắng và dấu + ở đầu' });
    }
    const email = value.email.trim();
    if (email && !emailPattern.test(email)) {
      context.addIssue({ code: 'custom', path: ['email'], message: 'Email chưa đúng định dạng' });
    }
    if (!value.mediaId && !value.imageUrl) {
      context.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Vui lòng chọn ảnh đại diện' });
    }
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  name: '',
  category: 'Hành chính',
  role: '',
  phone: '',
  email: '',
  address: '',
  workingTime: '',
  summary: '',
  descriptionItems: [{ text: '' }],
  supportTopicItems: [],
  note: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
};

export function contactToForm(item: ContactAdminItem): ContactFormValues {
  return {
    name: item.name,
    category: item.category,
    role: item.role,
    phone: item.phone,
    email: item.email ?? '',
    address: item.address,
    workingTime: item.workingTime,
    summary: item.summary,
    descriptionItems: item.description.map((text) => ({ text })),
    supportTopicItems: item.supportTopics.map((text) => ({ text })),
    note: item.note,
    mediaId: item.mediaId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: item.imageAlt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function contactFormToPayload(value: ContactFormValues): ContactPayload {
  const email = value.email.trim();
  return {
    name: value.name.trim(),
    category: value.category,
    role: value.role.trim(),
    phone: value.phone.trim(),
    ...(email ? { email } : {}),
    address: value.address.trim(),
    workingTime: value.workingTime.trim(),
    summary: value.summary.trim(),
    description: value.descriptionItems.map((item) => item.text.trim()),
    supportTopics: value.supportTopicItems.map((item) => item.text.trim()),
    note: value.note.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    sortOrder: value.sortOrder,
    isActive: value.isActive,
  };
}
