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
import { deleteContact, fetchContacts, reorderContacts, updateContactStatus } from '../../../api/contacts';
import { useAuthStore } from '../../../store/auth-store';
import { CONTACT_CATEGORIES, type ContactAdminItem, type ContactCategory, type ContactQuery } from '../../../types/contact';
import { describeContactError } from './contact-errors';
import './contacts.css';

const CATEGORY_COLORS: Record<ContactCategory, string> = {
  'Hành chính': 'blue',
  'Khẩn cấp': 'red',
  'Du lịch': 'cyan',
  'Nông nghiệp': 'green',
  'Phản ánh': 'gold',
};

export function ContactsPage(): JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState<ContactQuery>({ page: 1, limit: 20 });

  const itemsQuery = useQuery({
    queryKey: ['admin-contacts', query],
    queryFn: ({ signal }) => fetchContacts(query, signal),
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ item, isActive }: { item: ContactAdminItem; isActive: boolean }) =>
      updateContactStatus(item.id, isActive, item.version),
    onSuccess: (_, variables) => {
      message.success(variables.isActive ? 'Đã hiển thị liên hệ' : 'Đã ẩn liên hệ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeContactError(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      message.success('Đã xóa liên hệ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeContactError(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderContacts,
    onSuccess: () => {
      message.success('Đã cập nhật thứ tự liên hệ');
      refresh();
    },
    onError: (error: unknown) => message.error(describeContactError(error)),
  });

  const rows = itemsQuery.data?.data ?? [];

  function move(item: ContactAdminItem, direction: -1 | 1): void {
    const index = rows.findIndex((row) => row.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    const reordered = rows.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const offset = (query.page - 1) * query.limit;
    reorderMutation.mutate(reordered.map((row, rowIndex) => ({ id: row.id, sortOrder: offset + rowIndex })));
  }

  function confirmDelete(item: ContactAdminItem): void {
    Modal.confirm({
      title: 'Xóa liên hệ?',
      content: `“${item.name}” sẽ bị xóa khỏi hệ thống.`,
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true, loading: deleteMutation.isPending },
      onOk: () => deleteMutation.mutateAsync(item.id),
    });
  }

  const columns: ColumnsType<ContactAdminItem> = [
    {
      title: 'Ảnh',
      dataIndex: 'imageUrl',
      width: 88,
      render: (url: string | null | undefined, item) => url ? (
        <Image src={url} alt={item.imageAlt || item.name} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div className="contacts-page__no-image">Chưa có</div>
      ),
    },
    { title: 'Tên liên hệ', dataIndex: 'name', ellipsis: true },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      width: 130,
      render: (category: ContactCategory) => <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>,
    },
    { title: 'Số điện thoại', dataIndex: 'phone', width: 150 },
    { title: 'Vai trò', dataIndex: 'role', ellipsis: true },
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
          disabled={!canManage}
          loading={statusMutation.isPending}
          onChange={(checked) => statusMutation.mutate({ item, isActive: checked })}
        />
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: canManage ? 220 : 90,
      fixed: 'right',
      render: (_, item, index) => (
        <Space size={4}>
          {canManage && (
            <>
              <Button type="text" icon={<ArrowUpOutlined />} aria-label="Đưa lên" disabled={index === 0 || reorderMutation.isPending} onClick={() => move(item, -1)} />
              <Button type="text" icon={<ArrowDownOutlined />} aria-label="Đưa xuống" disabled={index === rows.length - 1 || reorderMutation.isPending} onClick={() => move(item, 1)} />
            </>
          )}
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/content/contacts/${item.id}`)}>
            {canManage ? 'Sửa' : 'Xem'}
          </Button>
          {canManage && <Button type="text" danger icon={<DeleteOutlined />} aria-label="Xóa" disabled={deleteMutation.isPending} onClick={() => confirmDelete(item)} />}
        </Space>
      ),
    },
  ];

  if (itemsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được danh sách Liên hệ"
        description={describeContactError(itemsQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemsQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="contacts-page">
      <div className="contacts-page__header">
        <div>
          <Typography.Title level={3}>Quản lý Liên hệ</Typography.Title>
          <Typography.Text type="secondary">Tổng cộng {itemsQuery.data?.meta.total ?? 0} liên hệ, bao gồm cả đang ẩn.</Typography.Text>
        </div>
        {canManage && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/content/contacts/new')}>Thêm liên hệ mới</Button>}
      </div>

      {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}

      <div className="contacts-page__filters">
        <Select
          allowClear
          placeholder="Tất cả danh mục"
          style={{ width: 190 }}
          options={CONTACT_CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={(category?: ContactCategory) => setQuery((current) => ({ ...current, page: 1, category }))}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc số điện thoại"
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
        scroll={{ x: 1200 }}
        locale={{ emptyText: 'Chưa có liên hệ phù hợp' }}
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
