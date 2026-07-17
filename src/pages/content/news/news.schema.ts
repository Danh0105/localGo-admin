import { z } from 'zod';
import type { NewsAdminArticle, NewsPayload } from '../../../types/news';
import { NEWS_CATEGORIES } from '../../../types/news';

const paragraphSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự'),
});

const shortTextSchema = z.object({
  text: z.string().trim().min(1, 'Không được để trống').max(100, 'Tối đa 100 ký tự'),
});

export const newsFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Bắt buộc').max(200, 'Tối đa 200 ký tự'),
    category: z.enum(NEWS_CATEGORIES),
    publishedAt: z.string().trim().min(1, 'Bắt buộc'),
    author: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
    summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
    contentItems: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn nội dung').max(30, 'Tối đa 30 đoạn'),
    tagItems: z.array(shortTextSchema).max(15, 'Tối đa 15 từ khóa'),
    relatedItems: z.array(shortTextSchema).max(15, 'Tối đa 15 mục liên quan'),
    mediaId: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    imageAlt: z.string().trim().max(150, 'Tối đa 150 ký tự'),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!Number.isFinite(Date.parse(value.publishedAt))) {
      context.addIssue({ code: 'custom', path: ['publishedAt'], message: 'Ngày đăng chưa hợp lệ' });
    }
    if (!value.mediaId && !value.imageUrl) {
      context.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Vui lòng chọn ảnh đại diện' });
    }
  });

export type NewsFormValues = z.infer<typeof newsFormSchema>;

export const EMPTY_NEWS_FORM: NewsFormValues = {
  title: '',
  category: 'Thông báo',
  publishedAt: new Date().toISOString(),
  author: '',
  summary: '',
  contentItems: [{ text: '' }],
  tagItems: [],
  relatedItems: [],
  mediaId: null,
  imageUrl: null,
  imageAlt: '',
  isActive: true,
};

export function newsToForm(article: NewsAdminArticle): NewsFormValues {
  return {
    title: article.title,
    category: article.category,
    publishedAt: article.publishedAt,
    author: article.author,
    summary: article.summary,
    contentItems: article.content.map((text) => ({ text })),
    tagItems: article.tags.map((text) => ({ text })),
    relatedItems: article.relatedLinks.map((text) => ({ text })),
    mediaId: article.mediaId ?? null,
    imageUrl: article.imageUrl ?? null,
    imageAlt: article.imageAlt,
    isActive: article.isActive,
  };
}

export function newsFormToPayload(value: NewsFormValues): NewsPayload {
  return {
    title: value.title.trim(),
    category: value.category,
    publishedAt: new Date(value.publishedAt).toISOString(),
    author: value.author.trim(),
    summary: value.summary.trim(),
    content: value.contentItems.map((item) => item.text.trim()),
    tags: value.tagItems.map((item) => item.text.trim()),
    relatedLinks: value.relatedItems.map((item) => item.text.trim()),
    mediaId: value.mediaId,
    imageAlt: value.imageAlt.trim(),
    isActive: value.isActive,
  };
}
