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
  deleteHistoricalSite,
  fetchHistoricalSites,
  reorderHistoricalSites,
  updateHistoricalSiteStatus,
} from '../../../api/historical-sites';
import type {
  HistoricalSiteAdminItem,
  HistoricalSiteQuery,
  HistoricalSiteRank,
} from '../../../types/historical-site';
import { describeHistoricalSiteError } from './historical-site-errors';
import './historical-sites.css';

const RANK_COLORS: Record<HistoricalSiteRank, string> = {
  'Cấp quốc gia': 'red',
  'Cấp tỉnh': 'blue',
  'Chưa xếp hạng': 'default',
};

export function HistoricalSitesPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<HistoricalSiteQuery>({ page: 1, limit: 20 });

  const sitesQuery = useQuery({
    queryKey: ['admin-historical-sites', query],
    queryFn: ({ signal }) => fetchHistoricalSites(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-historical-sites'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: HistoricalSiteAdminItem; isActive: boolean }) =>
      updateHistoricalSiteStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị di tích' : 'Đã ẩn di tích');
      refresh();
    },
    onError: (error: unknown) => message.error(describeHistoricalSiteError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHistoricalSite,
    onSuccess: () => {
      message.success('Đã xóa di tích');
      refresh();
    },
    onError: (error: unknown) => message.error(describeHistoricalSiteError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderHistoricalSites,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự');
      refresh();
    },
    onError: (error: unknown) => message.error(describeHistoricalSiteError(error)),
  });

  const rows = sitesQuery.data?.data ?? [];

  function move(item: HistoricalSiteAdminItem, direction: -1 | 1): void {
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: HistoricalSiteAdminItem): void {
    Modal.confirm({
      title: 'Xóa di tích?',
      content: `“${item.name}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const columns: ColumnsType<HistoricalSiteAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null | undefined, item) =>
        url ? (
          <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div className="historical-sites-page__no-image">Chưa có</div>
        ),
    },
    { title: 'Tên di tích', dataIndex: 'name', ellipsis: true },
    {
      title: 'Xếp hạng',
      dataIndex: 'rank',
      width: 130,
      render: (rank: HistoricalSiteRank) => <Tag color={RANK_COLORS[rank]}>{rank}</Tag>,
    },
    { title: 'Địa chỉ', dataIndex: 'address', ellipsis: true },
    {
      title: 'Năm công nhận',
      dataIndex: 'recognizedYear',
      width: 120,
      align: 'center',
      render: (year?: number | null) => year ?? '—',
    },
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
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/historical-sites/${item.id}`)}>Sửa</Button>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />
        </Space>
      ),
    },
  ];

  if (sitesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Di tích lịch sử"
        description={describeHistoricalSiteError(sitesQuery.error)}
        action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void sitesQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="historical-sites-page">
      <div className="historical-sites-page__header">
        <div>
          <Typography.Title level={3}>Quản lý Di tích lịch sử</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {sitesQuery.data?.meta.total ?? 0} di tích, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/historical-sites/new')}>Thêm di tích mới</Button>
      </div>

      <div className="historical-sites-page__filters">
        <Select
          allowClear
          placeholder="Tất cả xếp hạng"
          style={{ width: 190 }}
          options={['Cấp quốc gia', 'Cấp tỉnh', 'Chưa xếp hạng'].map((value) => ({ value, label: value }))}
          onChange={(rank?: HistoricalSiteRank) => setQuery((current) => ({ ...current, page: 1, rank }))}
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
        loading={sitesQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1180 }}
        locale={{ emptyText: 'Chưa có di tích phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: sitesQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}

