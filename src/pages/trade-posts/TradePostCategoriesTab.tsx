import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import {
  createTradePostCategory,
  fetchAdminTradePostCategories,
} from '../../api/trade-post-categories';
import { ApiError } from '../../types/api';
import type {
  TradePostCategoryAdminItem,
  TradePostCategoryAdminQuery,
} from '../../types/trade-post-category';
import { TradePostCategoryFormModal } from './TradePostCategoryFormModal';

const STATUS_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}

function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Vui lòng kiểm tra kết nối và thử lại.';
}

export function TradePostCategoriesTab(): JSX.Element {
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<TradePostCategoryAdminQuery>({ page: 1, limit: 20 });
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<unknown>();

  const categoriesQuery = useQuery({
    queryKey: ['admin-trade-post-categories', query],
    queryFn: ({ signal }) => fetchAdminTradePostCategories(query, signal),
    placeholderData: (previous) => previous,
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-trade-post-categories'] });
  };

  const createMutation = useMutation({
    mutationFn: createTradePostCategory,
    onSuccess: () => {
      message.success('Đã tạo danh mục tin giao thương');
      setCreateOpen(false);
      setCreateError(undefined);
      refresh();
    },
    onError: (error: unknown) => {
      setCreateError(error);
    },
  });

  const openCreate = (): void => {
    setCreateError(undefined);
    setCreateOpen(true);
  };

  const closeCreate = (): void => {
    if (createMutation.isPending) return;
    setCreateOpen(false);
    setCreateError(undefined);
  };

  const columns: ColumnsType<TradePostCategoryAdminItem> = [
    {
      title: 'Danh mục',
      key: 'category',
      width: 260,
      render: (_, item) => (
        <div className="trade-category-cell">
          <Typography.Text strong>{item.name}</Typography.Text>
          <Typography.Text code>{item.code}</Typography.Text>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string | null) => description || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      align: 'center',
    },
    {
      title: 'Chi tiết khuyến mãi',
      dataIndex: 'requiresPromotionDetails',
      key: 'requiresPromotionDetails',
      width: 175,
      align: 'center',
      render: (required: boolean) => (
        <Tag color={required ? 'purple' : 'default'}>{required ? 'Bắt buộc' : 'Không yêu cầu'}</Tag>
      ),
    },
    {
      title: 'Số tin',
      dataIndex: 'postCount',
      key: 'postCount',
      width: 95,
      align: 'right',
      render: (postCount: number) => postCount.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_, item) => {
        if (item.deletedAt) return <Tag color="red">Đã xóa</Tag>;
        return (
          <Tag color={item.isActive ? 'green' : 'default'}>
            {item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          </Tag>
        );
      },
    },
    {
      title: 'Cập nhật lúc',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: formatDate,
    },
  ];

  if (categoriesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được danh mục tin giao thương"
        description={describeError(categoriesQuery.error)}
        action={(
          <Button size="small" icon={<ReloadOutlined />} onClick={() => void categoriesQuery.refetch()}>
            Thử lại
          </Button>
        )}
      />
    );
  }

  return (
    <div className="trade-categories-tab">
      <div className="trade-categories-tab__summary">
        <div>
          <Typography.Title level={4}>Danh mục tin giao thương</Typography.Title>
          <Typography.Text type="secondary">
            Tổng cộng {categoriesQuery.data?.meta.total ?? 0} danh mục, bao gồm cả đang ngừng hoạt động.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo danh mục
          </Button>
        </Space>
      </div>

      <div className="trade-categories-tab__filters">
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo mã hoặc tên danh mục"
          value={searchDraft}
          onChange={(event) => {
            const value = event.target.value;
            setSearchDraft(value);
            if (!value && query.search) {
              setQuery((current) => ({ ...current, page: 1, search: undefined }));
            }
          }}
          onSearch={(search) => setQuery((current) => ({
            ...current,
            page: 1,
            search: search.trim() || undefined,
          }))}
        />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          options={STATUS_OPTIONS}
          value={query.isActive === undefined ? undefined : String(query.isActive)}
          onChange={(value?: string) => setQuery((current) => ({
            ...current,
            page: 1,
            isActive: value === undefined ? undefined : value === 'true',
          }))}
        />
      </div>

      <Table<TradePostCategoryAdminItem>
        rowKey="id"
        columns={columns}
        dataSource={categoriesQuery.data?.data ?? []}
        loading={categoriesQuery.isLoading || categoriesQuery.isFetching}
        scroll={{ x: 1100 }}
        className="trade-moderation-table"
        locale={{ emptyText: 'Chưa có danh mục tin giao thương phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: categoriesQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} danh mục`,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />

      <TradePostCategoryFormModal
        open={createOpen}
        confirmLoading={createMutation.isPending}
        serverError={createError}
        onCancel={closeCreate}
        onSubmit={(input) => {
          setCreateError(undefined);
          createMutation.mutate(input);
        }}
      />
    </div>
  );
}
