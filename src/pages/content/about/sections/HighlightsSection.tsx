import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Collapse, Form, Input, Popconfirm, Space, Switch, Tag, Tooltip } from 'antd';
import type { JSX } from 'react';
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { useState } from 'react';
import { ABOUT_LIMITS } from '../../../../types/about';
import type { AboutFormValues } from '../about.schema';
import { createEmptyHighlight } from '../about.mapper';
import { ImageUploadField } from '../ImageUploadField';

interface HighlightsSectionProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  setValue: UseFormSetValue<AboutFormValues>;
  readOnly: boolean;
}

function HighlightPanelHeader({ control, index }: { control: Control<AboutFormValues>; index: number }): JSX.Element {
  const title = useWatch({ control, name: `highlights.${index}.title` });
  const isActive = useWatch({ control, name: `highlights.${index}.isActive` });
  return (
    <Space>
      <span>{title?.trim() ? title : `Điểm nổi bật #${index + 1}`}</span>
      <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Hiển thị' : 'Đang ẩn'}</Tag>
    </Space>
  );
}

interface HighlightPanelBodyProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  setValue: UseFormSetValue<AboutFormValues>;
  index: number;
  readOnly: boolean;
}

function HighlightPanelBody({ control, errors, setValue, index, readOnly }: HighlightPanelBodyProps): JSX.Element {
  const imageUrl = useWatch({ control, name: `highlights.${index}.imageUrl` });
  const imageAlt = useWatch({ control, name: `highlights.${index}.imageAlt` });

  return (
    <div>
      <Form.Item label="Ảnh" validateStatus={errors.highlights?.[index]?.imageUrl ? 'error' : ''}>
        <ImageUploadField
          label="ảnh điểm nổi bật"
          imageUrl={imageUrl}
          alt={imageAlt ?? ''}
          disabled={readOnly}
          errorMessage={errors.highlights?.[index]?.imageUrl?.message}
          onUploaded={(result) => {
            setValue(`highlights.${index}.mediaId`, result.mediaId, { shouldDirty: true });
            setValue(`highlights.${index}.imageUrl`, result.imageUrl, { shouldDirty: true });
          }}
          onRemove={() => {
            setValue(`highlights.${index}.mediaId`, undefined, { shouldDirty: true });
            setValue(`highlights.${index}.imageUrl`, undefined, { shouldDirty: true });
          }}
        />
      </Form.Item>
      <Form.Item
        label="Alt text"
        validateStatus={errors.highlights?.[index]?.imageAlt ? 'error' : ''}
        help={errors.highlights?.[index]?.imageAlt?.message}
      >
        <Controller
          name={`highlights.${index}.imageAlt`}
          control={control}
          render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.alt} disabled={readOnly} />}
        />
      </Form.Item>
      <Form.Item
        label="Tiêu đề"
        validateStatus={errors.highlights?.[index]?.title ? 'error' : ''}
        help={errors.highlights?.[index]?.title?.message}
      >
        <Controller
          name={`highlights.${index}.title`}
          control={control}
          render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.label} disabled={readOnly} />}
        />
      </Form.Item>
      <Form.Item
        label="Mô tả"
        validateStatus={errors.highlights?.[index]?.description ? 'error' : ''}
        help={errors.highlights?.[index]?.description?.message}
      >
        <Controller
          name={`highlights.${index}.description`}
          control={control}
          render={({ field }) => <Input.TextArea {...field} rows={3} maxLength={ABOUT_LIMITS.longText} disabled={readOnly} />}
        />
      </Form.Item>
      <Form.Item label="Hiển thị">
        <Controller
          name={`highlights.${index}.isActive`}
          control={control}
          render={({ field }) => <Switch checked={field.value} onChange={field.onChange} disabled={readOnly} />}
        />
      </Form.Item>
    </div>
  );
}

export function HighlightsSection({ control, errors, setValue, readOnly }: HighlightsSectionProps): JSX.Element {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'highlights' });
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  return (
    <Card title="Điểm nổi bật" className="about-section-card">
      <Form.Item
        label="Tiêu đề mục"
        validateStatus={errors.highlightsSectionTitle ? 'error' : ''}
        help={errors.highlightsSectionTitle?.message}
      >
        <Controller
          name="highlightsSectionTitle"
          control={control}
          render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.title} disabled={readOnly} />}
        />
      </Form.Item>

      <Collapse
        activeKey={activeKeys}
        onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
        items={fields.map((field, index) => ({
          key: field.id,
          label: <HighlightPanelHeader control={control} index={index} />,
          extra: (
            <Space size={4} onClick={(event) => event.stopPropagation()}>
              <Tooltip title="Di chuyển lên">
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowUpOutlined />}
                  disabled={readOnly || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Di chuyển điểm nổi bật lên"
                />
              </Tooltip>
              <Tooltip title="Di chuyển xuống">
                <Button
                  size="small"
                  type="text"
                  icon={<ArrowDownOutlined />}
                  disabled={readOnly || index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Di chuyển điểm nổi bật xuống"
                />
              </Tooltip>
              <Popconfirm title="Xóa điểm nổi bật này?" onConfirm={() => remove(index)} disabled={readOnly}>
                <Button size="small" danger type="text" icon={<DeleteOutlined />} disabled={readOnly} aria-label="Xóa điểm nổi bật" />
              </Popconfirm>
            </Space>
          ),
          children: <HighlightPanelBody control={control} errors={errors} setValue={setValue} index={index} readOnly={readOnly} />,
        }))}
      />

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 12 }}
        disabled={readOnly || fields.length >= ABOUT_LIMITS.maxHighlights}
        onClick={() => {
          const item = createEmptyHighlight();
          append(item);
          setActiveKeys((keys) => [...keys, item.id]);
        }}
      >
        Thêm điểm nổi bật
      </Button>
    </Card>
  );
}
