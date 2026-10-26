import {
  EnvironmentOutlined,
  PhoneOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Divider,
  Drawer,
  Empty,
  Image,
  Rate,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import type { JSX } from "react";
import { safeCuisineMapsUrl, type CuisineFormValues } from "./cuisine.schema";

interface Props {
  open: boolean;
  values: CuisineFormValues;
  onClose: () => void;
}

export function CuisinePreviewDrawer({
  open,
  values,
  onClose,
}: Props): JSX.Element {
  const averageRating = values.reviews.length
    ? values.reviews.reduce((sum, review) => sum + review.rating, 0) /
      values.reviews.length
    : 0;

  return (
    <Drawer
      title="Xem trước nội dung ẩm thực"
      open={open}
      onClose={onClose}
      width="min(680px, 100vw)"
      destroyOnHidden
    >
      <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
        <Tag color={values.isActive ? "green" : "default"}>
          {values.isActive ? "Đang hiển thị" : "Đang ẩn"}
        </Tag>
        {values.imageUrl && (
          <Image
            src={values.imageUrl}
            alt={values.imageAlt || values.name}
            style={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
        )}
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          {values.name || "Tên món ăn"}
        </Typography.Title>
        <Space wrap>
          <Tag>{values.category}</Tag>
          {values.priceRange && <Tag>{values.priceRange}</Tag>}
          {values.bestTime && <Tag>{values.bestTime}</Tag>}
        </Space>
        {!!values.reviews.length && (
          <Space>
            <StarFilled style={{ color: "#faad14" }} />
            <Typography.Text strong>
              {averageRating.toFixed(1)}/5
            </Typography.Text>
            <Typography.Text type="secondary">
              ({values.reviews.length} đánh giá)
            </Typography.Text>
          </Space>
        )}
        <Typography.Paragraph>{values.summary}</Typography.Paragraph>
        {values.descriptions.map((part, index) => (
          <Typography.Paragraph key={index}>{part.text}</Typography.Paragraph>
        ))}

        {values.highlights.length > 0 && (
          <section>
            <Typography.Title level={5}>Điểm nổi bật</Typography.Title>
            <ul>
              {values.highlights.map((point, i) => (
                <li key={i}>{point.text}</li>
              ))}
            </ul>
          </section>
        )}

        <Divider style={{ margin: "8px 0" }} />
        <section>
          <Typography.Title level={5}>Địa điểm gợi ý</Typography.Title>
          {!values.suggestedPlaces.length && (
            <Empty description="Chưa có địa điểm" />
          )}
          <Space orientation="vertical" size="small" style={{ width: "100%" }}>
            {values.suggestedPlaces.map((place, index) => {
              const mapsUrl = safeCuisineMapsUrl(place.googleMapsUrl);
              return (
                <Card key={`${place.id}-${index}`} size="small">
                  <Typography.Text strong>
                    {place.name || `Địa điểm ${index + 1}`}
                  </Typography.Text>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ marginBottom: 8 }}
                  >
                    {place.address || "Chưa cập nhật địa chỉ"}
                  </Typography.Paragraph>
                  {mapsUrl ? (
                    <Typography.Link
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <EnvironmentOutlined /> Mở Google Maps
                    </Typography.Link>
                  ) : (
                    <Typography.Text type="warning">
                      Chưa có link Google Maps hợp lệ
                    </Typography.Text>
                  )}
                </Card>
              );
            })}
          </Space>
        </section>

        {!!values.contactPhone && (
          <Typography.Paragraph>
            <PhoneOutlined /> Điện thoại: {values.contactPhone}
          </Typography.Paragraph>
        )}

        {values.menu.length > 0 && (
          <section>
            <Typography.Title level={5}>Thực đơn</Typography.Title>
            <Space orientation="vertical" style={{ width: "100%" }}>
              {values.menu.map((item, index) => (
                <Card key={`${item.id}-${index}`} size="small">
                  <Space
                    align="start"
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Typography.Text strong>{item.name}</Typography.Text>
                    <Typography.Text strong>{item.price}</Typography.Text>
                  </Space>
                  {item.description && (
                    <Typography.Paragraph type="secondary">
                      {item.description}
                    </Typography.Paragraph>
                  )}
                </Card>
              ))}
            </Space>
          </section>
        )}

        {values.gallery.length > 0 && (
          <section>
            <Typography.Title level={5}>Hình ảnh thêm</Typography.Title>
            <Row gutter={[8, 8]}>
              {values.gallery.map((img, index) => (
                <Col span={8} key={`${img.mediaId}-${index}`}>
                  {img.imageUrl ? (
                    <Image
                      src={img.imageUrl}
                      alt={`Ảnh món ăn ${index + 1}`}
                      style={{
                        width: "100%",
                        height: 120,
                        borderRadius: 8,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Card size="small">Đã chọn ảnh {index + 1}</Card>
                  )}
                </Col>
              ))}
            </Row>
          </section>
        )}

        {values.reviews.length > 0 && (
          <section>
            <Typography.Title level={5}>Đánh giá</Typography.Title>
            <Space orientation="vertical" style={{ width: "100%" }}>
              {values.reviews.map((review, index) => (
                <Card key={`${review.id}-${index}`} size="small">
                  <Space orientation="vertical" size={4}>
                    <Typography.Text strong>
                      {review.reviewerName}
                    </Typography.Text>
                    <Rate disabled value={review.rating} />
                    {review.feedback && (
                      <Typography.Paragraph>
                        {review.feedback}
                      </Typography.Paragraph>
                    )}
                    {review.adminResponse && (
                      <Typography.Paragraph type="secondary">
                        <strong>Phản hồi quản trị: </strong>
                        {review.adminResponse}
                      </Typography.Paragraph>
                    )}
                  </Space>
                </Card>
              ))}
            </Space>
          </section>
        )}

        {values.tip && (
          <section>
            <Typography.Title level={5}>Mẹo thưởng thức</Typography.Title>
            <Typography.Paragraph>{values.tip}</Typography.Paragraph>
          </section>
        )}
      </Space>
    </Drawer>
  );
}
