import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  PhoneOutlined,
  SearchOutlined,
  ShopOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { JSX } from 'react';
import { useState } from 'react';
import {
  approveTradePost,
  deleteTradePost,
  fetchAdminTradePostDetail,
  fetchAdminTradePosts,
  hideTradePost,
  rejectTradePost,
  setTradePostFeatured,
  unhideTradePost,
} from '../../api/trade-posts';
import { ApiError } from '../../types/api';
import {
  TRADE_POST_CATEGORY_LABEL,
  TRADE_POST_STATUS_COLOR,
  TRADE_POST_STATUS_LABEL,
  type TradePost,
  type TradePostCategory,
  type TradePostStatus,
} from '../../types/trade-post';
import { TradePostCategoriesTab } from './TradePostCategoriesTab';
import './trade-posts-page.css';

const STATUS_OPTIONS = Object.entries(TRADE_POST_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const CATEGORY_OPTIONS = Object.entries(TRADE_POST_CATEGORY_LABEL).map(([value, label]) => ({ value, label }));

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

export function TradePostsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<TradePostStatus>();
  const [category, setCategory] = useState<TradePostCategory>();
  const [search, setSearch] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TradePost | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-trade-posts', { page, limit, status, category, search }],
    queryFn: () => fetchAdminTradePosts({ page, limit, status, category, search, sortBy: 'newest' }),
    placeholderData: (previous) => previous,
  });

  const { data: selectedPost, isLoading: isDetailLoading } = useQuery({
    queryKey: ['admin-trade-post-detail', selectedId],
    queryFn: () => fetchAdminTradePostDetail(selectedId!),
    enabled: !!selectedId,
  });

  function invalidate(): void {
    void queryClient.invalidateQueries({ queryKey: ['admin-trade-posts'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-trade-post-detail'] });
  }

  function onMutationError(error: unknown): void {
    if (error instanceof ApiError) {
      if (error.code === 'INVALID_STATUS_TRANSITION') {
        message.error('Trạng thái tin đã thay đổi. Danh sách đang được tải lại.');
        invalidate();
        return;
      }
      message.error(error.message);
      return;
    }
    message.error('Thao tác thất bại, vui lòng thử lại');
  }

  const approveMutation = useMutation({
    mutationFn: approveTradePost,
    onSuccess: () => {
      message.success('Đã duyệt và xuất bản tin giao thương');
      setSelectedId(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectTradePost(id, reason),
    onSuccess: () => {
      message.success('Đã từ chối tin giao thương');
      setRejectTarget(null);
      setRejectReason('');
      setSelectedId(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const hideMutation = useMutation({
    mutationFn: hideTradePost,
    onSuccess: () => {
      message.success('Đã ẩn tin giao thương');
      setSelectedId(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const unhideMutation = useMutation({
    mutationFn: unhideTradePost,
    onSuccess: () => {
      message.success('Đã hiển thị lại tin giao thương');
      setSelectedId(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTradePost,
    onSuccess: () => {
      message.success('Đã xóa tin giao thương');
      setSelectedId(null);
      invalidate();
    },
    onError: onMutationError,
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => setTradePostFeatured(id, featured),
    onSuccess: invalidate,
    onError: onMutationError,
  });

  function openReject(post: TradePost): void {
    setSelectedId(null);
    setRejectTarget(post);
    setRejectReason('');
  }

  return (
    <div className="trade-moderation-page">
      <div className="trade-moderation-header">
        <div>
          <Typography.Title level={2}>Duyệt tin giao thương</Typography.Title>
          <Typography.Paragraph>
            Kiểm tra nội dung, thông tin liên hệ và quyết định xuất bản tin trên LocalGo.
          </Typography.Paragraph>
        </div>
        <Tag color="gold" icon={<ShopOutlined />} className="trade-moderation-header__tag">
          {data?.data.filter((post) => post.status === 'PENDING').length ?? 0} tin chờ duyệt
        </Tag>
      </div>

      <Tabs
        defaultActiveKey="moderation"
        items={[
          {
            key: 'moderation',
            label: (
              <span>
                <ShopOutlined /> Duyệt tin
              </span>
            ),
            children: (
              <div className="trade-moderation-card">
                <div className="trade-moderation-toolbar">
                  <Input.Search
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tìm theo tiêu đề, mô tả hoặc địa chỉ"
                    className="trade-moderation-search"
                    onSearch={(value) => {
                      setSearch(value.trim() || undefined);
                      setPage(1);
                    }}
                  />
                  <Select
                    allowClear
                    placeholder="Trạng thái"
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={(value) => {
                      setStatus(value);
                      setPage(1);
                    }}
                  />
                  <Select
                    allowClear
                    placeholder="Loại tin"
                    options={CATEGORY_OPTIONS}
                    value={category}
                    onChange={(value) => {
                      setCategory(value);
                      setPage(1);
                    }}
                  />
                </div>

                <Table<TradePost>
                  rowKey="id"
                  loading={isLoading || isFetching}
                  dataSource={data?.data}
                  scroll={{ x: 1100 }}
                  className="trade-moderation-table"
                  onRow={(record) => ({ onDoubleClick: () => setSelectedId(record.id) })}
                  pagination={{
                    current: page,
                    pageSize: limit,
                    total: data?.meta.total,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} tin giao thương`,
                    onChange: (nextPage, nextPageSize) => {
                      setPage(nextPage);
                      setLimit(nextPageSize);
                    },
                  }}
                  columns={[
                    {
                      title: 'Tin giao thương',
                      key: 'post',
                      width: 360,
                      render: (_, record) => (
                        <div className="trade-post-cell">
                          <Avatar shape="square" size={54} src={record.thumbnailUrl} icon={<ShopOutlined />} />
                          <div>
                            <Typography.Text strong>{record.title}</Typography.Text>
                            <Typography.Text type="secondary">{record.summary}</Typography.Text>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Người đăng',
                      key: 'owner',
                      width: 230,
                      render: (_, record) => (
                        <div className="trade-owner-cell">
                          <Avatar src={record.owner?.avatarUrl} icon={<UserOutlined />} />
                          <div>
                            <Typography.Text strong>
                              {record.owner?.displayName ?? `Tài khoản ${record.ownerId.slice(0, 8)}`}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {record.owner?.email ?? record.owner?.phone ?? record.ownerId}
                            </Typography.Text>
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'Loại tin',
                      dataIndex: 'category',
                      key: 'category',
                      width: 130,
                      render: (value: TradePostCategory) => TRADE_POST_CATEGORY_LABEL[value],
                    },
                    {
                      title: 'Giá',
                      key: 'price',
                      width: 145,
                      render: (_, record) => record.priceLabel ?? record.price ?? '—',
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 140,
                      render: (value: TradePostStatus) => (
                        <Tag color={TRADE_POST_STATUS_COLOR[value]}>{TRADE_POST_STATUS_LABEL[value]}</Tag>
                      ),
                    },
                    {
                      title: 'Nổi bật',
                      dataIndex: 'featured',
                      key: 'featured',
                      width: 90,
                      align: 'center',
                      render: (featured: boolean, record) => (
                        <Switch
                          size="small"
                          checked={featured}
                          disabled={record.status !== 'PUBLISHED'}
                          loading={featureMutation.isPending && featureMutation.variables?.id === record.id}
                          onChange={(checked) => featureMutation.mutate({ id: record.id, featured: checked })}
                        />
                      ),
                    },
                    {
                      title: 'Ngày gửi',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                      width: 165,
                      render: formatDate,
                    },
                    {
                      title: 'Thao tác',
                      key: 'actions',
                      fixed: 'right',
                      width: 245,
                      render: (_, record) => (
                        <Space size={6}>
                          <Tooltip title="Xem chi tiết">
                            <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedId(record.id)} />
                          </Tooltip>
                          {record.status === 'PENDING' && (
                            <>
                              <Popconfirm
                                title="Duyệt và xuất bản tin?"
                                description="Tin sẽ hiển thị công khai trên LocalGo."
                                okText="Duyệt tin"
                                cancelText="Hủy"
                                onConfirm={() => approveMutation.mutate(record.id)}
                              >
                                <Button size="small" type="primary" loading={approveMutation.isPending && approveMutation.variables === record.id}>
                                  Duyệt
                                </Button>
                              </Popconfirm>
                              <Button size="small" danger onClick={() => openReject(record)}>Từ chối</Button>
                            </>
                          )}
                          {record.status === 'PUBLISHED' && (
                            <>
                              <Popconfirm
                                title="Ẩn tin đã xuất bản?"
                                description="Tin sẽ không còn hiển thị công khai trên LocalGo."
                                okText="Ẩn tin"
                                cancelText="Hủy"
                                onConfirm={() => hideMutation.mutate(record.id)}
                              >
                                <Button
                                  size="small"
                                  icon={<EyeInvisibleOutlined />}
                                  loading={hideMutation.isPending && hideMutation.variables === record.id}
                                >
                                  Ẩn
                                </Button>
                              </Popconfirm>
                              <Popconfirm
                                title="Xóa tin đã xuất bản?"
                                description="Tin sẽ bị xóa khỏi hệ thống và không còn hiển thị trong danh sách."
                                okText="Xóa tin"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => deleteMutation.mutate(record.id)}
                              >
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                                >
                                  Xóa
                                </Button>
                              </Popconfirm>
                            </>
                          )}
                          {record.status === 'HIDDEN' && (
                            <>
                              <Popconfirm
                                title="Hiển thị lại tin?"
                                okText="Hiển thị"
                                cancelText="Hủy"
                                onConfirm={() => unhideMutation.mutate(record.id)}
                              >
                                <Button
                                  size="small"
                                  icon={<EyeOutlined />}
                                  loading={unhideMutation.isPending && unhideMutation.variables === record.id}
                                >
                                  Hiện
                                </Button>
                              </Popconfirm>
                              <Popconfirm
                                title="Xóa tin đang bị ẩn?"
                                okText="Xóa tin"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                onConfirm={() => deleteMutation.mutate(record.id)}
                              >
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  loading={deleteMutation.isPending && deleteMutation.variables === record.id}
                                >
                                  Xóa
                                </Button>
                              </Popconfirm>
                            </>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'categories',
            label: (
              <span>
                <AppstoreOutlined /> Danh mục tin giao thương
              </span>
            ),
            children: <TradePostCategoriesTab />,
          },
        ]}
      />

      <Drawer
        title="Chi tiết tin giao thương"
        open={!!selectedId}
        size={720}
        loading={isDetailLoading}
        onClose={() => setSelectedId(null)}
        extra={selectedPost?.status === 'PENDING' ? (
          <Space>
            <Button danger onClick={() => openReject(selectedPost)}>Từ chối</Button>
            <Popconfirm
              title="Duyệt và xuất bản tin?"
              description="Tin sẽ hiển thị công khai trên LocalGo."
              okText="Duyệt tin"
              cancelText="Hủy"
              onConfirm={() => approveMutation.mutate(selectedPost.id)}
            >
              <Button type="primary" icon={<CheckCircleOutlined />} loading={approveMutation.isPending}>
                Duyệt tin
              </Button>
            </Popconfirm>
          </Space>
        ) : undefined}
      >
        {selectedPost && (
          <article className="trade-post-detail">
            <Image
              src={selectedPost.thumbnailUrl ?? undefined}
              fallback="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
              className="trade-post-detail__cover"
            />
            <div className="trade-post-detail__meta">
              <Tag color="purple">{TRADE_POST_CATEGORY_LABEL[selectedPost.category]}</Tag>
              <Tag color={TRADE_POST_STATUS_COLOR[selectedPost.status]}>
                {TRADE_POST_STATUS_LABEL[selectedPost.status]}
              </Tag>
              {selectedPost.featured && <Tag color="gold" icon={<StarFilled />}>Nổi bật</Tag>}
            </div>
            <Typography.Title level={3}>{selectedPost.title}</Typography.Title>
            <Typography.Paragraph className="trade-post-detail__summary">
              {selectedPost.summary}
            </Typography.Paragraph>

            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Giá">{selectedPost.priceLabel ?? selectedPost.price ?? 'Liên hệ'}</Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">{formatDate(selectedPost.createdAt)}</Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> Địa chỉ</>} span={2}>{selectedPost.address}</Descriptions.Item>
            </Descriptions>

            <Typography.Title level={5}>Nội dung chi tiết</Typography.Title>
            <Typography.Paragraph className="trade-post-detail__description">
              {selectedPost.description}
            </Typography.Paragraph>

            <Typography.Title level={5}>Người đăng tin</Typography.Title>
            <div className="trade-owner-detail">
              <Avatar size={46} src={selectedPost.owner?.avatarUrl} icon={<UserOutlined />} />
              <div className="trade-owner-detail__identity">
                <strong>{selectedPost.owner?.displayName ?? 'Chưa có thông tin tài khoản'}</strong>
                <Space size={6} wrap>
                  <Tag color={selectedPost.owner?.role === 'BUSINESS' ? 'purple' : 'blue'}>
                    {selectedPost.owner?.role === 'BUSINESS' ? 'Business' : 'Người dùng'}
                  </Tag>
                  {selectedPost.owner && (
                    <Tag color={selectedPost.owner.status === 'ACTIVE' ? 'green' : 'red'}>
                      {selectedPost.owner.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                    </Tag>
                  )}
                </Space>
              </div>
              <div className="trade-owner-detail__contact">
                <span>{selectedPost.owner?.email ?? 'Chưa có email'}</span>
                <span>{selectedPost.owner?.phone ?? 'Chưa có số điện thoại'}</span>
                <small>ID: {selectedPost.ownerId}</small>
              </div>
            </div>

            <Typography.Title level={5}>Thông tin liên hệ</Typography.Title>
            <div className="trade-contact-card">
              <Avatar icon={<UserOutlined />} />
              <div>
                <strong>{selectedPost.contactName}</strong>
                <span><PhoneOutlined /> {selectedPost.contactPhone}</span>
                {selectedPost.contactZalo && <small>Zalo: {selectedPost.contactZalo}</small>}
              </div>
            </div>

            {selectedPost.rejectedReason && (
              <div className="trade-rejection-reason">
                <strong>Lý do từ chối</strong>
                <p>{selectedPost.rejectedReason}</p>
              </div>
            )}
          </article>
        )}
      </Drawer>

      <Modal
        title={`Từ chối tin: ${rejectTarget?.title ?? ''}`}
        open={!!rejectTarget}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onOk={() => {
          if (!rejectTarget) return;
          if (rejectReason.trim().length < 10) {
            message.warning('Vui lòng nhập lý do từ chối tối thiểu 10 ký tự');
            return;
          }
          rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
        }}
        confirmLoading={rejectMutation.isPending}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph type="secondary">
          Lý do sẽ được gửi cho người đăng để chỉnh sửa nội dung.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          placeholder="Nêu rõ nội dung hoặc thông tin cần chỉnh sửa..."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}
