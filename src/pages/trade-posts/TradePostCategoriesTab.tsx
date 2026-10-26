import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { JSX } from "react";
import { useState } from "react";
import {
  createTradePostCategory,
  deleteTradePostCategory,
  fetchAdminTradePostCategories,
  fetchAdminTradePostCategory,
  reorderTradePostCategories,
  toggleTradePostCategoryStatus,
  updateTradePostCategory,
} from "../../api/trade-post-categories";
import { ApiError } from "../../types/api";
import type {
  CreateTradePostCategoryInput,
  TradePostCategoryAdminItem,
  TradePostCategoryAdminQuery,
  UpdateTradePostCategoryInput,
} from "../../types/trade-post-category";
import { TradePostCategoryFormModal } from "./TradePostCategoryFormModal";

const STATUS_OPTIONS = [
  { value: "true", label: "Đang hoạt động" },
  { value: "false", label: "Ngừng hoạt động" },
];

function formatDate(value: string): string {
  return new Date(value).toLocaleString("vi-VN");
}

function extractApiMessages(error: unknown): string[] {
  if (!(error instanceof ApiError)) return [];

  return (error.details ?? []).flatMap((detail) => {
    if (typeof detail === "string") return detail.trim() ? [detail] : [];
    if (!detail || typeof detail !== "object") return [];

    const candidate = detail as { message?: unknown; messages?: unknown };
    if (typeof candidate.message === "string" && candidate.message.trim())
      return [candidate.message];
    if (Array.isArray(candidate.messages)) {
      return candidate.messages.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );
    }

    return [];
  });
}

function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Vui lòng kiểm tra kết nối và thử lại.";
  }

  switch (error.code) {
    case "TRADE_POST_CATEGORY_VERSION_CONFLICT":
      return "Dữ liệu đã được người khác cập nhật. Vui lòng tải lại dữ liệu và thử lại.";
    case "TRADE_POST_CATEGORY_IN_USE":
      return "Không thể xóa vì danh mục đang có tin tham chiếu. Hãy ẩn danh mục thay vì xóa.";
    case "TRADE_POST_CATEGORY_NOT_FOUND":
      return "Danh mục này không tồn tại hoặc đã bị xóa.";
    case "TRADE_POST_CATEGORY_CODE_EXISTS":
      return error.message || "Mã danh mục đã tồn tại.";
    default: {
      const detailMessages = extractApiMessages(error);
      return detailMessages.length > 0
        ? detailMessages.join("; ")
        : error.message;
    }
  }
}

export function TradePostCategoriesTab(): JSX.Element {
  const queryClient = useQueryClient();
  const [searchDraft, setSearchDraft] = useState("");
  const [query, setQuery] = useState<TradePostCategoryAdminQuery>({
    page: 1,
    limit: 20,
  });
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    editingCategory?: TradePostCategoryAdminItem;
  }>({ open: false, mode: "create" });
  const [formError, setFormError] = useState<unknown>();

  const categoriesQuery = useQuery({
    queryKey: ["admin-trade-post-categories", query],
    queryFn: ({ signal }) => fetchAdminTradePostCategories(query, signal),
    placeholderData: (previous) => previous,
  });

  const refresh = (): void => {
    void queryClient.invalidateQueries({
      queryKey: ["admin-trade-post-categories"],
    });
  };

  const createMutation = useMutation({
    mutationFn: createTradePostCategory,
    onSuccess: (created) => {
      message.success(
        `Đã tạo danh mục tin giao thương${created.slug ? ` (${created.slug})` : ""}`,
      );
      setModalState({ open: false, mode: "create" });
      setFormError(undefined);
      refresh();
    },
    onError: (error: unknown) => {
      setFormError(error);
      message.error(describeError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTradePostCategoryInput;
    }) => updateTradePostCategory(id, input),
    onSuccess: () => {
      message.success("Đã cập nhật danh mục tin giao thương");
      setModalState({ open: false, mode: "create" });
      setFormError(undefined);
      refresh();
    },
    onError: (error: unknown) => {
      setFormError(error);
      if (
        error instanceof ApiError &&
        error.code === "TRADE_POST_CATEGORY_VERSION_CONFLICT"
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["admin-trade-post-categories"],
        });
      }
      message.error(describeError(error));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
      version,
    }: {
      id: string;
      isActive: boolean;
      version: number;
    }) => toggleTradePostCategoryStatus(id, { isActive, version }),
    onSuccess: (updated) => {
      message.success(
        updated.isActive
          ? "Đã hiển thị danh mục tin giao thương"
          : "Đã ẩn danh mục tin giao thương",
      );
      refresh();
    },
    onError: (error: unknown) => {
      message.error(describeError(error));
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTradePostCategories,
    onSuccess: () => {
      message.success("Đã cập nhật thứ tự danh mục");
      refresh();
    },
    onError: (error: unknown) => {
      message.error(describeError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTradePostCategory,
    onSuccess: () => {
      message.success("Đã xóa danh mục tin giao thương");
      refresh();
    },
    onError: (error: unknown) => {
      message.error(describeError(error));
    },
  });

  const openCreate = (): void => {
    setFormError(undefined);
    setModalState({ open: true, mode: "create" });
  };

  const openEdit = (category: TradePostCategoryAdminItem): void => {
    setFormError(undefined);
    void fetchAdminTradePostCategory(category.id)
      .then((detail) => {
        setModalState({ open: true, mode: "edit", editingCategory: detail });
      })
      .catch((error: unknown) => {
        setFormError(error);
        message.error(describeError(error));
      });
  };

  const closeModal = (): void => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setModalState({ open: false, mode: "create" });
    setFormError(undefined);
  };

  const handleToggle = (category: TradePostCategoryAdminItem): void => {
    toggleMutation.mutate({
      id: category.id,
      isActive: !category.isActive,
      version: category.version,
    });
  };

  const handleDelete = (category: TradePostCategoryAdminItem): void => {
    if (category.postCount > 0) {
      message.warning(
        "Danh mục đang có tin tham chiếu. Hãy ẩn danh mục thay vì xóa.",
      );
      return;
    }

    Modal.confirm({
      title: "Xác nhận xóa danh mục",
      content: `Bạn có chắc muốn xóa danh mục “${category.name}”?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        deleteMutation.mutate(category.id);
      },
    });
  };

  const handleReorder = (): void => {
    const items = (categoriesQuery.data?.data ?? [])
      .filter((item) => !item.deletedAt)
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder ||
          left.name.localeCompare(right.name, "vi"),
      )
      .map((item, index) => ({
        id: item.id,
        sortOrder: index,
        version: item.version,
      }));

    if (items.length === 0) return;
    reorderMutation.mutate({ items });
  };

  const columns: ColumnsType<TradePostCategoryAdminItem> = [
    {
      title: "Danh mục",
      key: "category",
      width: 280,
      render: (_, item) => (
        <div className="trade-category-cell">
          <Typography.Text strong>{item.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block" }}>
            {item.slug || item.code}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description: string | null) =>
        description || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "Thứ tự",
      dataIndex: "sortOrder",
      key: "sortOrder",
      width: 90,
      align: "center",
    },
    {
      title: "Chi tiết khuyến mãi",
      dataIndex: "requiresPromotionDetails",
      key: "requiresPromotionDetails",
      width: 175,
      align: "center",
      render: (required: boolean) => (
        <Tag color={required ? "purple" : "default"}>
          {required ? "Bắt buộc" : "Không yêu cầu"}
        </Tag>
      ),
    },
    {
      title: "Số tin",
      dataIndex: "postCount",
      key: "postCount",
      width: 95,
      align: "right",
      render: (postCount: number) => postCount.toLocaleString("vi-VN"),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 150,
      render: (_, item) => {
        if (item.deletedAt) return <Tag color="red">Đã xóa</Tag>;
        return (
          <Tag color={item.isActive ? "green" : "default"}>
            {item.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </Tag>
        );
      },
    },
    {
      title: "Cập nhật lúc",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: formatDate,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 220,
      render: (_, item) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(item)}
          >
            Sửa
          </Button>
          <Switch
            checked={item.isActive}
            checkedChildren={<EyeOutlined />}
            unCheckedChildren={<EyeInvisibleOutlined />}
            onChange={() => handleToggle(item)}
            loading={toggleMutation.isPending}
          />
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            disabled={item.postCount > 0}
            onClick={() => handleDelete(item)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  if (categoriesQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được danh mục tin giao thương"
        description={describeError(categoriesQuery.error)}
        action={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void categoriesQuery.refetch()}
          >
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="trade-categories-tab">
      <div className="trade-categories-tab__summary">
        <div>
          <Typography.Title level={4}>
            Danh mục tin giao thương
          </Typography.Title>
          <Typography.Text type="secondary">
            Tổng cộng {categoriesQuery.data?.meta.total ?? 0} danh mục, bao gồm
            cả đang ngừng hoạt động.
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Làm mới
          </Button>
          <Button onClick={handleReorder} loading={reorderMutation.isPending}>
            Áp dụng thứ tự
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Tạo danh mục
          </Button>
        </Space>
      </div>

      <div className="trade-categories-tab__filters">
        <Input.Search
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo tên hoặc slug"
          value={searchDraft}
          onChange={(event) => {
            const value = event.target.value;
            setSearchDraft(value);
            if (!value && query.search) {
              setQuery((current) => ({
                ...current,
                page: 1,
                search: undefined,
              }));
            }
          }}
          onSearch={(search) =>
            setQuery((current) => ({
              ...current,
              page: 1,
              search: search.trim() || undefined,
            }))
          }
        />
        <Select
          allowClear
          placeholder="Tất cả trạng thái"
          options={STATUS_OPTIONS}
          value={
            query.isActive === undefined ? undefined : String(query.isActive)
          }
          onChange={(value?: string) =>
            setQuery((current) => ({
              ...current,
              page: 1,
              isActive: value === undefined ? undefined : value === "true",
            }))
          }
        />
      </div>

      <Table<TradePostCategoryAdminItem>
        rowKey="id"
        columns={columns}
        dataSource={categoriesQuery.data?.data ?? []}
        loading={categoriesQuery.isLoading || categoriesQuery.isFetching}
        scroll={{ x: 1300 }}
        className="trade-moderation-table"
        locale={{ emptyText: "Chưa có danh mục tin giao thương phù hợp" }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: categoriesQuery.data?.meta.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} danh mục`,
          onChange: (page, limit) =>
            setQuery((current) => ({ ...current, page, limit })),
        }}
      />

      <TradePostCategoryFormModal
        open={modalState.open}
        mode={modalState.mode}
        initialValues={
          modalState.editingCategory
            ? {
                ...modalState.editingCategory,
                description: modalState.editingCategory.description ?? "",
                slug: modalState.editingCategory.slug,
                version: modalState.editingCategory.version,
              }
            : undefined
        }
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        serverError={formError}
        onCancel={closeModal}
        onSubmit={(input) => {
          setFormError(undefined);
          if (modalState.mode === "edit" && modalState.editingCategory) {
            updateMutation.mutate({
              id: modalState.editingCategory.id,
              input: input as UpdateTradePostCategoryInput,
            });
            return;
          }
          createMutation.mutate(input as CreateTradePostCategoryInput);
        }}
      />
    </div>
  );
}
