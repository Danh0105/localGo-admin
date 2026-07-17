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
  deleteFeedbackChannel,
  fetchFeedbackChannels,
  reorderFeedbackChannels,
  updateFeedbackChannelStatus,
} from '../../../api/feedback-channels';
import { FEEDBACK_CATEGORIES, type FeedbackCategory, type FeedbackChannelAdminItem, type FeedbackChannelQuery } from '../../../types/feedback-channel';
import { describeFeedbackChannelError } from './feedback-channel-errors';
import './feedback-channels.css';

const CATEGORY_COLORS: Record<FeedbackCategory, string> = {
  'Góp ý chung': 'blue',
  'Phản ánh hạ tầng': 'volcano',
  'Dịch vụ công': 'purple',
  'Du lịch': 'cyan',
  'Mini App': 'green',
};

export function FeedbackChannelsPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<FeedbackChannelQuery>({ page: 1, limit: 20 });

  const channelsQuery = useQuery({
    queryKey: ['admin-feedback-channels', query],
    queryFn: ({ signal }) => fetchFeedbackChannels(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-feedback-channels'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: FeedbackChannelAdminItem; isActive: boolean }) =>
      updateFeedbackChannelStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị kênh phản hồi' : 'Đã ẩn kênh phản hồi');
      refresh();
    },
    onError: (error: unknown) => message.error(describeFeedbackChannelError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeedbackChannel,
    onSuccess: () => {
      message.success('Đã xóa kênh phản hồi');
      refresh();
    },
    onError: (error: unknown) => message.error(describeFeedbackChannelError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFeedbackChannels,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự');
      refresh();
    },
    onError: (error: unknown) => message.error(describeFeedbackChannelError(error)),
  });

  function move(item: FeedbackChannelAdminItem, direction: -1 | 1): void {
    const rows = channelsQuery.data?.data ?? [];
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: FeedbackChannelAdminItem): void {
    Modal.confirm({
      title: 'Xóa kênh phản hồi?',
      content: `“${item.title}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const rows = channelsQuery.data?.data ?? [];
  const columns: ColumnsType<FeedbackChannelAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null, item) =>
        url ? (
          <Image src={url} alt={item.imageAlt || item.title} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
        ) : (
          <div className="feedback-channels-page__no-image">Chưa có</div>
        ),
    },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 150,
      render: (category: FeedbackCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Thời gian phản hồi', dataIndex: 'responseTime', width: 190, ellipsis: true },
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
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/feedback-channels/${item.id}`)}>Sửa</Button>
          <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" onClick={() => confirmDelete(item)} />
        </Space>
      ),
    },
  ];

  if (channelsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách kênh phản hồi"
        description={describeFeedbackChannelError(channelsQuery.error)}
        action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void channelsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="feedback-channels-page">
      <div className="feedback-channels-page__header">
        <div>
          <Typography.Title level={3}>Kênh phản hồi</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {channelsQuery.data?.meta.total ?? 0} kênh, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/feedback-channels/new')}>Thêm kênh phản hồi</Button>
      </div>

      <div className="feedback-channels-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 190 }}
          options={FEEDBACK_CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category?: FeedbackCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tiêu đề"
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
        loading={channelsQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1100 }}
        locale={{ emptyText: 'Chưa có kênh phản hồi phù hợp' }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: channelsQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}
