import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Popconfirm, Space, Switch, Table, Tooltip } from 'antd';
import type { JSX } from 'react';
import { Controller, useFieldArray, type Control, type FieldErrors } from 'react-hook-form';
import { ABOUT_LIMITS } from '../../../../types/about';
import type { AboutFormValues } from '../about.schema';
import { createEmptyStatistic } from '../about.mapper';

interface StatisticsSectionProps {
  control: Control<AboutFormValues>;
  errors: FieldErrors<AboutFormValues>;
  readOnly: boolean;
}

export function StatisticsSection({ control, errors, readOnly }: StatisticsSectionProps): JSX.Element {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'statistics' });

  return (
    <Card title="Các chỉ số" className="about-section-card">
      <Table
        rowKey="id"
        dataSource={fields}
        pagination={false}
        size="small"
        locale={{ emptyText: 'Chưa có chỉ số nào' }}
        columns={[
          {
            title: 'Giá trị',
            key: 'value',
            width: 150,
            render: (_, __, index) => (
              <Form.Item
                style={{ marginBottom: 0 }}
                validateStatus={errors.statistics?.[index]?.value ? 'error' : ''}
                help={errors.statistics?.[index]?.value?.message}
              >
                <Controller
                  name={`statistics.${index}.value`}
                  control={control}
                  render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.value} disabled={readOnly} />}
                />
              </Form.Item>
            ),
          },
          {
            title: 'Đơn vị',
            key: 'unit',
            width: 120,
            render: (_, __, index) => (
              <Form.Item
                style={{ marginBottom: 0 }}
                validateStatus={errors.statistics?.[index]?.unit ? 'error' : ''}
                help={errors.statistics?.[index]?.unit?.message}
              >
                <Controller
                  name={`statistics.${index}.unit`}
                  control={control}
                  render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.unit} disabled={readOnly} />}
                />
              </Form.Item>
            ),
          },
          {
            title: 'Nhãn',
            key: 'label',
            render: (_, __, index) => (
              <Form.Item
                style={{ marginBottom: 0 }}
                validateStatus={errors.statistics?.[index]?.label ? 'error' : ''}
                help={errors.statistics?.[index]?.label?.message}
              >
                <Controller
                  name={`statistics.${index}.label`}
                  control={control}
                  render={({ field }) => <Input {...field} maxLength={ABOUT_LIMITS.label} disabled={readOnly} />}
                />
              </Form.Item>
            ),
          },
          {
            title: 'Hiển thị',
            key: 'isActive',
            width: 90,
            align: 'center',
            render: (_, __, index) => (
              <Controller
                name={`statistics.${index}.isActive`}
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={readOnly}
                    aria-label="Hiển thị chỉ số này"
                  />
                )}
              />
            ),
          },
          {
            title: 'Thao tác',
            key: 'actions',
            width: 130,
            render: (_, __, index) => (
              <Space size={4}>
                <Tooltip title="Di chuyển lên">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowUpOutlined />}
                    disabled={readOnly || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label="Di chuyển chỉ số lên"
                  />
                </Tooltip>
                <Tooltip title="Di chuyển xuống">
                  <Button
                    size="small"
                    type="text"
                    icon={<ArrowDownOutlined />}
                    disabled={readOnly || index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Di chuyển chỉ số xuống"
                  />
                </Tooltip>
                <Popconfirm title="Xóa chỉ số này?" onConfirm={() => remove(index)} disabled={readOnly}>
                  <Button size="small" danger type="text" icon={<DeleteOutlined />} disabled={readOnly} aria-label="Xóa chỉ số" />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 12 }}
        disabled={readOnly || fields.length >= ABOUT_LIMITS.maxStatistics}
        onClick={() => append(createEmptyStatistic())}
      >
        Thêm chỉ số
      </Button>
    </Card>
  );
}
