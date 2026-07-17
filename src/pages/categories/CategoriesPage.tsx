import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useState } from 'react';
import {
  createCategory,
  deleteCategory,
  fetchCategoriesByDomain,
  updateCategory,
} from '../../api/categories';
import { ApiError } from '../../types/api';
import { CATEGORY_DOMAINS, CATEGORY_DOMAIN_LABEL, type Category } from '../../types/category';
import { CategoryFormModal, type CategoryFormValues } from './CategoryFormModal';

const DOMAIN_OPTIONS = CATEGORY_DOMAINS.map((domain) => ({
  value: domain,
  label: CATEGORY_DOMAIN_LABEL[domain],
}));

export function CategoriesPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState<(typeof CATEGORY_DOMAINS)[number]>(CATEGORY_DOMAINS[0]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories', domain],
    queryFn: () => fetchCategoriesByDomain(domain),
  });

  function invalidate(): void {
    void queryClient.invalidateQueries({ queryKey: ['admin-categories', domain] });
  }

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      message.success('Đã tạo danh mục');
      setModalOpen(false);
      invalidate();
    },
    onError: (error: unknown) => {
      message.error(error instanceof ApiError ? error.message : 'Tạo danh mục thất bại');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CategoryFormValues }) =>
      updateCategory(id, values),
    onSuccess: () => {
      message.success('Đã cập nhật danh mục');
      setModalOpen(false);
      setEditing(null);
      invalidate();
    },
    onError: (error: unknown) => {
      message.error(error instanceof ApiError ? error.message : 'Cập nhật thất bại');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success('Đã xóa (vô hiệu hóa) danh mục');
      invalidate();
    },
    onError: (error: unknown) => {
      message.error(error instanceof ApiError ? error.message : 'Xóa thất bại');
    },
  });

  function handleSubmit(values: CategoryFormValues): void {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div>
      <Typography.Title level={3}>Danh mục</Typography.Title>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 220 }}
          options={DOMAIN_OPTIONS}
          value={domain}
          onChange={setDomain}
        />
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          Tạo danh mục
        </Button>
      </Space>

      <Table<Category>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Tên', dataIndex: 'name', key: 'name' },
          { title: 'Slug', dataIndex: 'slug', key: 'slug' },
          { title: 'Thứ tự', dataIndex: 'sortOrder', key: 'sortOrder' },
          {
            title: 'Trạng thái',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
              <Tag color={isActive ? 'green' : 'default'}>
                {isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
              </Tag>
            ),
          },
          {
            title: 'Thao tác',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button
                  size="small"
                  onClick={() => {
                    setEditing(record);
                    setModalOpen(true);
                  }}
                >
                  Sửa
                </Button>
                <Popconfirm
                  title="Xóa (vô hiệu hóa) danh mục này?"
                  onConfirm={() => deleteMutation.mutate(record.id)}
                >
                  <Button size="small" danger loading={deleteMutation.isPending}>
                    Xóa
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <CategoryFormModal
        open={modalOpen}
        initialValues={editing}
        defaultDomain={domain}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
