import { z } from 'zod';
import { ABOUT_LIMITS } from '../../../types/about';

const REQUIRED_ACTIVE_MESSAGE = 'Bắt buộc khi mục này đang hiển thị';

const statusItemFields = {
  id: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
};

const paragraphFieldSchema = z.object({
  text: z.string().trim().max(ABOUT_LIMITS.longText, `Tối đa ${ABOUT_LIMITS.longText} ký tự`),
});

const statisticFieldSchema = z.object({
  ...statusItemFields,
  value: z.string().trim().max(ABOUT_LIMITS.value, `Tối đa ${ABOUT_LIMITS.value} ký tự`),
  unit: z.string().trim().max(ABOUT_LIMITS.unit, `Tối đa ${ABOUT_LIMITS.unit} ký tự`),
  label: z.string().trim().max(ABOUT_LIMITS.label, `Tối đa ${ABOUT_LIMITS.label} ký tự`),
});

const highlightFieldSchema = z.object({
  ...statusItemFields,
  title: z.string().trim().max(ABOUT_LIMITS.label, `Tối đa ${ABOUT_LIMITS.label} ký tự`),
  description: z.string().trim().max(ABOUT_LIMITS.longText, `Tối đa ${ABOUT_LIMITS.longText} ký tự`),
  mediaId: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().trim().max(ABOUT_LIMITS.alt, `Tối đa ${ABOUT_LIMITS.alt} ký tự`),
});

const milestoneFieldSchema = z.object({
  ...statusItemFields,
  year: z.string().trim().max(30, 'Tối đa 30 ký tự'),
  title: z.string().trim().max(ABOUT_LIMITS.label, `Tối đa ${ABOUT_LIMITS.label} ký tự`).optional(),
  description: z.string().trim().max(ABOUT_LIMITS.longText, `Tối đa ${ABOUT_LIMITS.longText} ký tự`),
});

const heroFieldSchema = z.object({
  mediaId: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().trim().max(ABOUT_LIMITS.alt, `Tối đa ${ABOUT_LIMITS.alt} ký tự`),
});

export const aboutFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Bắt buộc').max(ABOUT_LIMITS.title, `Tối đa ${ABOUT_LIMITS.title} ký tự`),
    hero: heroFieldSchema,
    overview: z.object({
      title: z.string().trim().min(1, 'Bắt buộc').max(ABOUT_LIMITS.title, `Tối đa ${ABOUT_LIMITS.title} ký tự`),
      paragraphs: z.array(paragraphFieldSchema).max(ABOUT_LIMITS.maxParagraphs, `Tối đa ${ABOUT_LIMITS.maxParagraphs} đoạn`),
    }),
    statistics: z.array(statisticFieldSchema).max(ABOUT_LIMITS.maxStatistics, `Tối đa ${ABOUT_LIMITS.maxStatistics} chỉ số`),
    highlightsSectionTitle: z
      .string()
      .trim()
      .min(1, 'Bắt buộc')
      .max(ABOUT_LIMITS.title, `Tối đa ${ABOUT_LIMITS.title} ký tự`),
    highlights: z.array(highlightFieldSchema).max(ABOUT_LIMITS.maxHighlights, `Tối đa ${ABOUT_LIMITS.maxHighlights} điểm nổi bật`),
    milestonesSectionTitle: z
      .string()
      .trim()
      .min(1, 'Bắt buộc')
      .max(ABOUT_LIMITS.title, `Tối đa ${ABOUT_LIMITS.title} ký tự`),
    milestones: z.array(milestoneFieldSchema).max(ABOUT_LIMITS.maxMilestones, `Tối đa ${ABOUT_LIMITS.maxMilestones} dấu mốc`),
  })
  .superRefine((values, ctx) => {
    if (!values.hero.mediaId && !values.hero.imageUrl) {
      ctx.addIssue({ code: 'custom', path: ['hero', 'imageUrl'], message: 'Vui lòng chọn ảnh hero' });
    }

    if (values.overview.paragraphs.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['overview', 'paragraphs'], message: 'Cần ít nhất một đoạn văn' });
    }
    values.overview.paragraphs.forEach((paragraph, index) => {
      if (!paragraph.text) {
        ctx.addIssue({ code: 'custom', path: ['overview', 'paragraphs', index, 'text'], message: 'Không được để trống' });
      }
    });

    values.statistics.forEach((stat, index) => {
      if (!stat.isActive) return;
      if (!stat.value) ctx.addIssue({ code: 'custom', path: ['statistics', index, 'value'], message: REQUIRED_ACTIVE_MESSAGE });
      if (!stat.unit) ctx.addIssue({ code: 'custom', path: ['statistics', index, 'unit'], message: REQUIRED_ACTIVE_MESSAGE });
      if (!stat.label) ctx.addIssue({ code: 'custom', path: ['statistics', index, 'label'], message: REQUIRED_ACTIVE_MESSAGE });
    });

    values.highlights.forEach((highlight, index) => {
      if (!highlight.isActive) return;
      if (!highlight.title) {
        ctx.addIssue({ code: 'custom', path: ['highlights', index, 'title'], message: REQUIRED_ACTIVE_MESSAGE });
      }
      if (!highlight.description) {
        ctx.addIssue({ code: 'custom', path: ['highlights', index, 'description'], message: REQUIRED_ACTIVE_MESSAGE });
      }
      if (!highlight.imageAlt) {
        ctx.addIssue({ code: 'custom', path: ['highlights', index, 'imageAlt'], message: REQUIRED_ACTIVE_MESSAGE });
      }
      if (!highlight.mediaId && !highlight.imageUrl) {
        ctx.addIssue({ code: 'custom', path: ['highlights', index, 'imageUrl'], message: REQUIRED_ACTIVE_MESSAGE });
      }
    });

    values.milestones.forEach((milestone, index) => {
      if (!milestone.isActive) return;
      if (!milestone.year) {
        ctx.addIssue({ code: 'custom', path: ['milestones', index, 'year'], message: REQUIRED_ACTIVE_MESSAGE });
      }
      if (!milestone.description) {
        ctx.addIssue({ code: 'custom', path: ['milestones', index, 'description'], message: REQUIRED_ACTIVE_MESSAGE });
      }
    });
  });

export type AboutFormValues = z.infer<typeof aboutFormSchema>;
