import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Image, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteOcopProduct, fetchOcopProducts, reorderOcopProducts, updateOcopStatus } from '../../../api/ocop';
import { useAuthStore } from '../../../store/auth-store';
import { OCOP_CATEGORIES, type OcopAdminProduct, type OcopCategory, type OcopQuery, type OcopRating } from '../../../types/ocop';
import { describeOcopError } from './ocop-errors';
import './ocop.css';

const CATEGORY_COLORS: Record<OcopCategory, string> = {
  'Thực phẩm': 'volcano', 'Đồ uống': 'blue', 'Nông sản tươi': 'green', 'Sản phẩm chế biến': 'purple',
};

export function OcopProductsPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<OcopQuery>({ page: 1, limit: 20 });

  const productsQuery = useQuery({
    queryKey: ['admin-ocop', query],
    queryFn: ({ signal }) => fetchOcopProducts(query, signal),
  });
  const refresh = (): void => { void queryClient.invalidateQueries({ queryKey: ['admin-ocop'] }); };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: OcopAdminProduct; isActive: boolean }) =>
      updateOcopStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => { message.success(variables.isActive ? 'Đã hiển thị sản phẩm OCOP' : 'Đã ẩn sản phẩm OCOP'); refresh(); },
    onError: (error: unknown) => message.error(describeOcopError(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteOcopProduct,
    onSuccess: () => { message.success('Đã xóa sản phẩm OCOP'); refresh(); },
    onError: (error: unknown) => message.error(describeOcopError(error)),
  });
  const reorderMutation = useMutation({
    mutationFn: reorderOcopProducts,
    onSuccess: () => { message.success('Đã cập nhật thứ tự'); refresh(); },
    onError: (error: unknown) => message.error(describeOcopError(error)),
  });

  const rows = productsQuery.data?.data ?? [];
  function move(item: OcopAdminProduct, direction: -1 | 1): void {
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: OcopAdminProduct): void {
    Modal.confirm({
      title: 'Xóa sản phẩm OCOP?', content: `“${item.name}” sẽ bị xóa khỏi Mini App.`,
      okText: 'Xóa', cancelText: 'Hủy', okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const columns: ColumnsType<OcopAdminProduct> = [
    { title: 'Ảnh', dataIndex: 'imageUrl', width: 88, render: (url: string | null, item) => url
      ? <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
      : <div className="ocop-page__no-image">Chưa có</div> },
    { title: 'Tên sản phẩm', dataIndex: 'name', ellipsis: true },
    { title: 'Danh mục', dataIndex: 'category', width: 160, render: (category: OcopCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag> },
    { title: 'Hạng sao', dataIndex: 'rating', width: 110, render: (rating: OcopRating) => <span className="ocop-rating" aria-label={`${rating} sao OCOP`}><StarFilled /> {rating} sao</span> },
    { title: 'Nhà sản xuất', dataIndex: 'producer', width: 180, ellipsis: true },
    { title: 'Hiển thị', dataIndex: 'isActive', width: 105, render: (isActive: boolean, item) => (
      <Switch checked={isActive} checkedChildren="Hiện" unCheckedChildren="Ẩn" disabled={!canManage}
        loading={statusMutation.isPending} onChange={(checked) => statusMutation.mutate({ item, isActive: checked })} />
    ) },
    { title: 'Thao tác', key: 'actions', width: canManage ? 210 : 90, fixed: 'right', render: (_, item, index) => (
      <Space size={4}>
        {canManage && <>
          <Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index === 0 || reorderMutation.isPending} onClick={() => move(item, -1)} />
          <Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index === rows.length - 1 || reorderMutation.isPending} onClick={() => move(item, 1)} />
        </>}
        <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/ocop/${item.id}`)}>{canManage ? 'Sửa' : 'Xem'}</Button>
        {canManage && <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />}
      </Space>
    ) },
  ];

  if (productsQuery.isError) return <Alert type="error" showIcon message="Không tải được danh sách OCOP"
    description={describeOcopError(productsQuery.error)} action={<Button icon={<ReloadOutlined />} onClick={() => void productsQuery.refetch()}>Thử lại</Button>} />;

  return <div className="ocop-page">
    <div className="ocop-page__header">
      <div><Typography.Title level={3}>Quản lý sản phẩm OCOP</Typography.Title>
        <Typography.Text type="secondary">Tổng cộng {productsQuery.data?.meta.total ?? 0} sản phẩm, bao gồm cả đang ẩn.</Typography.Text></div>
      {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/ocop/new')}>Thêm sản phẩm mới</Button>}
    </div>
    {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}
    <div className="ocop-page__filters">
      <Select allowClear placeholder="Tất cả danh mục" style={{ width: 200 }} options={OCOP_CATEGORIES.map((value) => ({ value, label: value }))}
        onChange={(category?: OcopCategory) => setQuery((current) => ({ ...current, page: 1, category }))} />
      <Select allowClear placeholder="Tất cả hạng sao" style={{ width: 160 }} options={([3, 4, 5] as OcopRating[]).map((value) => ({ value, label: `${value} sao` }))}
        onChange={(rating?: OcopRating) => setQuery((current) => ({ ...current, page: 1, rating }))} />
      <Input.Search allowClear placeholder="Tìm tên hoặc nhà sản xuất" value={searchDraft} style={{ width: 320 }}
        onChange={(event) => setSearchDraft(event.target.value)} onSearch={(search) => setQuery((current) => ({ ...current, page: 1, search: search.trim() || undefined }))} />
      <Button icon={<ReloadOutlined />} onClick={refresh}>Làm mới</Button>
    </div>
    <Table rowKey="id" columns={columns} dataSource={rows} loading={productsQuery.isLoading || deleteMutation.isPending}
      scroll={{ x: 1150 }} locale={{ emptyText: 'Chưa có sản phẩm OCOP phù hợp' }} pagination={{ current: query.page,
        pageSize: query.limit, total: productsQuery.data?.meta.total ?? 0, showSizeChanger: true,
        onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })) }} />
  </div>;
}
