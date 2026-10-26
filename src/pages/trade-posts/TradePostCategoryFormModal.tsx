import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Switch,
  Typography,
} from "antd";
import type { JSX } from "react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "../../types/api";
import type {
  CreateTradePostCategoryInput,
  UpdateTradePostCategoryInput,
} from "../../types/trade-post-category";
import { getApiFieldError } from "../../utils/api-field-error";

const tradePostCategoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên danh mục")
    .max(120, "Tên danh mục không được vượt quá 120 ký tự"),
  description: z
    .string()
    .trim()
    .max(1000, "Mô tả không được vượt quá 1.000 ký tự")
    .or(z.literal("")),
  sortOrder: z
    .number()
    .int("Thứ tự phải là số nguyên")
    .min(0, "Thứ tự không được nhỏ hơn 0"),
  requiresPromotionDetails: z.boolean(),
  isActive: z.boolean(),
});

export type TradePostCategoryFormValues = z.infer<
  typeof tradePostCategoryFormSchema
>;

const DEFAULT_VALUES: TradePostCategoryFormValues = {
  name: "",
  description: "",
  sortOrder: 0,
  requiresPromotionDetails: false,
  isActive: true,
};

interface Props {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<TradePostCategoryFormValues> & {
    slug?: string;
    version?: number;
  };
  confirmLoading: boolean;
  serverError?: unknown;
  onCancel: () => void;
  onSubmit: (
    input: CreateTradePostCategoryInput | UpdateTradePostCategoryInput,
  ) => void;
}

function describeServerError(error: unknown, mode: "create" | "edit"): string {
  if (!(error instanceof ApiError)) {
    return mode === "create"
      ? "Không thể tạo danh mục. Vui lòng thử lại."
      : "Không thể lưu danh mục. Vui lòng thử lại.";
  }

  const detailMessages = (error.details ?? []).flatMap((detail) => {
    if (typeof detail === "string") return detail.trim() ? [detail] : [];
    if (!detail || typeof detail !== "object") return [];
    const message = (detail as { message?: unknown }).message;
    return typeof message === "string" && message.trim() ? [message] : [];
  });

  if (detailMessages.length > 0) return detailMessages.join("; ");
  return error.message;
}

export function TradePostCategoryFormModal({
  open,
  mode,
  initialValues,
  confirmLoading,
  serverError,
  onCancel,
  onSubmit,
}: Props): JSX.Element {
  const {
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<TradePostCategoryFormValues>({
    resolver: zodResolver(tradePostCategoryFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    reset({
      ...DEFAULT_VALUES,
      ...(initialValues ?? {}),
      description: initialValues?.description ?? "",
      sortOrder: initialValues?.sortOrder ?? 0,
      requiresPromotionDetails:
        initialValues?.requiresPromotionDetails ?? false,
      isActive: initialValues?.isActive ?? true,
    });
  }, [initialValues, open, reset]);

  useEffect(() => {
    if (!serverError) {
      clearErrors();
      return;
    }

    const fields: Array<keyof TradePostCategoryFormValues> = [
      "name",
      "description",
      "sortOrder",
      "requiresPromotionDetails",
      "isActive",
    ];
    for (const field of fields) {
      const fieldError = getApiFieldError(
        serverError,
        field,
        "Giá trị không hợp lệ",
      );
      if (fieldError) {
        setError(field, { type: "server", message: fieldError });
      } else {
        clearErrors(field);
      }
    }
  }, [clearErrors, serverError, setError]);

  const submit = (values: TradePostCategoryFormValues): void => {
    const normalizedDescription = values.description.trim();
    const commonPayload = {
      name: values.name.trim(),
      description: normalizedDescription || null,
      sortOrder: values.sortOrder,
      requiresPromotionDetails: values.requiresPromotionDetails,
    };

    if (mode === "edit") {
      onSubmit({
        ...commonPayload,
        version: initialValues?.version ?? 0,
      });
      return;
    }

    onSubmit({
      ...commonPayload,
      description: normalizedDescription || undefined,
      isActive: values.isActive,
    });
  };

  return (
    <Modal
      title={
        mode === "edit"
          ? "Chỉnh sửa danh mục tin giao thương"
          : "Tạo danh mục tin giao thương"
      }
      open={open}
      width={640}
      okText={mode === "edit" ? "Lưu thay đổi" : "Tạo danh mục"}
      cancelText="Hủy"
      confirmLoading={confirmLoading}
      mask={{ closable: !confirmLoading }}
      keyboard={!confirmLoading}
      cancelButtonProps={{ disabled: confirmLoading }}
      onCancel={onCancel}
      onOk={() => void handleSubmit(submit)()}
    >
      {serverError != null && (
        <Alert
          type="error"
          showIcon
          title={
            mode === "edit"
              ? "Không thể lưu danh mục"
              : "Không thể tạo danh mục"
          }
          description={describeServerError(serverError, mode)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical">
        {initialValues?.slug ? (
          <Form.Item label="Slug">
            <Typography.Text code>{initialValues.slug}</Typography.Text>
          </Form.Item>
        ) : null}

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Tên danh mục"
              required
              validateStatus={errors.name ? "error" : undefined}
              help={errors.name?.message}
            >
              <Input
                {...field}
                autoFocus
                maxLength={120}
                showCount
                placeholder="Cây ăn trái"
              />
            </Form.Item>
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Mô tả"
              validateStatus={errors.description ? "error" : undefined}
              help={errors.description?.message}
            >
              <Input.TextArea
                {...field}
                rows={3}
                maxLength={1000}
                showCount
                placeholder="Mô tả ngắn về loại tin thuộc danh mục"
              />
            </Form.Item>
          )}
        />

        <Row gutter={24}>
          <Col xs={24} sm={8}>
            <Controller
              name="sortOrder"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Thứ tự hiển thị"
                  required
                  validateStatus={errors.sortOrder ? "error" : undefined}
                  help={errors.sortOrder?.message}
                >
                  <InputNumber
                    {...field}
                    min={0}
                    precision={0}
                    style={{ width: "100%" }}
                    onChange={(value) => field.onChange(value ?? 0)}
                  />
                </Form.Item>
              )}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Controller
              name="requiresPromotionDetails"
              control={control}
              render={({ field }) => (
                <Form.Item
                  label="Chi tiết khuyến mãi"
                  tooltip="Bắt buộc người đăng nhập phần trăm và thời gian khuyến mãi."
                  validateStatus={
                    errors.requiresPromotionDetails ? "error" : undefined
                  }
                  help={errors.requiresPromotionDetails?.message}
                >
                  <Switch
                    checked={field.value}
                    checkedChildren="Bắt buộc"
                    unCheckedChildren="Không"
                    onChange={field.onChange}
                  />
                </Form.Item>
              )}
            />
          </Col>
          {mode === "create" ? (
            <Col xs={24} sm={8}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Trạng thái"
                    validateStatus={errors.isActive ? "error" : undefined}
                    help={errors.isActive?.message}
                  >
                    <Switch
                      checked={field.value}
                      checkedChildren="Hoạt động"
                      unCheckedChildren="Ngừng"
                      onChange={field.onChange}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          ) : null}
        </Row>
      </Form>
    </Modal>
  );
}
