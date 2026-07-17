import { Card, Form, Input } from 'antd';
import type { JSX } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { ABOUT_LIMITS } from '../../../../types/about';
import type { AboutFormValues } from '../about.schema';
import { ImageUploadField } from '../ImageUploadField';

interface HeroSectionProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  readOnly: boolean;
}

export function HeroSection({ control, errors, readOnly }: HeroSectionProps): JSX.Element {
  return (
    <Card title="Hero" className="about-section-card">
      <Form.Item label="Tiêu đề trang" validateStatus={errors.title ? 'error' : ''} help={errors.title?.message}>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Input {...field} maxLength={ABOUT_LIMITS.title} showCount disabled={readOnly} placeholder="VD: Về LocalGo" />
          )}
        />
      </Form.Item>

      <Controller
        name="hero"
        control={control}
        render={({ field }) => (
          <>
            <Form.Item
              label="Ảnh nền hero"
              validateStatus={errors.hero?.imageUrl ? 'error' : ''}
            >
              <ImageUploadField
                label="ảnh hero"
                imageUrl={field.value.imageUrl}
                alt={field.value.imageAlt}
                disabled={readOnly}
                hint="Khuyến nghị tỉ lệ 16:9, tối thiểu 1200×675px để hiển thị sắc nét trên hero mobile."
                errorMessage={errors.hero?.imageUrl?.message}
                errorId="hero-image-error"
                onUploaded={(result) =>
                  field.onChange({ ...field.value, mediaId: result.mediaId, imageUrl: result.imageUrl })
                }
                onRemove={() => field.onChange({ ...field.value, mediaId: undefined, imageUrl: undefined })}
              />
            </Form.Item>
            <Form.Item
              label="Alt text ảnh hero"
              validateStatus={errors.hero?.imageAlt ? 'error' : ''}
              help={errors.hero?.imageAlt?.message}
            >
              <Input
                value={field.value.imageAlt}
                onChange={(event) => field.onChange({ ...field.value, imageAlt: event.target.value })}
                maxLength={ABOUT_LIMITS.alt}
                disabled={readOnly}
                placeholder="Mô tả ngắn gọn nội dung ảnh cho người dùng khiếm thị"
                aria-describedby="hero-image-error"
              />
            </Form.Item>
          </>
        )}
      />
    </Card>
  );
}
