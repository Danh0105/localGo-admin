import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { NewsFormValues } from './news.schema';

interface Props {
  open: boolean;
  values: NewsFormValues;
  onClose: () => void;
}

function formatDate(value: string): string {
  if (!Number.isFinite(Date.parse(value))) return 'Ngày đăng';
  return new Date(value).toLocaleString('vi-VN');
}

export function NewsPreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  const tags = values.tagItems.filter((item) => item.text.trim());
  const related = values.relatedItems.filter((item) => item.text.trim());

  return (
    <Drawer title="Xem trước trên Mini App" open={open} size="large" onClose={onClose}>
      <div className="news-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.title} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.title || 'Tiêu đề bài viết'}</Typography.Title>
        <Typography.Paragraph><CalendarOutlined /> {formatDate(values.publishedAt)}</Typography.Paragraph>
        <Typography.Paragraph><UserOutlined /> {values.author || 'Tác giả'}</Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        {values.contentItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        {tags.length > 0 && (
          <Space wrap>{tags.map((item, index) => <Tag key={index}>{item.text}</Tag>)}</Space>
        )}
        {related.length > 0 && (
          <>
            <Typography.Title level={4}>Liên quan</Typography.Title>
            <ul>{related.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
          </>
        )}
      </div>
    </Drawer>
  );
}
