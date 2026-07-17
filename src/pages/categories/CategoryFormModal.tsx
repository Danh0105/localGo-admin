import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Input, InputNumber, Modal, Select } from 'antd';
import type { JSX } from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { CATEGORY_DOMAINS, CATEGORY_DOMAIN_LABEL, type Category } from '../../types/category';

const categorySchema = z.object({
  domain: z.enum(CATEGORY_DOMAINS),
  slug: z
    .string()
    .min(1, 'Bắt buộc')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Chỉ chữ thường, số và dấu gạch ngang'),
  name: z.string().min(1, 'Bắt buộc').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  initialValues?: Category | null;
  defaultDomain: (typeof CATEGORY_DOMAINS)[number];
  /** When true, the domain field is always disabled (e.g. a page dedicated to a single domain). */
  lockDomain?: boolean;
  confirmLoading: boolean;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => void;
}

const DOMAIN_OPTIONS = CATEGORY_DOMAINS.map((domain) => ({
  value: domain,
  label: CATEGORY_DOMAIN_LABEL[domain],
}));

export function CategoryFormModal({
  open,
  initialValues,
  defaultDomain,
  lockDomain,
  confirmLoading,
  onCancel,
  onSubmit,
}: Props): JSX.Element {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      domain: defaultDomain,
      slug: '',
      name: '',
      description: '',
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        initialValues
          ? {
              domain: initialValues.domain as CategoryFormValues['domain'],
              slug: initialValues.slug,
              name: initialValues.name,
              description: initialValues.description ?? '',
              sortOrder: initialValues.sortOrder,
            }
          : { domain: defaultDomain, slug: '', name: '', description: '', sortOrder: 0 },
      );
    }
  }, [open, initialValues, defaultDomain, reset]);

  return (
    <Modal
      title={initialValues ? 'Sửa danh mục' : 'Tạo danh mục mới'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleSubmit(onSubmit)()}
      confirmLoading={confirmLoading}
      okText={initialValues ? 'Lưu' : 'Tạo'}
    >
      <Form layout="vertical">
        <Form.Item label="Domain" validateStatus={errors.domain ? 'error' : ''} help={errors.domain?.message}>
          <Controller
            name="domain"
            control={control}
            render={({ field }) => (
              <Select {...field} options={DOMAIN_OPTIONS} disabled={!!initialValues || lockDomain} />
            )}
          />
        </Form.Item>
        <Form.Item label="Slug" validateStatus={errors.slug ? 'error' : ''} help={errors.slug?.message}>
          <Controller
            name="slug"
            control={control}
            render={({ field }) => <Input {...field} placeholder="cay-an-trai" />}
          />
        </Form.Item>
        <Form.Item label="Tên" validateStatus={errors.name ? 'error' : ''} help={errors.name?.message}>
          <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item label="Mô tả">
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Form.Item label="Thứ tự hiển thị">
          <Controller
            name="sortOrder"
            control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} style={{ width: '100%' }} />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
