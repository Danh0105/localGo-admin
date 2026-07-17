import { ClockCircleOutlined, EnvironmentOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd';
import type { JSX } from 'react';
import type { CraftVillageFormValues } from './craft-village.schema';

export function CraftVillagePreviewDrawer({ open,values,onClose }:{ open:boolean;values:CraftVillageFormValues;onClose:()=>void }):JSX.Element {
  return <Drawer title="Xem trước trên Mini App" open={open} size={520} onClose={onClose}><div className="craft-village-preview">
    {values.imageUrl?<Image preview={false} src={values.imageUrl} alt={values.imageAlt||values.name} width="100%"/>:<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có ảnh"/>}
    <Space style={{ marginTop:16 }}><Tag color="blue">{values.category}</Tag>{!values.isActive&&<Tag>Đang ẩn</Tag>}</Space>
    <Typography.Title level={2}>{values.name||'Tên làng nghề'}</Typography.Title>
    <Typography.Paragraph><EnvironmentOutlined/> {values.address||'Địa chỉ'}</Typography.Paragraph>
    <Typography.Paragraph><ClockCircleOutlined/> {values.workingTime||'Thời gian hoạt động'}</Typography.Paragraph>
    <Typography.Paragraph><ShoppingOutlined/> {values.mainProducts||'Sản phẩm chính'}</Typography.Paragraph>
    <Typography.Paragraph strong>{values.summary}</Typography.Paragraph><Typography.Title level={4}>Mô tả chi tiết</Typography.Title>
    {values.descriptions.map((item,index)=><Typography.Paragraph key={index}>{item.text}</Typography.Paragraph>)}
    <Typography.Title level={4}>Điểm nổi bật</Typography.Title>{values.highlights.length?<ul>{values.highlights.map((item,index)=><li key={index}>{item.text}</li>)}</ul>:<Typography.Text type="secondary">Chưa có điểm nổi bật</Typography.Text>}
    {values.visitorNote&&<><Typography.Title level={4}>Ghi chú cho khách tham quan</Typography.Title><Typography.Paragraph>{values.visitorNote}</Typography.Paragraph></>}
  </div></Drawer>;
}
