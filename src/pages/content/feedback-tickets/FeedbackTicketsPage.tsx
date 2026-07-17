import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, DatePicker, Input, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JSX } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFeedbackChannels } from '../../../api/feedback-channels';
import { fetchFeedbackTickets } from '../../../api/feedback-tickets';
import {
  FEEDBACK_TICKET_STATUSES,
  FEEDBACK_TICKET_STATUS_COLOR,
  FEEDBACK_TICKET_STATUS_LABEL,
  type FeedbackTicketListItem,
  type FeedbackTicketQuery,
  type FeedbackTicketStatus,
} from '../../../types/feedback-ticket';
import { describeFeedbackTicketError } from './feedback-ticket-errors';
import './feedback-tickets.css';

export function FeedbackTicketsPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<FeedbackTicketQuery>({ page: 1, limit: 20 });

  const channelOptionsQuery = useQuery({
    queryKey: ['admin-feedback-channels-options'],
    queryFn: ({ signal }) => fetchFeedbackChannels({ page: 1, limit: 100 }, signal),
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-feedback-tickets', query],
    queryFn: ({ signal }) => fetchFeedbackTickets(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-feedback-tickets'] });
  };

  const rows = (ticketsQuery.data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const columns: ColumnsType<FeedbackTicketListItem> = [
    { title: 'Mã ticket', dataIndex: 'ticketCode', width: 130 },
    { title: 'Họ tên', dataIndex: 'fullName', ellipsis: true },
    { title: 'Số điện thoại', dataIndex: 'phoneMasked', width: 140 },
    { title: 'Kênh', dataIndex: 'channelTitle', ellipsis: true, render: (channelTitle: string | null) => channelTitle ?? '—' },
    { title: 'Nội dung', dataIndex: 'contentSummary', ellipsis: true },
    {
      title: 'Thời gian gửi',
      dataIndex: 'submittedAt',
      width: 170,
      render: (value: string) => (Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : value),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (status: FeedbackTicketStatus) => <Tag color={FEEDBACK_TICKET_STATUS_COLOR[status]}>{FEEDBACK_TICKET_STATUS_LABEL[status]}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, item) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/content/feedback-tickets/${item.id}`)}>
          Xem
        </Button>
      ),
    },
  ];

  if (ticketsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được hộp thư phản hồi"
        description={describeFeedbackTicketError(ticketsQuery.error)}
        action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void ticketsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="feedback-tickets-page">
      <div className="feedback-tickets-page__header">
        <div>
          <Typography.Title level={3}>Hộp thư phản hồi</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {ticketsQuery.data?.meta.total ?? 0} phản hồi từ người dân.</Typography.Text>
        </div>
      </div>

      <div className="feedback-tickets-page__filters">
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          style={{ width: 170 }}
          options={FEEDBACK_TICKET_STATUSES.map((value) => ({ value, label: FEEDBACK_TICKET_STATUS_LABEL[value] }))}
          onChange={(status?: FeedbackTicketStatus) => setQuery((current) => ({ ...current, page: 1, status }))}
        />
        <Select
          allowClear
          placeholder="Tất cả kênh"
          style={{ width: 220 }}
          loading={channelOptionsQuery.isLoading}
          options={(channelOptionsQuery.data?.data ?? []).map((channel) => ({ value: channel.id, label: channel.title }))}
          onChange={(channelId?: string) => setQuery((current) => ({ ...current, page: 1, channelId }))}
        />
        <DatePicker.RangePicker
          onChange={(range) =>
            setQuery((current) => ({
              ...current,
              page: 1,
              submittedFrom: range?.[0] ? range[0].startOf('day').toISOString() : undefined,
              submittedTo: range?.[1] ? range[1].endOf('day').toISOString() : undefined,
            }))
          }
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo họ tên, SĐT hoặc mã ticket"
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
        loading={ticketsQuery.isLoading}
        scroll={{ x: 1200 }}
        locale={{
          emptyText:
            query.status || query.channelId || query.search || query.submittedFrom
              ? 'Không có phản hồi khớp bộ lọc'
              : 'Chưa có phản hồi nào',
        }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: ticketsQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, limit) => setQuery((current) => ({ ...current, page, limit })),
        }}
      />
    </div>
  );
}
