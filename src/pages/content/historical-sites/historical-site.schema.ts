import { z } from 'zod';
import type { HistoricalSiteAdminItem, HistoricalSitePayload } from '../../../types/historical-site';

const CURRENT_YEAR = new Date().getFullYear();
const historyItemSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự') });
const highlightItemSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự') });

export const historicalSiteFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    rank: z.enum(['Cấp quốc gia', 'Cấp tỉnh', 'Chưa xếp hạng']),
    address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
    recognizedYear: z.number().int('Năm phải là số nguyên').min(1, 'Năm không hợp lệ').max(CURRENT_YEAR, `Không được lớn hơn ${CURRENT_YEAR}`).nullable(),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    historyItems: z.array(historyItemSchema).min(1, 'Cần ít nhất một đoạn lịch sử').max(20, 'Tối đa 20 đoạn'),
    highlightItems: z.array(highlightItemSchema).max(20, 'Tối đa 20 điểm nổi bật'),
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

export type HistoricalSiteFormValues = z.infer<typeof historicalSiteFormSchema>;

export const EMPTY_HISTORICAL_SITE_FORM: HistoricalSiteFormValues = {
  name: '',
  rank: 'Chưa xếp hạng',
  address: '',
  recognizedYear: null,
  summary: '',
  historyItems: [{ text: '' }],
  highlightItems: [],
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  sortOrder: 0,
  isActive: true,
};

export function historicalSiteToForm(item: HistoricalSiteAdminItem): HistoricalSiteFormValues {
  return {
    name: item.name,
    rank: item.rank,
    address: item.address,
    recognizedYear: item.recognizedYear ?? null,
    summary: item.summary,
    historyItems: item.history.map((text) => ({ text })),
    highlightItems: item.highlights.map((text) => ({ text })),
    mediaId: item.mediaId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: item.imageAlt,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function historicalSiteFormToPayload(value: HistoricalSiteFormValues): HistoricalSitePayload {
  return {
    name: value.name.trim(),
    rank: value.rank,
    address: value.address.trim(),
    ...(value.recognizedYear === null ? {} : { recognizedYear: value.recognizedYear }),
    summary: value.summary.trim(),
    history: value.historyItems.map((item) => item.text.trim()),
    highlights: value.highlightItems.map((item) => item.text.trim()),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    sortOrder: value.sortOrder,
    isActive: value.isActive,
  };
}

