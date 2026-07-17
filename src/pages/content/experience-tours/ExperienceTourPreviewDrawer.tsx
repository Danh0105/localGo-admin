import { CalendarOutlined, EnvironmentOutlined, FieldTimeOutlined, PhoneOutlined, WalletOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Timeline, Typography } from 'antd';
import type { JSX } from 'react';
import type { ExperienceTourFormValues } from './experience-tour.schema';

interface Props {
  open: boolean;
  values: ExperienceTourFormValues;
  onClose: () => void;
}

export function ExperienceTourPreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  const itinerary = values.itineraryItems.filter((item) => item.text.trim());
  const included = values.includedItems.filter((item) => item.text.trim());
  const contactPhone = values.contactPhone.trim();

  return (
    <Drawer title="Xem trước trên Mini App" open={open} size="large" onClose={onClose}>
      <div className="experience-tour-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="geekblue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên tour trải nghiệm'}</Typography.Title>
        <Typography.Paragraph><FieldTimeOutlined /> {values.duration || 'Thời lượng'}</Typography.Paragraph>
        <Typography.Paragraph><CalendarOutlined /> {values.startTime || 'Khung giờ khởi hành'}</Typography.Paragraph>
        <Typography.Paragraph><WalletOutlined /> {values.priceRange || 'Khoảng giá'}</Typography.Paragraph>
        <Typography.Paragraph><EnvironmentOutlined /> {values.meetingPoint || 'Điểm hẹn'}</Typography.Paragraph>
        <Typography.Paragraph>
          <PhoneOutlined />{' '}
          {contactPhone
            ? <Typography.Link href={`tel:${contactPhone.replace(/[^+\d]/g, '')}`}>{contactPhone}</Typography.Link>
            : <Typography.Text type="secondary">Chưa có số liên hệ</Typography.Text>}
        </Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
        {values.descriptionItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Lịch trình</Typography.Title>
        <Timeline
          items={itinerary.map((item, index) => ({
            content: <span><strong>Bước {index + 1}:</strong> {item.text}</span>,
          }))}
        />
        <Typography.Title level={4}>Bao gồm</Typography.Title>
        {included.length ? (
          <ul>{included.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
        ) : (
          <Typography.Text type="secondary">Chưa có thông tin bao gồm</Typography.Text>
        )}
        {values.note && (
          <>
            <Typography.Title level={4}>Ghi chú</Typography.Title>
            <Typography.Paragraph>{values.note}</Typography.Paragraph>
          </>
        )}
      </div>
    </Drawer>
  );
}
