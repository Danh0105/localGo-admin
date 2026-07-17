import { ClockCircleOutlined, EnvironmentOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { CuisineFormValues } from './cuisine.schema';
import { getSafeGoogleMapsUrl } from './google-maps';

export function CuisinePreviewDrawer({
  open,
  values,
  onClose,
}: {
  open: boolean;
  values: CuisineFormValues;
  onClose: () => void;
}): JSX.Element {
  return (
    <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}>
      <div className="cuisine-preview">
        {values.imageUrl
          ? <Image preview={false} src={values.imageUrl} alt={values.imageAlt || values.name} width="100%" />
          : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh" />}
        <Space style={{ marginTop: 16 }}>
          <Tag color="blue">{values.category}</Tag>
          {!values.isActive && <Tag>Đang ẩn</Tag>}
        </Space>
        <Typography.Title level={2}>{values.name || 'Tên món ăn'}</Typography.Title>
        <Typography.Paragraph><WalletOutlined /> {values.priceRange || 'Khoảng giá'}</Typography.Paragraph>
        <Typography.Paragraph><ClockCircleOutlined /> {values.bestTime || 'Thời điểm nên ăn'}</Typography.Paragraph>
        <Typography.Paragraph strong>{values.summary}</Typography.Paragraph>
        <Typography.Title level={4}>Địa điểm gợi ý</Typography.Title>
        {values.suggestedPlaces.length ? (
          <div className="cuisine-preview__places">
            {values.suggestedPlaces.map((place) => {
              const mapsUrl = getSafeGoogleMapsUrl(place.googleMapsUrl);
              return (
                <div className="cuisine-preview__place" key={place.id}>
                  <Typography.Text strong><EnvironmentOutlined /> {place.name || 'Tên địa điểm'}</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    {place.address.trim() || 'Chưa có địa chỉ'}
                  </Typography.Paragraph>
                  {mapsUrl ? (
                    <Button
                      htmlType="button"
                      type="link"
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<EnvironmentOutlined />}
                    >
                      Chỉ đường bằng Google Maps
                    </Button>
                  ) : (
                    <Tag>Chưa có link Google Maps</Tag>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Typography.Text type="secondary">Chưa có địa điểm</Typography.Text>
        )}
        <Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
        {values.descriptions.map((item, index) => <Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
        <Typography.Title level={4}>Điểm nổi bật</Typography.Title>
        {values.highlights.length
          ? <ul>{values.highlights.map((item, index) => <li key={index}>{item.text}</li>)}</ul>
          : <Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>}
        {values.tip && (
          <>
            <Typography.Title level={4}>Mẹo thưởng thức</Typography.Title>
            <Typography.Paragraph>{values.tip}</Typography.Paragraph>
          </>
        )}
      </div>
    </Drawer>
  );
}
