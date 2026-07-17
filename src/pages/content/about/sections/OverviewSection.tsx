import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Popconfirm, Space, Tooltip, Typography } from 'antd';
import type { JSX } from 'react';
import { Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { ABOUT_LIMITS } from '../../../../types/about';
import type { AboutFormValues } from '../about.schema';

interface OverviewSectionProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  readOnly: boolean;
}

export function OverviewSection({ control, errors, readOnly }: OverviewSectionProps): JSX.Element {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'overview.paragraphs' });

  return (
    <Card title="Tổng quan" className="about-section-card">
      <Form.Item
        label="Tiêu đề mục"
        validateStatus={errors.overview?.title ? 'error' : ''}
        help={errors.overview?.title?.message}
      >
        <Controller
          name="overview.title"
          control={control}
          render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.title} disabled={readOnly} />}
        />
      </Form.Item>

      <Typography.Text strong>Đoạn văn</Typography.Text>
      {errors.overview?.paragraphs?.root?.message && (
        <Alert type="error" showIcon message={errors.overview.paragraphs.root.message} style={{ margin: '8px 0' }} />
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="about-list-row">
          <Form.Item
            style={{ flex: 1, marginBottom: 8 }}
            validateStatus={errors.overview?.paragraphs?.[index]?.text ? 'error' : ''}
            help={errors.overview?.paragraphs?.[index]?.text?.message}
          >
            <Controller
              name={`overview.paragraphs.${index}.text`}
              control={control}
              render={({ field: textField }) => (
                <Input.TextArea {...textField} rows={3} maxLength={ABOUT_LIMITS.longText} disabled={readOnly} />
              )}
            />
          </Form.Item>
          <Space orientation="vertical" size={4}>
            <Tooltip title="Di chuyển lên">
              <Button
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={readOnly || index === 0}
                onClick={() => move(index, index - 1)}
                aria-label="Di chuyển đoạn văn lên"
              />
            </Tooltip>
            <Tooltip title="Di chuyển xuống">
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={readOnly || index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label="Di chuyển đoạn văn xuống"
              />
            </Tooltip>
            <Popconfirm title="Xóa đoạn văn này?" onConfirm={() => remove(index)} disabled={readOnly}>
              <Button size="small" danger type="text" icon={<DeleteOutlined />} disabled={readOnly} aria-label="Xóa đoạn văn" />
            </Popconfirm>
          </Space>
        </div>
      ))}

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={readOnly || fields.length >= ABOUT_LIMITS.maxParagraphs}
        onClick={() => append({ text: '' })}
      >
        Thêm đoạn văn
      </Button>
    </Card>
  );
}
