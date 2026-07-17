import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileProtectOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Statistic,
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
  approveBusinessApplication,
  fetchAdminUsers,
  fetchBusinessApplications,
  rejectBusinessApplication,
  updateUserStatus,
} from '../../api/users';
import { ApiError } from '../../types/api';
import {
  BUSINESS_APPLICATION_STATUS_COLOR,
  BUSINESS_APPLICATION_STATUS_LABEL,
  BUSINESS_APPLICANT_TYPE_LABEL,
  BUSINESS_DOCUMENT_TYPE_LABEL,
  type ApproveBusinessApplicationInput,
  type BusinessApplicantType,
  type BusinessApplication,
  type BusinessApplicationStatus,
} from '../../types/business-application';
import {
  USER_ROLE_COLOR,
  USER_ROLE_LABEL,
  USER_STATUS_COLOR,
  USER_STATUS_LABEL,
  type CurrentUser,
  type UserRole,
  type UserStatus,
} from '../../types/user';
import './users-page.css';

const USER_ROLE_OPTIONS = Object.entries(USER_ROLE_LABEL).map(([value, label]) => ({ value, label }));
const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const APPLICATION_STATUS_OPTIONS = Object.entries(BUSINESS_APPLICATION_STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
);
const APPLICANT_TYPE_OPTIONS = Object.entries(BUSINESS_APPLICANT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function generateInitialPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

function showMutationError(error: unknown): void {
  message.error(error instanceof ApiError ? error.message : 'Thao tác thất bại, vui lòng thử lại');
}

function UsersTable(): JSX.Element {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [role, setRole] = useState<UserRole>();
  const [status, setStatus] = useState<UserStatus>();
  const [search, setSearch] = useState<string>();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', { page, limit, role, status, search }],
    queryFn: () => fetchAdminUsers({ page, limit, role, status, search }),
    placeholderData: (previous) => previous,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: UserStatus }) =>
      updateUserStatus(id, nextStatus),
    onSuccess: (_, variables) => {
      message.success(variables.nextStatus === 'BLOCKED' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: showMutationError,
  });

  return (
    <div className="user-management-section">
      <div className="user-management-toolbar">
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên, email hoặc số điện thoại"
          className="user-management-search"
          onSearch={(value) => {
            setSearch(value.trim() || undefined);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Vai trò"
          options={USER_ROLE_OPTIONS}
          value={role}
          onChange={(value) => {
            setRole(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          options={USER_STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>

      <Table<CurrentUser>
        rowKey="id"
        className="user-management-table"
        loading={isLoading || isFetching}
        dataSource={data?.data}
        scroll={{ x: 920 }}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} người dùng`,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage);
            setLimit(nextLimit);
          },
        }}
        columns={[
          {
            title: 'Người dùng',
            key: 'user',
            width: 280,
            render: (_, record) => (
              <div className="user-identity">
                <Avatar src={record.avatarUrl} size={40} className="user-identity__avatar">
                  {getInitials(record.displayName)}
                </Avatar>
                <div>
                  <Typography.Text strong>{record.displayName}</Typography.Text>
                  <Typography.Text type="secondary">{record.email ?? 'Chưa có email'}</Typography.Text>
                </div>
              </div>
            ),
          },
          {
            title: 'Liên hệ',
            key: 'contact',
            width: 170,
            render: (_, record) => record.phone ?? '—',
          },
          {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 150,
            render: (value: UserRole) => <Tag color={USER_ROLE_COLOR[value]}>{USER_ROLE_LABEL[value]}</Tag>,
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (value: UserStatus) => (
              <Tag color={USER_STATUS_COLOR[value]}>{USER_STATUS_LABEL[value]}</Tag>
            ),
          },
          {
            title: 'Đăng nhập gần nhất',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            width: 175,
            render: (value: string | null) => formatDate(value),
          },
          {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => {
              const isBlocked = record.status === 'BLOCKED';
              const nextStatus: UserStatus = isBlocked ? 'ACTIVE' : 'BLOCKED';
              return (
                <Popconfirm
                  title={isBlocked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
                  description={
                    isBlocked
                      ? 'Người dùng sẽ có thể đăng nhập lại.'
                      : 'Tất cả phiên đăng nhập của người dùng cần được thu hồi.'
                  }
                  okText={isBlocked ? 'Mở khóa' : 'Khóa'}
                  cancelText="Hủy"
                  okButtonProps={{ danger: !isBlocked }}
                  onConfirm={() => statusMutation.mutate({ id: record.id, nextStatus })}
                >
                  <Button
                    size="small"
                    danger={!isBlocked}
                    icon={isBlocked ? <SafetyCertificateOutlined /> : <StopOutlined />}
                    loading={statusMutation.isPending && statusMutation.variables?.id === record.id}
                  >
                    {isBlocked ? 'Mở khóa' : 'Khóa'}
                  </Button>
                </Popconfirm>
              );
            },
          },
        ]}
      />
    </div>
  );
}

function ApplicationDetail({
  application,
  onApprove,
  onReject,
  onClose,
}: {
  application: BusinessApplication | null;
  onApprove: (application: BusinessApplication) => void;
  onReject: (application: BusinessApplication) => void;
  onClose: () => void;
}): JSX.Element {
  if (!application) {
    return <Drawer open={false} onClose={onClose} />;
  }

  const isOrganization = application.applicantType === 'ORGANIZATION';

  return (
    <Drawer
      title="Chi tiết hồ sơ Business"
      open
      size={680}
      onClose={onClose}
      extra={
        application.status === 'PENDING' ? (
          <Space>
            <Button danger onClick={() => onReject(application)}>Từ chối</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onApprove(application)}>
              Duyệt hồ sơ
            </Button>
          </Space>
        ) : undefined
      }
    >
      <div className="application-detail__heading">
        <Avatar
          size={52}
          icon={isOrganization ? <BankOutlined /> : <UserOutlined />}
          className="application-detail__avatar"
        />
        <div>
          <Typography.Title level={4}>{application.businessName}</Typography.Title>
          <Space wrap>
            <Tag color={isOrganization ? 'purple' : 'blue'}>
              {BUSINESS_APPLICANT_TYPE_LABEL[application.applicantType]}
            </Tag>
            <Tag color={BUSINESS_APPLICATION_STATUS_COLOR[application.status]}>
              {BUSINESS_APPLICATION_STATUS_LABEL[application.status]}
            </Tag>
          </Space>
        </div>
      </div>

      <Typography.Title level={5} className="application-detail__title">Thông tin liên hệ</Typography.Title>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="Người liên hệ">{application.contactName}</Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">{application.contactPhone}</Descriptions.Item>
        <Descriptions.Item label="Email">{application.contactEmail}</Descriptions.Item>
        <Descriptions.Item label="Lĩnh vực">{application.businessCategory}</Descriptions.Item>
        <Descriptions.Item label="Địa chỉ" span={2}>{application.address}</Descriptions.Item>
      </Descriptions>

      <Typography.Title level={5} className="application-detail__title">
        {isOrganization ? 'Thông tin pháp lý doanh nghiệp' : 'Thông tin định danh cá nhân'}
      </Typography.Title>
      {isOrganization ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Tên pháp lý" span={2}>{application.legalName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Mã số thuế">{application.taxCode ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Website">{application.website ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Người đại diện">{application.representativeName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Chức vụ">{application.representativeTitle ?? '—'}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Số CCCD">{application.identityNumber ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Ngày cấp">{formatDate(application.identityIssuedAt)}</Descriptions.Item>
          <Descriptions.Item label="Nơi cấp" span={2}>{application.identityIssuedPlace ?? '—'}</Descriptions.Item>
        </Descriptions>
      )}

      <Typography.Title level={5} className="application-detail__title">Hồ sơ đính kèm</Typography.Title>
      {application.documents.length ? (
        <div className="application-documents">
          {application.documents.map((document) => (
            <a href={document.url} target="_blank" rel="noreferrer" key={document.id}>
              <FileProtectOutlined />
              <span>
                <strong>{BUSINESS_DOCUMENT_TYPE_LABEL[document.type]}</strong>
                <small>{document.name}</small>
              </span>
              <EyeOutlined />
            </a>
          ))}
        </div>
      ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tài liệu" />}

      {application.description && (
        <>
          <Typography.Title level={5} className="application-detail__title">Giới thiệu</Typography.Title>
          <Typography.Paragraph>{application.description}</Typography.Paragraph>
        </>
      )}

      {application.status === 'REJECTED' && (
        <div className="application-rejection">
          <strong>Lý do từ chối</strong>
          <p>{application.rejectionReason}</p>
        </div>
      )}
    </Drawer>
  );
}

function BusinessApplicationsTable(): JSX.Element {
  const queryClient = useQueryClient();
  const [approveForm] = Form.useForm<ApproveBusinessApplicationInput>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<BusinessApplicationStatus>();
  const [applicantType, setApplicantType] = useState<BusinessApplicantType>();
  const [search, setSearch] = useState<string>();
  const [detail, setDetail] = useState<BusinessApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<BusinessApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<BusinessApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-business-applications', { page, limit, status, applicantType, search }],
    queryFn: () => fetchBusinessApplications({ page, limit, status, applicantType, search }),
    placeholderData: (previous) => previous,
  });

  function invalidate(): void {
    void queryClient.invalidateQueries({ queryKey: ['admin-business-applications'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }

  function openApprove(application: BusinessApplication): void {
    setDetail(null);
    setApproveTarget(application);
    approveForm.setFieldsValue({
      displayName: application.businessName,
      email: application.contactEmail,
      initialPassword: generateInitialPassword(),
    });
  }

  const approveMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ApproveBusinessApplicationInput }) =>
      approveBusinessApplication(id, input),
    onSuccess: () => {
      message.success('Đã duyệt hồ sơ và tạo tài khoản BUSINESS');
      setApproveTarget(null);
      approveForm.resetFields();
      invalidate();
    },
    onError: showMutationError,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectBusinessApplication(id, reason),
    onSuccess: () => {
      message.success('Đã từ chối hồ sơ');
      setRejectTarget(null);
      setRejectReason('');
      invalidate();
    },
    onError: showMutationError,
  });

  return (
    <div className="user-management-section">
      <div className="user-management-toolbar">
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm tên Business, email, số điện thoại"
          className="user-management-search"
          onSearch={(value) => {
            setSearch(value.trim() || undefined);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Loại hồ sơ"
          options={APPLICANT_TYPE_OPTIONS}
          value={applicantType}
          onChange={(value) => {
            setApplicantType(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          options={APPLICATION_STATUS_OPTIONS}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>

      <Table<BusinessApplication>
        rowKey="id"
        className="user-management-table"
        loading={isLoading || isFetching}
        dataSource={data?.data}
        scroll={{ x: 1050 }}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} hồ sơ`,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage);
            setLimit(nextLimit);
          },
        }}
        onRow={(record) => ({ onDoubleClick: () => setDetail(record) })}
        columns={[
          {
            title: 'Hồ sơ đăng ký',
            key: 'business',
            width: 260,
            render: (_, record) => (
              <div className="user-identity">
                <Avatar
                  size={40}
                  icon={record.applicantType === 'ORGANIZATION' ? <BankOutlined /> : <UserOutlined />}
                  className="user-identity__avatar user-identity__avatar--business"
                />
                <div>
                  <Typography.Text strong>{record.businessName}</Typography.Text>
                  <Typography.Text type="secondary">{record.businessCategory}</Typography.Text>
                </div>
              </div>
            ),
          },
          {
            title: 'Loại hồ sơ',
            dataIndex: 'applicantType',
            key: 'applicantType',
            width: 135,
            render: (value: BusinessApplicantType) => (
              <Tag color={value === 'ORGANIZATION' ? 'purple' : 'blue'}>
                {BUSINESS_APPLICANT_TYPE_LABEL[value]}
              </Tag>
            ),
          },
          {
            title: 'Người liên hệ',
            key: 'contact',
            width: 215,
            render: (_, record) => (
              <div className="table-contact">
                <span>{record.contactName}</span>
                <small>{record.contactPhone}</small>
              </div>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 135,
            render: (value: BusinessApplicationStatus) => (
              <Tag color={BUSINESS_APPLICATION_STATUS_COLOR[value]}>
                {BUSINESS_APPLICATION_STATUS_LABEL[value]}
              </Tag>
            ),
          },
          {
            title: 'Ngày nộp',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 170,
            render: formatDate,
          },
          {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 210,
            render: (_, record) => (
              <Space size={6}>
                <Tooltip title="Xem hồ sơ">
                  <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(record)} />
                </Tooltip>
                {record.status === 'PENDING' && (
                  <>
                    <Button size="small" type="primary" onClick={() => openApprove(record)}>Duyệt</Button>
                    <Button size="small" danger onClick={() => {
                      setDetail(null);
                      setRejectTarget(record);
                    }}>Từ chối</Button>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />

      <ApplicationDetail
        application={detail}
        onClose={() => setDetail(null)}
        onApprove={openApprove}
        onReject={(application) => {
          setDetail(null);
          setRejectTarget(application);
        }}
      />

      <Modal
        title="Duyệt hồ sơ và tạo tài khoản BUSINESS"
        open={!!approveTarget}
        okText="Duyệt và tạo tài khoản"
        cancelText="Hủy"
        confirmLoading={approveMutation.isPending}
        onCancel={() => {
          setApproveTarget(null);
          approveForm.resetFields();
        }}
        onOk={() => void approveForm.validateFields().then((input) => {
          if (approveTarget) approveMutation.mutate({ id: approveTarget.id, input });
        })}
      >
        <div className="approval-note">
          <CheckCircleOutlined />
          <span>Hồ sơ được duyệt sẽ tạo một người dùng có vai trò <strong>BUSINESS</strong>.</span>
        </div>
        <Form form={approveForm} layout="vertical" requiredMark={false}>
          <Form.Item
            name="displayName"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Vui lòng nhập tên hiển thị' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên Business" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email đăng nhập"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="business@example.com" />
          </Form.Item>
          <Form.Item
            name="initialPassword"
            label="Mật khẩu tạm thời"
            extra="Gửi thông tin này cho chủ hồ sơ qua kênh bảo mật."
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu tạm thời' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu tạm thời" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Từ chối hồ sơ: ${rejectTarget?.businessName ?? ''}`}
        open={!!rejectTarget}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
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
      >
        <Typography.Paragraph type="secondary">
          Lý do sẽ được gửi cho người nộp để chỉnh sửa và nộp lại hồ sơ.
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          maxLength={500}
          showCount
          placeholder="Nêu rõ giấy tờ hoặc thông tin cần bổ sung..."
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
        />
      </Modal>
    </div>
  );
}

export function UsersPage(): JSX.Element {
  return (
    <div className="users-page">
      <div className="users-page__header">
        <div>
          <Typography.Title level={2}>Người dùng & Business</Typography.Title>
          <Typography.Paragraph>
            Quản lý tài khoản và kiểm duyệt hồ sơ đăng ký đối tác LocalGo.
          </Typography.Paragraph>
        </div>
      </div>

      <div className="users-page__stats">
        <Card><Statistic title="Tài khoản hệ thống" value="Đang quản lý" prefix={<TeamOutlined />} /></Card>
        <Card><Statistic title="Hồ sơ Business" value="Cá nhân & doanh nghiệp" prefix={<FileProtectOutlined />} /></Card>
        <Card><Statistic title="Quy trình xét duyệt" value="Xác minh trước kích hoạt" prefix={<ClockCircleOutlined />} /></Card>
      </div>

      <Card className="users-page__content" bordered={false}>
        <Tabs
          defaultActiveKey="users"
          items={[
            { key: 'users', label: <span><TeamOutlined /> Người dùng</span>, children: <UsersTable /> },
            {
              key: 'applications',
              label: <span><FileProtectOutlined /> Hồ sơ đăng ký BUSINESS</span>,
              children: <BusinessApplicationsTable />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
