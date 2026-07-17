import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Rate, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useState } from 'react';
import { fetchAdminReviews, moderateReview } from '../../api/reviews';
import { ApiError } from '../../types/api';
import {
  TRADE_REVIEW_STATUS_COLOR,
  TRADE_REVIEW_STATUS_LABEL,
  type TradeReview,
  type TradeReviewStatus,
} from '../../types/trade-review';

const STATUS_OPTIONS = Object.entries(TRADE_REVIEW_STATUS_LABEL).map(([value, label]) => ({
  value,
  label,
}));

export function ReviewsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<TradeReviewStatus | undefined>();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-reviews', { page, limit, status }],
    queryFn: () => fetchAdminReviews({ page, limit, status }),
    placeholderData: (previous) => previous,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: 'PUBLISHED' | 'HIDDEN' }) =>
      moderateReview(id, next),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái đánh giá');
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
    onError: (error: unknown) => {
      message.error(error instanceof ApiError ? error.message : 'Thao tác thất bại');
    },
  });

  return (
    <div>
      <Typography.Title level={3}>Đánh giá</Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          options={STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </Space>

      <Table<TradeReview>
        rowKey="id"
        loading={isLoading || isFetching}
        dataSource={data?.data}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta.total,
          showSizeChanger: true,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setLimit(nextPageSize);
          },
        }}
        columns={[
          {
            title: 'Số sao',
            dataIndex: 'rating',
            key: 'rating',
            render: (value: number) => <Rate disabled value={value} />,
          },
          {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
          },
          { title: 'Tin giao thương', dataIndex: 'tradePostId', key: 'tradePostId', ellipsis: true },
          { title: 'Người đánh giá', dataIndex: 'userId', key: 'userId', ellipsis: true },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (value: TradeReviewStatus) => (
              <Tag color={TRADE_REVIEW_STATUS_COLOR[value]}>{TRADE_REVIEW_STATUS_LABEL[value]}</Tag>
            ),
          },
          {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (value: string) => new Date(value).toLocaleString('vi-VN'),
          },
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                {record.status !== 'PUBLISHED' && (
                  <Button
                    size="small"
                    type="primary"
                    loading={
                      moderateMutation.isPending &&
                      moderateMutation.variables?.id === record.id &&
                      moderateMutation.variables.next === 'PUBLISHED'
                    }
                    onClick={() => moderateMutation.mutate({ id: record.id, next: 'PUBLISHED' })}
                  >
                    Duyệt
                  </Button>
                )}
                {record.status !== 'HIDDEN' && (
                  <Button
                    size="small"
                    danger
                    loading={
                      moderateMutation.isPending &&
                      moderateMutation.variables?.id === record.id &&
                      moderateMutation.variables.next === 'HIDDEN'
                    }
                    onClick={() => moderateMutation.mutate({ id: record.id, next: 'HIDDEN' })}
                  >
                    Ẩn
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
