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
import { deleteTemple, fetchTemples, reorderTemples, updateTempleStatus } from '../../../api/temples';
import type { TempleAdminItem, TempleQuery, TempleType } from '../../../types/temple';
import { describeTempleError } from './temple-errors';
import './temples.css';

const TYPE_COLORS: Record<TempleType, string> = { Đình: 'blue', Chùa: 'gold', Miếu: 'purple' };

export function TemplesPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<TempleQuery>({ page: 1, limit: 20 });

  const templesQuery = useQuery({
    queryKey: ['admin-temples', query],
    queryFn: ({ signal }) => fetchTemples(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: TempleAdminItem; isActive: boolean }) =>
      updateTempleStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị địa điểm' : 'Đã ẩn địa điểm');
      refresh();
    },
    onError: (error: unknown) => message.error(describeTempleError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemple,
    onSuccess: () => {
      message.success('Đã xóa địa điểm');
      refresh();
    },
    onError: (error: unknown) => message.error(describeTempleError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTemples,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự');
      refresh();
    },
    onError: (error: unknown) => message.error(describeTempleError(error)),
  });

  function move(item: TempleAdminItem, direction: -1 | 1): void {
    const rows = templesQuery.data?.data ?? [];
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: TempleAdminItem): void {
    Modal.confirm({
      title: 'Xóa địa điểm?',
      content: `“${item.name}” và toàn bộ sự kiện liên quan sẽ bị xóa.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const rows = templesQuery.data?.data ?? [];
  const columns: ColumnsType<TempleAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null, item) =>
        url ? <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} /> : <div className="temples-page__no-image">Chưa có</div>,
    },
    { title: 'Tên địa điểm', dataIndex: 'name', ellipsis: true },
    { title: 'Loại', dataIndex: 'type', width: 90, render: (type: TempleType) => <Tag color={TYPE_COLORS[type]}>{type}</Tag> },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true },
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
          loading={statusMutation.isPending}
          onChange={(checked) => statusMutation.mutate({ item, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 210,
      fixed: 'right',
      render: (_, item, index) => (
        <Space size={4}>
          <Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index === 0 || reorderMutation.isPending} onClick={() => move(item, -1)} />
          <Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index === rows.length - 1 || reorderMutation.isPending} onClick={() => move(item, 1)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/temples/${item.id}`)}>Sửa</Button>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" onClick={() => confirmDelete(item)} />
        </Space>
      ),
    },
  ];

  if (templesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Đền - Chùa - Miếu"
        description={describeTempleError(templesQuery.error)}
        action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void templesQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="temples-page">
      <div className="temples-page__header">
        <div>
          <Typography.Title level={3}>Đền - Chùa - Miếu</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {templesQuery.data?.meta.total ?? 0} địa điểm, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/temples/new')}>Thêm địa điểm</Button>
      </div>

      <div className="temples-page__filters">
        <Select
          allowClear
          placeholder="Tất cả loại"
          style={{ width: 160 }}
          options={['Đình', 'Chùa', 'Miếu'].map((value) => ({ value, label: value }))}
          onChange={(type?: TempleType) => setQuery((current) => ({ ...current, page: 1, type }))}
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
        loading={templesQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1050 }}
        locale={{ emptyText: 'Chưa có địa điểm phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: templesQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}

