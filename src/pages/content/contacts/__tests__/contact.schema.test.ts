import { describe, expect, it } from 'vitest';
import { contactFormSchema, contactFormToPayload, EMPTY_CONTACT_FORM } from '../contact.schema';

describe('contactFormSchema', () => {
  it('blocks invalid phone and email formats', () => {
    const result = contactFormSchema.safeParse({
      ...EMPTY_CONTACT_FORM,
      name: 'UBND xã',
      role: 'Tiếp nhận thủ tục',
      phone: 'abc-123',
      email: 'email-sai',
      address: 'Trung tâm xã',
      workingTime: '07:30 - 17:00',
      summary: 'Tóm tắt',
      descriptionItems: [{ text: 'Mô tả' }],
      mediaId: 'media-1',
    });

    expect(result.success).toBe(false);
  });

  it('trims payload and omits empty optional email', () => {
    const payload = contactFormToPayload({
      ...EMPTY_CONTACT_FORM,
      name: '  UBND xã  ',
      role: ' Tiếp nhận thủ tục ',
      phone: ' +84 123 456 ',
      email: '   ',
      address: ' Trung tâm xã ',
      workingTime: ' 07:30 - 17:00 ',
      summary: ' Tóm tắt ',
      descriptionItems: [{ text: ' Mô tả 1 ' }],
      supportTopicItems: [{ text: ' Hỗ trợ ' }],
      mediaId: 'media-1',
    });

    expect(payload).toEqual(expect.objectContaining({
      name: 'UBND xã',
      phone: '+84 123 456',
      description: ['Mô tả 1'],
      supportTopics: ['Hỗ trợ'],
    }));
    expect(payload).not.toHaveProperty('email');
  });
});
