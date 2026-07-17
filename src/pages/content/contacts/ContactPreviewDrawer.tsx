import { EnvironmentOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { ContactFormValues } from './contact.schema';

interface Props {
  open: boolean;
  values: ContactFormValues;
  onClose: () => void;
}

export function ContactPreviewDrawer({ open, values, onClose }: Props): JSX.Element {
  const supportTopics = values.supportTopicItems.filter((item) => item.text.trim());
  const phone = values.phone.trim();
  const email = values.email.trim();

  return (
    <Drawer title="Xem trước trên Mini App" open={open} size="large" onClose={onClose}>
      <div className="contact-preview">
        {values.imageUrl ? (
          <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />
        )}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên liên hệ'}</Typography.Title>
        <Typography.Paragraph strong>{values.role || 'Vai trò / chức năng'}</Typography.Paragraph>
        <Typography.Paragraph><PhoneOutlined /> {phone || 'Số điện thoại'}</Typography.Paragraph>
        {email && <Typography.Paragraph><MailOutlined /> {email}</Typography.Paragraph>}
        <Typography.Paragraph><EnvironmentOutlined /> {values.address || 'Địa chỉ'}</Typography.Paragraph>
        <Typography.Paragraph>{values.workingTime || 'Giờ làm việc'}</Typography.Paragraph>
        <Space wrap>
          <Button type="primary" icon={<PhoneOutlined />} href={phone ? `tel:${phone}` : undefined} disabled={!phone}>Gọi ngay</Button>
          <Button icon={<MailOutlined />} href={email ? `mailto:${email}` : undefined} disabled={!email}>Gửi email</Button>
        </Space>
        <Typography.Paragraph style={{ marginTop: 16 }} strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
        {values.descriptionItems.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Nội dung hỗ trợ</Typography.Title>
        {supportTopics.length ? (
          <ul>{supportTopics.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
        ) : (
          <Typography.Text type="secondary">Chưa có nội dung hỗ trợ</Typography.Text>
        )}
        {values.note && (
          <>
            <Typography.Title level={4}>Lưu ý</Typography.Title>
            <Typography.Paragraph>{values.note}</Typography.Paragraph>
          </>
        )}
      </div>
    </Drawer>
  );
}
