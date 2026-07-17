import { PhoneOutlined, StarFilled } from '@ant-design/icons';
import { Drawer, Empty, Image, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { OcopFormValues } from './ocop.schema';

export function OcopPreviewDrawer({ open, values, onClose }: { open: boolean; values: OcopFormValues; onClose: () => void }): JSX.Element {
  const contactPhone = values.contactPhone.trim();

  return <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
    <div className="ocop-preview">
      {values.imageUrl ? <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
        : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />}
      <div className="ocop-preview__tags"><Tag color="blue">{values.category}</Tag>{!values.isActive && <Tag>Đang ẩn</Tag>}</div>
      <Typography.Title level={2}>{values.name || 'Tên sản phẩm OCOP'}</Typography.Title>
      <div className="ocop-rating ocop-rating--large" aria-label={`${values.rating} sao OCOP`}>
        {Array.from({ length: values.rating }, (_, index) => <StarFilled key={index} />)} <span>{values.rating} sao OCOP</span>
      </div>
      <Typography.Paragraph type="secondary">{values.producer || 'Nhà sản xuất'} · {values.priceRange || 'Khoảng giá'}</Typography.Paragraph>
      <Typography.Paragraph>{values.address}</Typography.Paragraph>
      <Typography.Paragraph>
        <PhoneOutlined />{' '}
        {contactPhone
          ? <Typography.Link href={`tel:${contactPhone.replace(/[^+\d]/g, '')}`}>{contactPhone}</Typography.Link>
          : <Typography.Text type="secondary">Chưa có số liên hệ</Typography.Text>}
      </Typography.Paragraph>
      <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
      <Typography.Title level={4}>Giới thiệu sản phẩm</Typography.Title>
      {values.descriptions.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
      <Typography.Title level={4}>Điểm nổi bật</Typography.Title>
      {values.highlights.length ? <ul>{values.highlights.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
        : <Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>}
      {values.contactNote && <><Typography.Title level={4}>Kết nối</Typography.Title><Typography.Paragraph>{values.contactNote}</Typography.Paragraph></>}
    </div>
  </Drawer>;
}
