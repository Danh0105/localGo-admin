import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Image, Input, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteNewsArticle, fetchNews, updateNewsStatus } from '../../../api/news';
import { useAuthStore } from '../../../store/auth-store';
import { NEWS_CATEGORIES, type NewsAdminArticle, type NewsCategory, type NewsQuery } from '../../../types/news';
import { describeNewsError } from './news-errors';
import './news.css';

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  'Thông báo': 'blue',
  'Hoạt động xã': 'green',
  'Du lịch': 'cyan',
  'Nông nghiệp': 'volcano',
  'Chuyển đổi số': 'purple',
};

function getArticleStatus(article: NewsAdminArticle): { label: string; color: string } {
  if (!article.isActive) return { label: 'Ẩn', color: 'default' };
  if (new Date(article.publishedAt).getTime() > Date.now()) return { label: 'Lên lịch', color: 'gold' };
  return { label: 'Đã đăng', color: 'green' };
}

function formatPublishedAt(value: string): string {
  return Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : value;
}

export function NewsPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<NewsQuery>({ page: 1, limit: 20 });

  const itemsQuery = useQuery({
    queryKey: ['admin-news', query],
    queryFn: ({ signal }) => fetchNews(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-news'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ article, isActive }: { article: NewsAdminArticle; isActive: boolean }) =>
      updateNewsStatus(article.id, isActive, article.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị bài viết' : 'Đã ẩn bài viết');
      refresh();
    },
    onError: (error: unknown) => message.error(describeNewsError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNewsArticle,
    onSuccess: () => {
      message.success('Đã xóa bài viết');
      refresh();
    },
    onError: (error: unknown) => message.error(describeNewsError(error)),
  });

  const rows = (itemsQuery.data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  function confirmDelete(article: NewsAdminArticle): void {
    Modal.confirm({
      title: 'Xóa bài viết?',
      content: `“${article.title}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(article.id),
    });
  }

  const columns: ColumnsType<NewsAdminArticle> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null | undefined, article) => url ? (
        <Image src={url} alt={article.imageAlt || article.title} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div className="news-page__no-image">Chưa có</div>
      ),
    },
    { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 140,
      render: (category: NewsCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Ngày đăng', dataIndex: 'publishedAt', width: 170, render: formatPublishedAt },
    { title: 'Tác giả', dataIndex: 'author', width: 150, ellipsis: true },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 115,
      render: (_, article) => {
        const status = getArticleStatus(article);
        return <Tag color={status.color}>{status.label}</Tag>;
      },
    },
    {
      title: 'Hiển thị',
      dataIndex: 'isActive',
      width: 105,
      render: (isActive: boolean, article) => (
        <Switch
          checked={isActive}
          checkedChildren="Hiện"
          unCheckedChildren="Ẩn"
          disabled={!canManage}
          loading={statusMutation.isPending}
          onChange={(checked) => statusMutation.mutate({ article, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: canManage ? 150 : 90,
      fixed: 'right',
      render: (_, article) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/news/${article.id}`)}>
            {canManage ? 'Sửa' : 'Xem'}
          </Button>
          {canManage && <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(article)} />}
        </Space>
      ),
    },
  ];

  if (itemsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Tin tức"
        description={describeNewsError(itemsQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="news-page">
      <div className="news-page__header">
        <div>
          <Typography.Title level={3}>Quản lý Tin tức</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {itemsQuery.data?.meta.total ?? 0} bài viết, bao gồm cả đang ẩn và lên lịch.</Typography.Text>
        </div>
        {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/news/new')}>Viết bài mới</Button>}
      </div>

      {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}

      <div className="news-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 190 }}
          options={NEWS_CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category?: NewsCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
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
        loading={itemsQuery.isLoading || deleteMutation.isPending}
        scroll={{ x: 1150 }}
        locale={{ emptyText: 'Chưa có bài viết phù hợp' }}
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
