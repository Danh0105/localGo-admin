import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Image, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteCraftVillage, fetchCraftVillages, reorderCraftVillages, updateCraftVillageStatus } from '../../../api/craft-villages';
import { useAuthStore } from '../../../store/auth-store';
import { CRAFT_VILLAGE_CATEGORIES, type CraftVillageAdminItem, type CraftVillageCategory, type CraftVillageQuery } from '../../../types/craft-village';
import { describeCraftVillageError } from './craft-village-errors';
import './craft-villages.css';

const CATEGORY_COLORS: Record<CraftVillageCategory, string> = {
  'Thủ công truyền thống':'volcano', 'Chế biến nông sản':'green', 'Dịch vụ trải nghiệm':'blue', 'Sản phẩm gia đình':'purple',
};

export function CraftVillagesPage(): JSX.Element {
  const navigate=useNavigate(); const queryClient=useQueryClient();
  const canManage=useAuthStore((state) => state.user?.role === 'ADMIN');
  const [searchDraft,setSearchDraft]=useState(''); const [query,setQuery]=useState<CraftVillageQuery>({ page:1, limit:20 });
  const villagesQuery=useQuery({ queryKey:['admin-craft-villages',query], queryFn:({ signal }) => fetchCraftVillages(query,signal) });
  const refresh=():void => { void queryClient.invalidateQueries({ queryKey:['admin-craft-villages'] }); };
  const statusMutation=useMutation({ mutationFn:({ item,isActive }:{ item:CraftVillageAdminItem;isActive:boolean }) => updateCraftVillageStatus(item.id,isActive,item.version),
    onSuccess:(_,variables) => { message.success(variables.isActive ? 'Đã hiển thị làng nghề' : 'Đã ẩn làng nghề'); refresh(); }, onError:(error:unknown) => message.error(describeCraftVillageError(error)) });
  const deleteMutation=useMutation({ mutationFn:deleteCraftVillage, onSuccess:() => { message.success('Đã xóa làng nghề'); refresh(); }, onError:(error:unknown) => message.error(describeCraftVillageError(error)) });
  const reorderMutation=useMutation({ mutationFn:reorderCraftVillages, onSuccess:() => { message.success('Đã cập nhật thứ tự'); refresh(); }, onError:(error:unknown) => message.error(describeCraftVillageError(error)) });
  const rows=villagesQuery.data?.data ?? [];
  function move(item:CraftVillageAdminItem,direction:-1|1):void { const index=rows.findIndex((row) => row.id===item.id); const target=index+direction; if(index<0||target<0||target>=rows.length)return;
    const reordered=rows.slice(); [reordered[index],reordered[target]]=[reordered[target],reordered[index]]; const offset=(query.page-1)*query.limit;
    reorderMutation.mutate(reordered.map((row,rowIndex) => ({ id:row.id, sortOrder:offset+rowIndex }))); }
  function confirmDelete(item:CraftVillageAdminItem):void { Modal.confirm({ title:'Xóa làng nghề?', content:`“${item.name}” sẽ bị xóa khỏi Mini App.`, okText:'Xóa', cancelText:'Hủy',
    okButtonProps:{ danger:true,loading:deleteMutation.isPending }, onOk:() => deleteMutation.mutateAsync(item.id) }); }
  const columns:ColumnsType<CraftVillageAdminItem>=[
    { title:'Ảnh',dataIndex:'imageUrl',width:88,render:(url:string|null,item) => url ? <Image src={url} alt={item.imageAlt||item.name} width={64} height={44} style={{ objectFit:'cover',borderRadius:6 }} /> : <div className="craft-villages-page__no-image">Chưa có</div> },
    { title:'Tên làng nghề',dataIndex:'name',ellipsis:true },
    { title:'Danh mục',dataIndex:'category',width:170,render:(category:CraftVillageCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag> },
    { title:'Địa chỉ',dataIndex:'address',width:200,ellipsis:true }, { title:'Sản phẩm chính',dataIndex:'mainProducts',width:190,ellipsis:true },
    { title:'Hiển thị',dataIndex:'isActive',width:105,render:(isActive:boolean,item) => <Switch checked={isActive} checkedChildren="Hiện" unCheckedChildren="Ẩn" disabled={!canManage} loading={statusMutation.isPending} onChange={(checked) => statusMutation.mutate({ item,isActive:checked })} /> },
    { title:'Thao tác',key:'actions',width:canManage?210:90,fixed:'right',render:(_,item,index) => <Space size={4}>
      {canManage&&<><Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index===0||reorderMutation.isPending} onClick={() => move(item,-1)} /><Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index===rows.length-1||reorderMutation.isPending} onClick={() => move(item,1)} /></>}
      <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/craft-villages/${item.id}`)}>{canManage?'Sửa':'Xem'}</Button>
      {canManage&&<Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />}</Space> },
  ];
  if(villagesQuery.isError)return <Alert type="error" showIcon message="Không tải được danh sách Làng nghề" description={describeCraftVillageError(villagesQuery.error)} action={<Button icon={<ReloadOutlined />} onClick={() => void villagesQuery.refetch()}>Thử lại</Button>} />;
  return <div className="craft-villages-page"><div className="craft-villages-page__header"><div><Typography.Title level={3}>Quản lý Làng nghề</Typography.Title><Typography.Text type="secondary">Tổng cộng {villagesQuery.data?.meta.total??0} mục, bao gồm cả đang ẩn.</Typography.Text></div>
    {canManage&&<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/craft-villages/new')}>Thêm mục mới</Button>}</div>
    {!canManage&&<Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}
    <div className="craft-villages-page__filters"><Select allowClear placeholder="Tất cả danh mục" style={{ width:220 }} options={CRAFT_VILLAGE_CATEGORIES.map((value) => ({ value,label:value }))} onChange={(category?:CraftVillageCategory) => setQuery((current) => ({ ...current,page:1,category }))} />
      <Input.Search allowClear placeholder="Tìm theo tên hoặc địa chỉ" value={searchDraft} style={{ width:320 }} onChange={(event) => setSearchDraft(event.target.value)} onSearch={(search) => setQuery((current) => ({ ...current,page:1,search:search.trim()||undefined }))} />
      <Button icon={<ReloadOutlined />} onClick={refresh}>Làm mới</Button></div>
    <Table rowKey="id" columns={columns} dataSource={rows} loading={villagesQuery.isLoading||deleteMutation.isPending} scroll={{ x:1150 }} locale={{ emptyText:'Chưa có làng nghề phù hợp' }} pagination={{ current:query.page,pageSize:query.limit,total:villagesQuery.data?.meta.total??0,showSizeChanger:true,onChange:(page,limit) => setQuery((current) => ({ ...current,page,limit })) }} />
  </div>;
}
