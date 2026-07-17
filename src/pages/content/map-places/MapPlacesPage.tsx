import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Image, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteMapPlace, fetchMapPlaces, reorderMapPlaces, updateMapPlaceStatus } from '../../../api/map-places';
import { useAuthStore } from '../../../store/auth-store';
import { MAP_PLACE_CATEGORIES, type MapPlaceAdminItem, type MapPlaceCategory, type MapPlaceQuery } from '../../../types/map-place';
import { describeMapPlaceError } from './map-place-errors';
import './map-places.css';

const CATEGORY_COLORS: Record<MapPlaceCategory, string> = {
  'Hành chính': 'blue',
  'Du lịch': 'green',
  'Di tích': 'volcano',
  'Ẩm thực': 'gold',
  'Dịch vụ': 'purple',
};

function formatCoordinates(item: MapPlaceAdminItem): string {
  return `${item.coordinates.lat.toFixed(4)}, ${item.coordinates.lng.toFixed(4)}`;
}

export function MapPlacesPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<MapPlaceQuery>({ page: 1, limit: 20 });

  const itemsQuery = useQuery({
    queryKey: ['admin-map-places', query],
    queryFn: ({ signal }) => fetchMapPlaces(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-map-places'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: MapPlaceAdminItem; isActive: boolean }) =>
      updateMapPlaceStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị điểm bản đồ' : 'Đã ẩn điểm bản đồ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeMapPlaceError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMapPlace,
    onSuccess: () => {
      message.success('Đã xóa điểm bản đồ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeMapPlaceError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderMapPlaces,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự điểm bản đồ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeMapPlaceError(error)),
  });

  const rows = itemsQuery.data?.data ?? [];

  function move(item: MapPlaceAdminItem, direction: -1 | 1): void {
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: MapPlaceAdminItem): void {
    Modal.confirm({
      title: 'Xóa điểm bản đồ?',
      content: `“${item.name}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const columns: ColumnsType<MapPlaceAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null | undefined, item) => url ? (
        <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div className="map-places-page__no-image">Chưa có</div>
      ),
    },
    { title: 'Tên điểm', dataIndex: 'name', ellipsis: true },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 130,
      render: (category: MapPlaceCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true },
    { title: 'Tọa độ', key: 'coordinates', width: 165, render: (_, item) => formatCoordinates(item) },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 80, align: 'center' },
    {
      title: 'Hiển thị',
      dataIndex: 'isActive',
      width: 105,
      render: (isActive: boolean, item) => (
        <Switch
          checked={isActive}
          checkedChildren="Hiện"
          unCheckedChildren="Ẩn"
          disabled={!canManage}
          loading={statusMutation.isPending}
          onChange={(checked) => statusMutation.mutate({ item, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: canManage ? 220 : 90,
      fixed: 'right',
      render: (_, item, index) => (
        <Space size={4}>
          {canManage && (
            <>
              <Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index === 0 || reorderMutation.isPending} onClick={() => move(item, -1)} />
              <Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index === rows.length - 1 || reorderMutation.isPending} onClick={() => move(item, 1)} />
            </>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/map-places/${item.id}`)}>
            {canManage ? 'Sửa' : 'Xem'}
          </Button>
          {canManage && <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />}
        </Space>
      ),
    },
  ];

  if (itemsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Bản đồ"
        description={describeMapPlaceError(itemsQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="map-places-page">
      <div className="map-places-page__header">
        <div>
          <Typography.Title level={3}>Quản lý điểm Bản đồ</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {itemsQuery.data?.meta.total ?? 0} điểm, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/map-places/new')}>Thêm điểm mới</Button>}
      </div>

      {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}

      <div className="map-places-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 190 }}
          options={MAP_PLACE_CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category?: MapPlaceCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc địa chỉ"
          value={searchDraft}
          style={{ width: 320 }}
          onChange={(event) => setSearchDraft(event.target.value)}
          onSearch={(search) => setQuery((current) => ({ ...current, page: 1, search: search.trim() || undefined }))}
        />
        <Button icon={<ReloadOutlined />} onClick={refresh}>Làm mới</Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={itemsQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1250 }}
        locale={{ emptyText: 'Chưa có điểm bản đồ phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: itemsQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}
