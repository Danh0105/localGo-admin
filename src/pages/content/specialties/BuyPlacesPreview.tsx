import {
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Card, Empty, Space, Typography } from "antd";
import type { JSX } from "react";
import type { BuyPlace } from "./specialty-buy-places";
import { isGoogleMapsUrl } from "./specialty-buy-places";

export function BuyPlacesPreview({
  places,
}: {
  places: BuyPlace[];
}): JSX.Element {
  if (!places.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có địa điểm mua"
      />
    );
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {places.map((place, index) => (
        <Card
          key={`${place.id}-${index}`}
          size="small"
          title={place.name || `Địa điểm ${index + 1}`}
        >
          <Space orientation="vertical" size={8}>
            {place.address && (
              <Typography.Text>
                <EnvironmentOutlined /> {place.address}
              </Typography.Text>
            )}
            {place.googleMapsUrl && isGoogleMapsUrl(place.googleMapsUrl) && (
              <Typography.Link
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <EnvironmentOutlined /> Xem Google Maps
              </Typography.Link>
            )}
            {place.phone && (
              <Typography.Link
                href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}
              >
                <PhoneOutlined /> {place.phone}
              </Typography.Link>
            )}
            {place.email && (
              <Typography.Link href={`mailto:${place.email}`}>
                <MailOutlined /> {place.email}
              </Typography.Link>
            )}
          </Space>
        </Card>
      ))}
    </Space>
  );
}
