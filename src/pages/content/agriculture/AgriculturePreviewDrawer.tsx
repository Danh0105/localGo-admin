import { CheckCircleOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { AgricultureFormValues } from './agriculture.schema';

interface Props {
  open: boolean;
  values: AgricultureFormValues;
  onClose: () => void;
}

export function AgriculturePreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size="large" onClose={onClose}>
      <div className="agriculture-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="green">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên mục nông nghiệp'}</Typography.Title>
        <Typography.Paragraph type="secondary">{values.location || 'Khu vực'}</Typography.Paragraph>
        <Typography.Paragraph><strong>Mùa vụ:</strong> {values.season || '—'}</Typography.Paragraph>
        <Typography.Paragraph><strong>Quy mô:</strong> {values.scale || '—'}</Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Thông tin mô hình</Typography.Title>
        {values.descriptionItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Điểm nổi bật</Typography.Title>
        {values.highlightItems.length === 0 ? (
          <Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>
        ) : values.highlightItems.map((item, index) => (
          <Typography.Paragraph key={index}><CheckCircleOutlined /> {item.text}</Typography.Paragraph>
        ))}
        <Typography.Title level={4}>Hỗ trợ người dân</Typography.Title>
        <Typography.Paragraph>{values.support}</Typography.Paragraph>
      </div>
    </Drawer>
  );
}
