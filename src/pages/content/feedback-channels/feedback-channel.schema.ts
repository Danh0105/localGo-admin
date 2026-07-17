import { z } from 'zod';
import type { FeedbackChannelAdminItem, FeedbackChannelPayload } from '../../../types/feedback-channel';

const listItemSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(300, 'Tối đa 300 ký tự') });

export const feedbackChannelFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    category: z.enum(['Góp ý chung', 'Phản ánh hạ tầng', 'Dịch vụ công', 'Du lịch', 'Mini App']),
    responseTime: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    descriptions: z.array(listItemSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
    requiredInfoItems: z.array(listItemSchema).min(1, 'Cần ít nhất một mục').max(20, 'Tối đa 20 mục'),
    exampleItems: z.array(listItemSchema).max(20, 'Tối đa 20 ví dụ'),
    note: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
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

export type FeedbackChannelFormValues = z.infer<typeof feedbackChannelFormSchema>;

export const EMPTY_FEEDBACK_CHANNEL_FORM: FeedbackChannelFormValues = {
  title: '',
  category: 'Góp ý chung',
  responseTime: '',
  summary: '',
  descriptions: [{ text: '' }],
  requiredInfoItems: [{ text: '' }],
  exampleItems: [],
  note: '',
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  isActive: true,
  sortOrder: 0,
};

export function feedbackChannelToForm(item: FeedbackChannelAdminItem): FeedbackChannelFormValues {
  return {
    title: item.title,
    category: item.category,
    responseTime: item.responseTime,
    summary: item.summary,
    descriptions: item.description.map((text) => ({ text })),
    requiredInfoItems: item.requiredInfo.map((text) => ({ text })),
    exampleItems: item.examples.map((text) => ({ text })),
    note: item.note,
    mediaId: item.mediaId,
    imageUrl: item.imageUrl,
    imageAlt: item.imageAlt,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  };
}

export function feedbackChannelFormToPayload(value: FeedbackChannelFormValues): FeedbackChannelPayload {
  return {
    title: value.title.trim(),
    category: value.category,
    responseTime: value.responseTime.trim(),
    summary: value.summary.trim(),
    description: value.descriptions.map((item) => item.text.trim()),
    requiredInfo: value.requiredInfoItems.map((item) => item.text.trim()),
    examples: value.exampleItems.map((item) => item.text.trim()),
    note: value.note.trim(),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    isActive: value.isActive,
    sortOrder: value.sortOrder,
  };
}
