import { describe, expect, it } from 'vitest';
import type { AgricultureAdminItem } from '../../../../types/agriculture';
import { agricultureFormSchema, agricultureFormToPayload, agricultureToForm } from '../agriculture.schema';

const item: AgricultureAdminItem = {
  id: 'lua-huu-co', version: 2, name: 'Lúa hữu cơ', category: 'Cây trồng chủ lực',
  location: 'Xã Lộc Trung', season: 'Đông Xuân', scale: '50 ha', summary: 'Vùng lúa hữu cơ',
  description: ['Canh tác theo tiêu chuẩn hữu cơ'], highlights: ['Không thuốc hóa học'],
  support: 'Liên hệ hợp tác xã để được hướng dẫn.', mediaId: 'media-1',
  imageUrl: 'https://cdn.test/rice.webp', imageAlt: 'Cánh đồng lúa', sortOrder: 0,
  isActive: true, updatedAt: '2026-07-15T00:00:00.000Z',
};

describe('agriculture schema and mapper', () => {
  it('maps arrays and trims payload while preserving order', () => {
    const form = agricultureToForm(item);
    const payload = agricultureFormToPayload({
      ...form,
      name: '  Lúa hữu cơ  ',
      descriptionItems: [{ text: '  Đoạn hai  ' }, { text: 'Đoạn một' }],
      highlightItems: [{ text: '  Tiết kiệm nước  ' }],
    });
    expect(payload.name).toBe('Lúa hữu cơ');
    expect(payload.description).toEqual(['Đoạn hai', 'Đoạn một']);
    expect(payload.highlights).toEqual(['Tiết kiệm nước']);
  });

  it('requires all business fields, image, support and one description', () => {
    const result = agricultureFormSchema.safeParse({
      ...agricultureToForm(item), location: ' ', season: '', scale: '', support: '',
      mediaId: null, imageUrl: null, descriptionItems: [{ text: ' ' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(expect.arrayContaining([
        'location', 'season', 'scale', 'support', 'imageUrl', 'descriptionItems.0.text',
      ]));
    }
  });

  it('rejects values beyond business limits without mutating input', () => {
    const form = { ...agricultureToForm(item), name: 'x'.repeat(151), support: 'Nội dung đang nhập' };
    expect(agricultureFormSchema.safeParse(form).success).toBe(false);
    expect(form.support).toBe('Nội dung đang nhập');
  });

  it('limits descriptions and highlights to 20 entries', () => {
    const form = agricultureToForm(item);
    expect(agricultureFormSchema.safeParse({ ...form, descriptionItems: Array.from({ length: 21 }, (_, i) => ({ text: `Đoạn ${i}` })) }).success).toBe(false);
    expect(agricultureFormSchema.safeParse({ ...form, highlightItems: Array.from({ length: 21 }, (_, i) => ({ text: `Điểm ${i}` })) }).success).toBe(false);
  });
});
