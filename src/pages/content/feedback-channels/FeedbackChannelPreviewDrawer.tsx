import { ClockCircleOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, List, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { FeedbackChannelFormValues } from './feedback-channel.schema';

interface Props {
  open: boolean;
  values: FeedbackChannelFormValues;
  onClose: () => void;
}

export function FeedbackChannelPreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
      <div className="feedback-channel-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.title} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.title || 'Tiêu đề kênh phản hồi'}</Typography.Title>
        <Typography.Paragraph type="secondary">
          <ClockCircleOutlined /> {values.responseTime || 'Thời gian phản hồi'}
        </Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>

        <Typography.Title level={4}>Thông tin kênh phản hồi</Typography.Title>
        {values.descriptions.map((item, index) => (
          <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>
        ))}

        <Typography.Title level={4}>Thông tin nên cung cấp</Typography.Title>
        <List
          size="small"
          dataSource={values.requiredInfoItems}
          renderItem={(item, index) => <List.Item key={index}>{item.text}</List.Item>}
        />

        <Typography.Title level={4}>Ví dụ nội dung</Typography.Title>
        {values.exampleItems.length === 0 ? (
          <Typography.Text type="secondary">Chưa có ví dụ</Typography.Text>
        ) : (
          <List
            size="small"
            dataSource={values.exampleItems}
            renderItem={(item, index) => <List.Item key={index}>{item.text}</List.Item>}
          />
        )}

        <Typography.Title level={4}>Lưu ý</Typography.Title>
        <Typography.Paragraph>{values.note || 'Chưa có lưu ý'}</Typography.Paragraph>
      </div>
    </Drawer>
  );
}
