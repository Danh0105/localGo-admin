import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { TempleFormValues } from './temple.schema';

interface Props {
  open: boolean;
  values: TempleFormValues;
  onClose: () => void;
}

export function TemplePreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
      <div className="temple-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.type}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên địa điểm'}</Typography.Title>
        <Typography.Paragraph type="secondary">{values.address || 'Địa chỉ'}</Typography.Paragraph>
        <Typography.Paragraph>{values.openHours}</Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Giới thiệu</Typography.Title>
        {values.descriptions.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Lễ hội - Sự kiện</Typography.Title>
        {values.events.length === 0 ? <Typography.Text type="secondary">Chưa có sự kiện</Typography.Text> : values.events.map((event, index) => (
          <Typography.Paragraph key={event.id ?? index}><strong>{event.time}</strong> — {event.name}</Typography.Paragraph>
        ))}
      </div>
    </Drawer>
  );
}
