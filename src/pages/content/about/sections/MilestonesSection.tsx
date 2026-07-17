import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Popconfirm, Space, Switch, Tooltip } from 'antd';
import type { JSX } from 'react';
import { Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { ABOUT_LIMITS } from '../../../../types/about';
import type { AboutFormValues } from '../about.schema';
import { createEmptyMilestone } from '../about.mapper';

interface MilestonesSectionProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  readOnly: boolean;
}

export function MilestonesSection({ control, errors, readOnly }: MilestonesSectionProps): JSX.Element {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'milestones' });

  return (
    <Card title="Dấu mốc phát triển" className="about-section-card">
      <Form.Item
        label="Tiêu đề mục"
        validateStatus={errors.milestonesSectionTitle ? 'error' : ''}
        help={errors.milestonesSectionTitle?.message}
      >
        <Controller
          name="milestonesSectionTitle"
          control={control}
          render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.title} disabled={readOnly} />}
        />
      </Form.Item>

      {fields.map((field, index) => (
        <div key={field.id} className="about-milestone-row">
          <div className="about-milestone-row__fields">
            <Form.Item
              label="Năm/Thời điểm"
              validateStatus={errors.milestones?.[index]?.year ? 'error' : ''}
              help={errors.milestones?.[index]?.year?.message}
            >
              <Controller
                name={`milestones.${index}.year`}
                control={control}
                render={({ field: yearField }) => (
                  <Input {...yearField} maxLength={30} disabled={readOnly} style={{ width: 160 }} placeholder="VD: 2024" />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Tiêu đề (tùy chọn)"
              validateStatus={errors.milestones?.[index]?.title ? 'error' : ''}
              help={errors.milestones?.[index]?.title?.message}
            >
              <Controller
                name={`milestones.${index}.title`}
                control={control}
                render={({ field: titleField }) => (
                  <Input {...titleField} maxLength={ABOUT_LIMITS.label} disabled={readOnly} />
                )}
              />
            </Form.Item>
            <Form.Item
              label="Nội dung"
              validateStatus={errors.milestones?.[index]?.description ? 'error' : ''}
              help={errors.milestones?.[index]?.description?.message}
            >
              <Controller
                name={`milestones.${index}.description`}
                control={control}
                render={({ field: descField }) => (
                  <Input.TextArea {...descField} rows={2} maxLength={ABOUT_LIMITS.longText} disabled={readOnly} />
                )}
              />
            </Form.Item>
            <Form.Item label="Hiển thị">
              <Controller
                name={`milestones.${index}.isActive`}
                control={control}
                render={({ field: activeField }) => (
                  <Switch checked={activeField.value} onChange={activeField.onChange} disabled={readOnly} />
                )}
              />
            </Form.Item>
          </div>
          <Space orientation="vertical" size={4}>
            <Tooltip title="Di chuyển lên">
              <Button
                size="small"
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={readOnly || index === 0}
                onClick={() => move(index, index - 1)}
                aria-label="Di chuyển dấu mốc lên"
              />
            </Tooltip>
            <Tooltip title="Di chuyển xuống">
              <Button
                size="small"
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={readOnly || index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                aria-label="Di chuyển dấu mốc xuống"
              />
            </Tooltip>
            <Popconfirm title="Xóa dấu mốc này?" onConfirm={() => remove(index)} disabled={readOnly}>
              <Button size="small" danger type="text" icon={<DeleteOutlined />} disabled={readOnly} aria-label="Xóa dấu mốc" />
            </Popconfirm>
          </Space>
        </div>
      ))}

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        disabled={readOnly || fields.length >= ABOUT_LIMITS.maxMilestones}
        onClick={() => append(createEmptyMilestone())}
      >
        Thêm dấu mốc
      </Button>
    </Card>
  );
}
