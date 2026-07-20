import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Col, Form, Input, InputNumber, Modal, Row, Switch } from 'antd';
import type { JSX } from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApiError } from '../../types/api';
import type { CreateTradePostCategoryInput } from '../../types/trade-post-category';
import { getApiFieldError } from '../../utils/api-field-error';

const tradePostCategoryFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập mã danh mục')
    .max(50, 'Mã danh mục không được vượt quá 50 ký tự')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Chỉ chữ thường, số và dấu gạch ngang',
    ),
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên danh mục')
    .max(120, 'Tên danh mục không được vượt quá 120 ký tự'),
  description: z.string().trim().max(1000, 'Mô tả không được vượt quá 1.000 ký tự'),
  sortOrder: z.number().int('Thứ tự phải là số nguyên').min(0, 'Thứ tự không được nhỏ hơn 0'),
  requiresPromotionDetails: z.boolean(),
  isActive: z.boolean(),
});

export type TradePostCategoryFormValues = z.infer<typeof tradePostCategoryFormSchema>;

const DEFAULT_VALUES: TradePostCategoryFormValues = {
  code: '',
  name: '',
  description: '',
  sortOrder: 0,
  requiresPromotionDetails: false,
  isActive: true,
};

interface Props {
  open: boolean;
  confirmLoading: boolean;
  serverError?: unknown;
  onCancel: () => void;
  onSubmit: (input: CreateTradePostCategoryInput) => void;
}

function describeServerError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Không thể tạo danh mục. Vui lòng thử lại.';

  const detailMessages = (error.details ?? []).flatMap((detail) => {
    if (typeof detail === 'string') return detail.trim() ? [detail] : [];
    if (!detail || typeof detail !== 'object') return [];
    const message = (detail as { message?: unknown }).message;
    return typeof message === 'string' && message.trim() ? [message] : [];
  });

  return detailMessages.length > 0 ? detailMessages.join('; ') : error.message;
}

export function TradePostCategoryFormModal({
  open,
  confirmLoading,
  serverError,
  onCancel,
  onSubmit,
}: Props): JSX.Element {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TradePostCategoryFormValues>({
    resolver: zodResolver(tradePostCategoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open) reset(DEFAULT_VALUES);
  }, [open, reset]);

  useEffect(() => {
    if (!serverError) return;

    const fields: Array<keyof TradePostCategoryFormValues> = [
      'code',
      'name',
      'description',
      'sortOrder',
      'requiresPromotionDetails',
      'isActive',
    ];
    for (const field of fields) {
      const fieldError = getApiFieldError(serverError, field, 'Giá trị không hợp lệ');
      if (fieldError) setError(field, { type: 'server', message: fieldError });
    }
  }, [serverError, setError]);

  const submit = (values: TradePostCategoryFormValues): void => {
    onSubmit({
      code: values.code.trim(),
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      sortOrder: values.sortOrder,
      requiresPromotionDetails: values.requiresPromotionDetails,
      isActive: values.isActive,
    });
  };

  return (
    <Modal
      title="Tạo danh mục tin giao thương"
      open={open}
      width={600}
      okText="Tạo danh mục"
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      mask={{ closable: !confirmLoading }}
      keyboard={!confirmLoading}
      cancelButtonProps={{ disabled: confirmLoading }}
      onCancel={onCancel}
      onOk={() => void handleSubmit(submit)()}
    >
      {serverError != null && (
        <Alert
          type="error"
          showIcon
          title="Không thể tạo danh mục"
          description={describeServerError(serverError)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical">
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Mã danh mục"
              required
              validateStatus={errors.code ? 'error' : undefined}
              help={errors.code?.message ?? 'Chỉ chữ thường, số và dấu gạch ngang.'}
            >
              <Input
                {...field}
                autoFocus
                maxLength={50}
                placeholder="cay-an-trai"
                onChange={(event) => field.onChange(
                  event.target.value.toLowerCase().replace(/[\s_]+/g, '-'),
                )}
              />
            </Form.Item>
          )}
        />

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Tên danh mục"
              required
              validateStatus={errors.name ? 'error' : undefined}
              help={errors.name?.message}
            >
              <Input {...field} maxLength={120} showCount placeholder="Cây ăn trái" />
            </Form.Item>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Mô tả"
              validateStatus={errors.description ? 'error' : undefined}
              help={errors.description?.message}
            >
              <Input.TextArea
                {...field}
                rows={3}
                maxLength={1000}
                showCount
                placeholder="Mô tả ngắn về loại tin thuộc danh mục"
              />
            </Form.Item>
          )}
        />

        <Row gutter={24}>
          <Col xs={24} sm={8}>
            <Controller
              name="sortOrder"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Thứ tự hiển thị"
                  required
                  validateStatus={errors.sortOrder ? 'error' : undefined}
                  help={errors.sortOrder?.message}
                >
                  <InputNumber {...field} min={0} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Controller
              name="requiresPromotionDetails"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Chi tiết khuyến mãi"
                  tooltip="Bắt buộc người đăng nhập phần trăm và thời gian khuyến mãi."
                  validateStatus={errors.requiresPromotionDetails ? 'error' : undefined}
                  help={errors.requiresPromotionDetails?.message}
                >
                  <Switch
                    checked={field.value}
                    checkedChildren="Bắt buộc"
                    unCheckedChildren="Không"
                    onChange={field.onChange}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Trạng thái"
                  validateStatus={errors.isActive ? 'error' : undefined}
                  help={errors.isActive?.message}
                >
                  <Switch
                    checked={field.value}
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Ngừng"
                    onChange={field.onChange}
                  />
                </Form.Item>
              )}
            />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
