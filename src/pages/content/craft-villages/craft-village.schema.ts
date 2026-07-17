import { z } from 'zod';
import type { CraftVillageAdminItem, CraftVillagePayload } from '../../../types/craft-village';

const paragraphSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(5000, 'Tối đa 5.000 ký tự') });
const highlightSchema = z.object({ text: z.string().trim().min(1, 'Không được để trống').max(200, 'Tối đa 200 ký tự') });

export const craftVillageFormSchema = z.object({
  name: z.string().trim().min(1, 'Bắt buộc').max(150, 'Tối đa 150 ký tự'),
  category: z.enum(['Thủ công truyền thống', 'Chế biến nông sản', 'Dịch vụ trải nghiệm', 'Sản phẩm gia đình']),
  address: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
  workingTime: z.string().trim().min(1, 'Bắt buộc').max(100, 'Tối đa 100 ký tự'),
  mainProducts: z.string().trim().min(1, 'Bắt buộc').max(255, 'Tối đa 255 ký tự'),
  summary: z.string().trim().min(1, 'Bắt buộc').max(300, 'Tối đa 300 ký tự'),
  descriptions: z.array(paragraphSchema).min(1, 'Cần ít nhất một đoạn').max(20, 'Tối đa 20 đoạn'),
  highlights: z.array(highlightSchema).max(20, 'Tối đa 20 điểm nổi bật'),
  visitorNote: z.string().trim().max(2000, 'Tối đa 2.000 ký tự'),
  mediaId: z.string().nullable().optional(), imageUrl: z.string().nullable().optional(),
  imageAlt: z.string().trim().max(150, 'Tối đa 150 ký tự'), isActive: z.boolean(), sortOrder: z.number().int().min(0),
}).superRefine((value, context) => {
  if (!value.mediaId && !value.imageUrl) context.addIssue({ code: 'custom', path: ['imageUrl'], message: 'Vui lòng chọn ảnh đại diện' });
});

export type CraftVillageFormValues = z.infer<typeof craftVillageFormSchema>;
export const EMPTY_CRAFT_VILLAGE_FORM: CraftVillageFormValues = {
  name:'', category:'Thủ công truyền thống', address:'', workingTime:'', mainProducts:'', summary:'',
  descriptions:[{ text:'' }], highlights:[], visitorNote:'', mediaId:null, imageUrl:null, imageAlt:'', isActive:true, sortOrder:0,
};
export function craftVillageToForm(item: CraftVillageAdminItem): CraftVillageFormValues {
  return { name:item.name, category:item.category, address:item.address, workingTime:item.workingTime, mainProducts:item.mainProducts,
    summary:item.summary, descriptions:item.description.map((text) => ({ text })), highlights:item.highlights.map((text) => ({ text })),
    visitorNote:item.visitorNote, mediaId:item.mediaId, imageUrl:item.imageUrl, imageAlt:item.imageAlt, isActive:item.isActive, sortOrder:item.sortOrder };
}
export function formToCraftVillagePayload(value: CraftVillageFormValues): CraftVillagePayload {
  return { name:value.name.trim(), category:value.category, address:value.address.trim(), workingTime:value.workingTime.trim(),
    mainProducts:value.mainProducts.trim(), summary:value.summary.trim(), description:value.descriptions.map((item) => item.text.trim()),
    highlights:value.highlights.map((item) => item.text.trim()), visitorNote:value.visitorNote.trim(), mediaId:value.mediaId,
    imageAlt:value.imageAlt.trim(), isActive:value.isActive, sortOrder:value.sortOrder };
}
