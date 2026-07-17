import { ArrowLeftOutlined, PhoneOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Descriptions, Input, Row, Select, Skeleton, Tag, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchFeedbackTicket, updateFeedbackTicketStatus } from '../../../api/feedback-tickets';
import {
  FEEDBACK_TICKET_STATUS_COLOR,
  FEEDBACK_TICKET_STATUS_LABEL,
  FEEDBACK_TICKET_STATUS_TRANSITIONS,
  FEEDBACK_TICKET_STATUSES,
  type FeedbackTicketStatus,
} from '../../../types/feedback-ticket';
import { describeFeedbackTicketError } from './feedback-ticket-errors';
import './feedback-tickets.css';

function formatDateTime(value: string): string {
  return Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : value;
}

export function FeedbackTicketDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<FeedbackTicketStatus | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const ticketQuery = useQuery({
    queryKey: ['admin-feedback-ticket', id],
    queryFn: ({ signal }) => fetchFeedbackTicket(id!, signal),
    enabled: !!id,
  });

  useEffect(() => {
    if (ticketQuery.data) {
      setNextStatus(ticketQuery.data.status);
      setAdminNote(ticketQuery.data.adminNote ?? '');
    }
  }, [ticketQuery.data]);

  const statusMutation = useMutation({
    mutationFn: (payload: { status: FeedbackTicketStatus; adminNote?: string }) => updateFeedbackTicketStatus(id!, payload),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-feedback-ticket', id], saved);
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback-tickets'] });
      message.success('Đã cập nhật trạng thái phản hồi');
    },
    onError: (error: unknown) => message.error(describeFeedbackTicketError(error)),
  });

  if (ticketQuery.isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (ticketQuery.isError || !ticketQuery.data) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được phản hồi"
        description={describeFeedbackTicketError(ticketQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void ticketQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  const ticket = ticketQuery.data;
  const allowedNextStatuses = FEEDBACK_TICKET_STATUS_TRANSITIONS[ticket.status];
  const noteChanged = adminNote !== (ticket.adminNote ?? '');
  const statusChanged = nextStatus !== null && nextStatus !== ticket.status;
  const canSubmit = (statusChanged || noteChanged) && adminNote.length <= 2000;

  return (
    <div className="feedback-ticket-detail-page">
      <div className="feedback-ticket-detail-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/content/feedback-tickets')}>
            Danh sách
          </Button>
          <Typography.Title level={3}>Phản hồi {ticket.ticketCode}</Typography.Title>
        </div>
        <Tag color={FEEDBACK_TICKET_STATUS_COLOR[ticket.status]}>{FEEDBACK_TICKET_STATUS_LABEL[ticket.status]}</Tag>
      </div>

      <div className="feedback-ticket-detail-page__content">
        <Card title="Thông tin người gửi">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Họ tên">{ticket.fullName}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              <a href={`tel:${ticket.phone}`} aria-label={`Gọi cho ${ticket.fullName}`}>
                <PhoneOutlined /> {ticket.phone}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="Kênh liên quan">
              {ticket.channelId ? (
                <a onClick={() => navigate(`/content/feedback-channels/${ticket.channelId}`)}>{ticket.channelTitle ?? ticket.channelId}</a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian gửi">{formatDateTime(ticket.submittedAt)}</Descriptions.Item>
            <Descriptions.Item label="Người xử lý gần nhất">
              {ticket.lastHandledBy ? `${ticket.lastHandledBy} · ${ticket.lastHandledAt ? formatDateTime(ticket.lastHandledAt) : ''}` : 'Chưa có'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Nội dung phản hồi">
          <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{ticket.content}</Typography.Paragraph>
        </Card>

        <Card title="Xử lý phản hồi">
          <Row gutter={16}>
            <Col xs={24} lg={8}>
              <Typography.Text>Trạng thái mới</Typography.Text>
              <Select
                style={{ width: '100%', marginTop: 8 }}
                value={nextStatus ?? ticket.status}
                onChange={(value: FeedbackTicketStatus) => setNextStatus(value)}
                options={FEEDBACK_TICKET_STATUSES.map((status) => ({
                  value: status,
                  label: FEEDBACK_TICKET_STATUS_LABEL[status],
                  disabled: !allowedNextStatuses.includes(status),
                }))}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 16 }}>
            <Typography.Text>Ghi chú nội bộ</Typography.Text>
            <Input.TextArea
              style={{ marginTop: 8 }}
              rows={4}
              maxLength={2000}
              showCount
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Ghi chú cho cán bộ xử lý, không hiển thị cho người dân"
            />
          </div>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            style={{ marginTop: 16 }}
            loading={statusMutation.isPending}
            disabled={!canSubmit || statusMutation.isPending}
            onClick={() => statusMutation.mutate({ status: nextStatus ?? ticket.status, adminNote: adminNote.trim() || undefined })}
          >
            Cập nhật
          </Button>
        </Card>
      </div>
    </div>
  );
}
