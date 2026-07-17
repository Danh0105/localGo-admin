import { CheckCircleOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { HistoricalSiteFormValues } from './historical-site.schema';

interface Props {
  open: boolean;
  values: HistoricalSiteFormValues;
  onClose: () => void;
}

export function HistoricalSitePreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
      <div className="historical-site-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color={values.rank === 'Cấp quốc gia' ? 'red' : values.rank === 'Cấp tỉnh' ? 'blue' : 'default'}>{values.rank}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên di tích'}</Typography.Title>
        <Typography.Paragraph type="secondary">{values.address || 'Địa chỉ'}</Typography.Paragraph>
        {values.recognizedYear && <Typography.Paragraph>Năm công nhận: {values.recognizedYear}</Typography.Paragraph>}
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Lịch sử di tích</Typography.Title>
        {values.historyItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Điểm nổi bật</Typography.Title>
        {values.highlightItems.length === 0 ? (
          <Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>
        ) : (
          values.highlightItems.map((item, index) => (
            <Typography.Paragraph key={index}><CheckCircleOutlined /> {item.text}</Typography.Paragraph>
          ))
        )}
      </div>
    </Drawer>
  );
}
