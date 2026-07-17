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
import {
  deleteAgricultureItem,
  fetchAgricultureItems,
  reorderAgricultureItems,
  updateAgricultureStatus,
} from '../../../api/agriculture';
import {
  AGRICULTURE_CATEGORIES,
  type AgricultureAdminItem,
  type AgricultureCategory,
  type AgricultureQuery,
} from '../../../types/agriculture';
import { describeAgricultureError } from './agriculture-errors';
import './agriculture.css';

const CATEGORY_COLORS: Record<AgricultureCategory, string> = {
  'Cây trồng chủ lực': 'green',
  'Chăn nuôi': 'orange',
  'Thủy lợi': 'blue',
  'Mô hình sản xuất': 'purple',
};

export function AgriculturePage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<AgricultureQuery>({ page: 1, limit: 20 });

  const itemsQuery = useQuery({
    queryKey: ['admin-agriculture', query],
    queryFn: ({ signal }) => fetchAgricultureItems(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-agriculture'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: AgricultureAdminItem; isActive: boolean }) =>
      updateAgricultureStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị mục nông nghiệp' : 'Đã ẩn mục nông nghiệp');
      refresh();
    },
    onError: (error: unknown) => message.error(describeAgricultureError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgricultureItem,
    onSuccess: () => {
      message.success('Đã xóa mục nông nghiệp');
      refresh();
    },
    onError: (error: unknown) => message.error(describeAgricultureError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderAgricultureItems,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự');
      refresh();
    },
    onError: (error: unknown) => message.error(describeAgricultureError(error)),
  });

  const rows = itemsQuery.data?.data ?? [];

  function move(item: AgricultureAdminItem, direction: -1 | 1): void {
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: AgricultureAdminItem): void {
    Modal.confirm({
      title: 'Xóa mục nông nghiệp?',
      content: `“${item.name}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const columns: ColumnsType<AgricultureAdminItem> = [
    {
      title: 'Ảnh', dataIndex: 'imageUrl', width: 88,
      render: (url: string | null | undefined, item) => url ? (
        <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ) : <div className="agriculture-page__no-image">Chưa có</div>,
    },
    { title: 'Tên mục', dataIndex: 'name', ellipsis: true },
    {
      title: 'Danh mục', dataIndex: 'category', width: 160,
      render: (category: AgricultureCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Khu vực', dataIndex: 'location', ellipsis: true },
    { title: 'Quy mô', dataIndex: 'scale', ellipsis: true, width: 150 },
    { title: 'Thứ tự', dataIndex: 'sortOrder', width: 80, align: 'center' },
    {
      title: 'Hiển thị', dataIndex: 'isActive', width: 105,
      render: (isActive: boolean, item) => (
        <Switch
          checked={isActive}
          checkedChildren="Hiện"
          unCheckedChildren="Ẩn"
          loading={statusMutation.isPending}
          onChange={(checked) => statusMutation.mutate({ item, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác', key: 'actions', width: 210, fixed: 'right',
      render: (_, item, index) => (
        <Space size={4}>
          <Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index === 0 || reorderMutation.isPending} onClick={() => move(item, -1)} />
          <Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index === rows.length - 1 || reorderMutation.isPending} onClick={() => move(item, 1)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/agriculture/${item.id}`)}>Sửa</Button>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />
        </Space>
      ),
    },
  ];

  if (itemsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được danh sách Nông nghiệp"
        description={describeAgricultureError(itemsQuery.error)}
        action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void itemsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="agriculture-page">
      <div className="agriculture-page__header">
        <div>
          <Typography.Title level={3}>Quản lý Nông nghiệp</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {itemsQuery.data?.meta.total ?? 0} mục, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/agriculture/new')}>Thêm mục mới</Button>
      </div>

      <div className="agriculture-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 210 }}
          options={AGRICULTURE_CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category?: AgricultureCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc khu vực"
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
        scroll={{ x: 1200 }}
        locale={{ emptyText: 'Chưa có mục nông nghiệp phù hợp' }}
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
