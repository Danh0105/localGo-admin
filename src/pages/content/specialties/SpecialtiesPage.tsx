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
import { deleteSpecialty, fetchSpecialties, reorderSpecialties, updateSpecialtyStatus } from '../../../api/specialties';
import type { SpecialtyAdminItem, SpecialtyCategory, SpecialtyQuery } from '../../../types/specialty';
import { describeSpecialtyError } from './specialty-errors';
import './specialties.css';

const CATEGORY_COLORS: Record<SpecialtyCategory, string> = {
  'Món ăn': 'volcano',
  'Trái cây': 'green',
  'Quà mang về': 'geekblue',
};

export function SpecialtiesPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<SpecialtyQuery>({ page: 1, limit: 20 });

  const specialtiesQuery = useQuery({
    queryKey: ['admin-specialties', query],
    queryFn: ({ signal }) => fetchSpecialties(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-specialties'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: SpecialtyAdminItem; isActive: boolean }) =>
      updateSpecialtyStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị đặc sản' : 'Đã ẩn đặc sản');
      refresh();
    },
    onError: (error: unknown) => message.error(describeSpecialtyError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSpecialty,
    onSuccess: () => {
      message.success('Đã xóa đặc sản');
      refresh();
    },
    onError: (error: unknown) => message.error(describeSpecialtyError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderSpecialties,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự');
      refresh();
    },
    onError: (error: unknown) => message.error(describeSpecialtyError(error)),
  });

  function move(item: SpecialtyAdminItem, direction: -1 | 1): void {
    const rows = specialtiesQuery.data?.data ?? [];
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: SpecialtyAdminItem): void {
    Modal.confirm({
      title: 'Xóa đặc sản?',
      content: `“${item.name}” sẽ bị xóa khỏi Mini App.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const rows = specialtiesQuery.data?.data ?? [];
  const columns: ColumnsType<SpecialtyAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null, item) =>
        url ? (
          <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div className="specialties-page__no-image">Chưa có</div>
        ),
    },
    { title: 'Tên đặc sản', dataIndex: 'name', ellipsis: true },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 130,
      render: (category: SpecialtyCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Giá', dataIndex: 'price', width: 130, ellipsis: true },
    { title: 'Mùa vụ', dataIndex: 'season', width: 130, ellipsis: true },
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
          <Button
            type="text"
            icon={<ArrowUpOutlined />}
            aria-label="Đưa lên"
            disabled={index === 0 || reorderMutation.isPending}
            onClick={() => move(item, -1)}
          />
          <Button
            type="text"
            icon={<ArrowDownOutlined />}
            aria-label="Đưa xuống"
            disabled={index === rows.length - 1 || reorderMutation.isPending}
            onClick={() => move(item, 1)}
          />
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/specialties/${item.id}`)}>
            Sửa
          </Button>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" onClick={() => confirmDelete(item)} />
        </Space>
      ),
    },
  ];

  if (specialtiesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Đặc sản"
        description={describeSpecialtyError(specialtiesQuery.error)}
        action={
          <Button size="small" icon={<ReloadOutlined />} onClick={() => void specialtiesQuery.refetch()}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="specialties-page">
      <div className="specialties-page__header">
        <div>
          <Typography.Title level={3}>Đặc sản</Typography.Title>
          <Typography.Text type="secondary">
            Tổng cộng {specialtiesQuery.data?.meta.total ?? 0} đặc sản, bao gồm cả đang ẩn.
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/specialties/new')}>
          Thêm đặc sản mới
        </Button>
      </div>

      <div className="specialties-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 180 }}
          options={(['Món ăn', 'Trái cây', 'Quà mang về'] as SpecialtyCategory[]).map((value) => ({ value, label: value }))}
          onChange={(category?: SpecialtyCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tên"
          value={searchDraft}
          style={{ width: 320 }}
          onChange={(event) => setSearchDraft(event.target.value)}
          onSearch={(search) => setQuery((current) => ({ ...current, page: 1, search: search.trim() || undefined }))}
        />
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          Làm mới
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={specialtiesQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1100 }}
        locale={{ emptyText: 'Chưa có đặc sản phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: specialtiesQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}
