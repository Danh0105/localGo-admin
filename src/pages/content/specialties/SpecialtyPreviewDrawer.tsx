import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { SpecialtyFormValues } from './specialty.schema';

interface Props {
  open: boolean;
  values: SpecialtyFormValues;
  onClose: () => void;
}

export function SpecialtyPreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
      <div className="specialty-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên đặc sản'}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {values.price || 'Giá'} · Mùa vụ: {values.season || '—'}
        </Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
        {values.descriptions.map((item, index) => (
          <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>
        ))}
        <Typography.Title level={4}>Địa điểm mua</Typography.Title>
        {values.buyPlaces.length === 0 ? (
          <Typography.Text type="secondary">Chưa có địa điểm</Typography.Text>
        ) : (
          <ul>
            {values.buyPlaces.map((item, index) => (
              <li key={index}>{item.text}</li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
