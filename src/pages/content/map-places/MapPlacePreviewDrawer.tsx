import { ClockCircleOutlined, CompassOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { MapPlaceFormValues } from './map-place.schema';

interface Props {
  open: boolean;
  values: MapPlaceFormValues;
  onClose: () => void;
}

export function MapPlacePreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  const highlights = values.highlightItems.filter((item) => item.text.trim());

  return (
    <Drawer title="Xem trước trên Mini App" open={open} size="large" onClose={onClose}>
      <div className="map-place-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="cyan">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên điểm bản đồ'}</Typography.Title>
        <Typography.Paragraph><EnvironmentOutlined /> {values.address || 'Địa chỉ'}</Typography.Paragraph>
        <Typography.Paragraph><ClockCircleOutlined /> {values.openTime || 'Giờ mở cửa'}</Typography.Paragraph>
        <Typography.Paragraph><CompassOutlined /> {values.distanceFromCenter || 'Khoảng cách từ trung tâm'}</Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          {values.coordinates.lat.toFixed(6)}, {values.coordinates.lng.toFixed(6)}
        </Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
        {values.descriptionItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Điểm nổi bật</Typography.Title>
        {highlights.length ? (
          <ul>{highlights.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
        ) : (
          <Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>
        )}
        {values.directionNote && (
          <>
            <Typography.Title level={4}>Ghi chú chỉ đường</Typography.Title>
            <Typography.Paragraph>{values.directionNote}</Typography.Paragraph>
          </>
        )}
      </div>
    </Drawer>
  );
}
