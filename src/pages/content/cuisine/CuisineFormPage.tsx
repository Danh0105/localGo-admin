import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldPath,
} from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCuisineItem,
  fetchCuisineItem,
  updateCuisineItem,
} from "../../../api/cuisine";
import { GoogleMapsField } from "../../../components/GoogleMapsField";
import { useAuthStore } from "../../../store/auth-store";
import { useUnsavedChangesStore } from "../../../store/unsaved-changes-store";
import { ApiError } from "../../../types/api";
import { CUISINE_CATEGORIES } from "../../../types/cuisine";
import { ImageUploadField } from "../about/ImageUploadField";
import {
  describeCuisineError,
  getCuisineSuggestedPlaceApiFieldErrors,
} from "./cuisine-errors";
import {
  createEmptyCuisineSuggestedPlace,
  createEmptyCuisineMenuItem,
  createEmptyCuisineReview,
  createEmptyCuisineGalleryItem,
  slugifyCuisinePart,
  isValidCuisineMapsUrl,
  safeCuisineMapsUrl,
  cuisineFormSchema,
  cuisineToForm,
  EMPTY_CUISINE_FORM,
  formToCuisinePayload,
  type CuisineFormValues,
  type CuisineSuggestedPlaceFormValue,
} from "./cuisine.schema";
import { CuisinePreviewDrawer } from "./CuisinePreviewDrawer";
import "./cuisine.css";

function hasMissingMapsData(place: CuisineSuggestedPlaceFormValue): boolean {
  return !place.address.trim() || !isValidCuisineMapsUrl(place.googleMapsUrl);
}

function cannotActivate(place: CuisineSuggestedPlaceFormValue): boolean {
  return !place.id.trim() || !place.name.trim() || hasMissingMapsData(place);
}

export function CuisineFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore(
    (state) => state.user?.role === "ADMIN" || state.user?.role === "MODERATOR",
  );
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const itemQuery = useQuery({
    queryKey: ["admin-cuisine-item", id],
    queryFn: ({ signal }) => fetchCuisineItem(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<CuisineFormValues>({
    resolver: zodResolver(cuisineFormSchema),
    defaultValues: EMPTY_CUISINE_FORM,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const places = useFieldArray({
    control,
    name: "suggestedPlaces",
    keyName: "fieldKey",
  });
  const descriptions = useFieldArray({
    control,
    name: "descriptions",
    keyName: "fieldKey",
  });
  const highlights = useFieldArray({
    control,
    name: "highlights",
    keyName: "fieldKey",
  });
  const menuFields = useFieldArray({
    control,
    name: "menu",
    keyName: "fieldKey",
  });
  const reviewFields = useFieldArray({
    control,
    name: "reviews",
    keyName: "fieldKey",
  });
  const galleryFields = useFieldArray({
    control,
    name: "gallery",
    keyName: "fieldKey",
  });
  const values = watch();
  const averageRating = values.reviews.length
    ? Math.round(
        (values.reviews.reduce((sum, review) => sum + review.rating, 0) /
          values.reviews.length) *
          10,
      ) / 10
    : 0;

  function fillIdIfEmpty(
    fieldName:
      | `suggestedPlaces.${number}.id`
      | `menu.${number}.id`
      | `reviews.${number}.id`,
    text: string,
    prefix = "",
  ): void {
    if (getValues(fieldName)?.trim()) return;
    const base = slugifyCuisinePart(text);
    if (!base) return;
    const currentIds = [
      ...getValues("suggestedPlaces").map((p) => p.id),
      ...getValues("menu").map((m) => m.id),
      ...getValues("reviews").map((r) => r.id),
    ];
    const candidate = `${prefix}${base}`.slice(0, 100);
    let next = candidate;
    let number = 2;
    while (currentIds.includes(next))
      next = `${candidate.slice(0, 94)}-${number++}`;
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  }
  const hasIncompleteMapsData = values.suggestedPlaces.some(hasMissingMapsData);

  useEffect(() => {
    if (itemQuery.data) reset(cuisineToForm(itemQuery.data));
  }, [itemQuery.data, reset]);

  useEffect(() => {
    setGlobalDirty(
      canManage && isDirty,
      "Bạn có thay đổi chưa lưu ở Ẩm thực. Rời khỏi trang sẽ mất các thay đổi này.",
    );
  }, [canManage, isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: CuisineFormValues) => {
      const payload = formToCuisinePayload(form);
      return isCreate
        ? createCuisineItem(payload)
        : updateCuisineItem(id!, {
            ...payload,
            version: itemQuery.data!.version,
          });
    },
    onSuccess: (saved) => {
      reset(cuisineToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-cuisine"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin-cuisine-item", saved.id],
      });
      message.success(isCreate ? "Đã tạo món ăn" : "Đã lưu thay đổi");
      navigate(`/content/cuisine/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.code === "CUISINE_ITEM_VERSION_CONFLICT"
      ) {
        setConflict(true);
      }
      for (const fieldError of getCuisineSuggestedPlaceApiFieldErrors(error)) {
        const visibleField =
          fieldError.field === "id" ? "name" : fieldError.field;
        setError(
          `suggestedPlaces.${fieldError.index}.${visibleField}` as FieldPath<CuisineFormValues>,
          { type: "server", message: fieldError.message },
        );
      }
      message.error(describeCuisineError(error));
    },
  });

  const disabled = !canManage || saveMutation.isPending;

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate("/content/cuisine");
    };
    if (!isDirty || !canManage) return leave();
    Modal.confirm({
      title: "Hủy thay đổi?",
      content: "Các nội dung chưa lưu sẽ bị mất.",
      okText: "Rời trang",
      cancelText: "Ở lại",
      okButtonProps: { danger: true },
      onOk: leave,
    });
  }

  async function loadLatest(): Promise<void> {
    const result = await itemQuery.refetch();
    if (result.data) {
      reset(cuisineToForm(result.data));
      setConflict(false);
      message.info("Đã tải phiên bản mới nhất");
    }
  }

  function changeVisibility(
    checked: boolean,
    onChange: (value: boolean) => void,
  ): void {
    if (checked && values.suggestedPlaces.some(cannotActivate)) {
      values.suggestedPlaces.forEach((place, index) => {
        if (!place.id.trim()) {
          setError(`suggestedPlaces.${index}.id`, {
            type: "manual",
            message: "Bắt buộc nhập mã ID địa điểm",
          });
        }
        if (!place.name.trim()) {
          setError(`suggestedPlaces.${index}.name`, {
            type: "manual",
            message: "Bắt buộc khi bật hiển thị",
          });
        }
        if (!place.address.trim()) {
          setError(`suggestedPlaces.${index}.address`, {
            type: "manual",
            message: "Bắt buộc khi bật hiển thị",
          });
        }
        if (!isValidCuisineMapsUrl(place.googleMapsUrl)) {
          setError(`suggestedPlaces.${index}.googleMapsUrl`, {
            type: "manual",
            message: "Cần link Google Maps hợp lệ trước khi bật hiển thị",
          });
        }
      });
      message.warning(
        "Hãy hoàn tất tên, địa chỉ và link Google Maps của mọi địa điểm trước khi bật hiển thị",
      );
      return;
    }
    onChange(checked);
  }

  if (isCreate && !canManage) {
    return (
      <Alert
        type="error"
        showIcon
        title="Bạn không có quyền tạo món ăn"
        action={
          <Button onClick={() => navigate("/content/cuisine")}>
            Về danh sách
          </Button>
        }
      />
    );
  }
  if (!isCreate && itemQuery.isLoading)
    return <Skeleton active paragraph={{ rows: 16 }} />;
  if (!isCreate && itemQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được món ăn"
        description={describeCuisineError(itemQuery.error)}
        action={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void itemQuery.refetch()}
          >
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="cuisine-form-page">
      <div className="cuisine-form-page__header">
        <div>
          <Button
            type="text"
            htmlType="button"
            icon={<ArrowLeftOutlined />}
            onClick={cancel}
          >
            Danh sách
          </Button>
          <Typography.Title level={3}>
            {isCreate
              ? "Thêm món ăn mới"
              : `${canManage ? "Chỉnh sửa" : "Chi tiết"} ${itemQuery.data?.name ?? ""}`}
          </Typography.Title>
        </div>
        <Space wrap>
          <Button
            htmlType="button"
            icon={<EyeOutlined />}
            onClick={() => setPreviewOpen(true)}
          >
            Xem trước
          </Button>
          <Button htmlType="button" onClick={cancel}>
            {canManage ? "Hủy" : "Đóng"}
          </Button>
          {canManage && (
            <Button
              type="primary"
              htmlType="button"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              disabled={
                conflict || saveMutation.isPending || (!isCreate && !isDirty)
              }
              onClick={() =>
                void handleSubmit((form) => saveMutation.mutate(form))()
              }
            >
              Lưu
            </Button>
          )}
        </Space>
      </div>

      {!canManage && (
        <Alert type="info" showIcon title="Bạn đang xem ở chế độ chỉ đọc" />
      )}
      {conflict && (
        <Alert
          type="warning"
          showIcon
          title="Dữ liệu đã được người khác cập nhật"
          description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu."
          action={
            <Button size="small" onClick={() => void loadLatest()}>
              Tải phiên bản mới nhất
            </Button>
          }
        />
      )}

      <form
        className="cuisine-form-page__form"
        onSubmit={(event) => event.preventDefault()}
      >
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Tên món"
                    required
                    validateStatus={errors.name ? "error" : undefined}
                    help={errors.name?.message}
                  >
                    <Input
                      {...field}
                      disabled={disabled}
                      maxLength={150}
                      showCount
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} lg={8}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Danh mục"
                    required
                    validateStatus={errors.category ? "error" : undefined}
                    help={errors.category?.message}
                  >
                    <Select
                      {...field}
                      disabled={disabled}
                      options={CUISINE_CATEGORIES.map((value) => ({
                        value,
                        label: value,
                      }))}
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <GoogleMapsField
            control={control}
            disabled={disabled}
            label="Link Google Maps chính"
          />
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Controller
                name="priceRange"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Khoảng giá"
                    required
                    validateStatus={errors.priceRange ? "error" : undefined}
                    help={errors.priceRange?.message}
                  >
                    <Input
                      {...field}
                      disabled={disabled}
                      maxLength={100}
                      placeholder="VD: 40.000đ - 80.000đ"
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Controller
                name="bestTime"
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Thời điểm nên ăn"
                    required
                    validateStatus={errors.bestTime ? "error" : undefined}
                    help={errors.bestTime?.message}
                  >
                    <Input
                      {...field}
                      disabled={disabled}
                      maxLength={100}
                      placeholder="VD: Buổi sáng"
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} lg={4}>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Thứ tự">
                    <InputNumber
                      {...field}
                      disabled={disabled}
                      min={0}
                      precision={0}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={12} lg={8}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Hiển thị trên Mini App">
                    <Switch
                      checked={field.value}
                      disabled={disabled}
                      onChange={(checked) =>
                        changeVisibility(checked, field.onChange)
                      }
                    />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <Controller
            name="contactPhone"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Điện thoại liên hệ món ăn"
                validateStatus={errors.contactPhone ? "error" : undefined}
                help={errors.contactPhone?.message}
                extra="Số điện thoại chung của món/đơn vị giới thiệu (nếu có)."
              >
                <Input
                  {...field}
                  type="tel"
                  disabled={disabled}
                  maxLength={30}
                  placeholder="VD: +84 900 123 456"
                />
              </Form.Item>
            )}
          />
          <Controller
            name="summary"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Mô tả ngắn"
                required
                validateStatus={errors.summary ? "error" : undefined}
                help={errors.summary?.message}
              >
                <Input.TextArea
                  {...field}
                  disabled={disabled}
                  rows={3}
                  maxLength={300}
                  showCount
                />
              </Form.Item>
            )}
          />
        </Card>

        <Card title="Ảnh đại diện">
          <ImageUploadField
            label="ảnh đại diện"
            imageUrl={values.imageUrl ?? undefined}
            alt={values.imageAlt}
            disabled={disabled}
            errorMessage={errors.imageUrl?.message}
            errorId="cuisine-image-error"
            hint="JPEG, PNG hoặc WebP; backend tự tối ưu sang WebP."
            onUploaded={({ mediaId, imageUrl }) => {
              setValue("mediaId", mediaId, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("imageUrl", imageUrl, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            onRemove={() => {
              setValue("mediaId", null, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("imageUrl", null, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
          />
          <Controller
            name="imageAlt"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Mô tả ảnh"
                validateStatus={errors.imageAlt ? "error" : undefined}
                help={errors.imageAlt?.message}
              >
                <Input
                  {...field}
                  disabled={disabled}
                  maxLength={150}
                  showCount
                />
              </Form.Item>
            )}
          />
        </Card>

        <Card
          title={`Thư viện ảnh phụ (${galleryFields.fields.length}/10)`}
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={disabled || galleryFields.fields.length >= 10}
                onClick={() =>
                  galleryFields.append(createEmptyCuisineGalleryItem())
                }
              >
                Thêm ảnh phụ
              </Button>
            )
          }
        >
          <Alert
            type="info"
            showIcon
            title="Tối đa 10 ảnh phụ, hiển thị theo thứ tự bên dưới"
            description="Ảnh tải lên cần thuộc tài khoản quản trị đang thao tác. Không dùng trùng mediaId với ảnh chính."
            style={{ marginBottom: 16 }}
          />
          {galleryFields.fields.length === 0 && (
            <Typography.Text type="secondary">Chưa có ảnh phụ.</Typography.Text>
          )}
          <Row gutter={[16, 16]}>
            {galleryFields.fields.map((image, index) => (
              <Col xs={24} md={12} xl={8} key={image.fieldKey}>
                <Card
                  size="small"
                  title={`Ảnh phụ ${index + 1}`}
                  extra={
                    canManage && (
                      <Space size={4}>
                        <Tooltip title="Đưa ảnh lên">
                          <Button
                            htmlType="button"
                            icon={<ArrowUpOutlined />}
                            disabled={disabled || index === 0}
                            onClick={() => galleryFields.move(index, index - 1)}
                          />
                        </Tooltip>
                        <Tooltip title="Đưa ảnh xuống">
                          <Button
                            htmlType="button"
                            icon={<ArrowDownOutlined />}
                            disabled={
                              disabled ||
                              index === galleryFields.fields.length - 1
                            }
                            onClick={() => galleryFields.move(index, index + 1)}
                          />
                        </Tooltip>
                        <Tooltip title="Xóa ảnh">
                          <Button
                            htmlType="button"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={disabled}
                            onClick={() => galleryFields.remove(index)}
                          />
                        </Tooltip>
                      </Space>
                    )
                  }
                >
                  <ImageUploadField
                    label={`ảnh phụ ${index + 1}`}
                    imageUrl={values.gallery[index]?.imageUrl || undefined}
                    alt={`${values.imageAlt || values.name} - Ảnh ${index + 1}`}
                    disabled={disabled}
                    errorMessage={errors.gallery?.[index]?.mediaId?.message}
                    errorId={`cuisine-gallery-${index}-error`}
                    hint="JPEG, PNG, WebP"
                    onUploaded={({ mediaId, imageUrl }) => {
                      if (
                        mediaId === getValues("mediaId") ||
                        getValues("gallery").some(
                          (entry, i) =>
                            i !== index && entry.mediaId === mediaId,
                        )
                      ) {
                        message.error("Ảnh này đã được sử dụng trong món ăn");
                        return;
                      }
                      setValue(`gallery.${index}.mediaId`, mediaId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue(`gallery.${index}.imageUrl`, imageUrl, {
                        shouldDirty: true,
                      });
                    }}
                    onRemove={() => galleryFields.remove(index)}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title="Địa điểm gợi ý"
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={places.fields.length >= 20 || disabled}
                onClick={() =>
                  places.append(createEmptyCuisineSuggestedPlace())
                }
              >
                Thêm địa điểm
              </Button>
            )
          }
        >
          {hasIncompleteMapsData && (
            <Alert
              className="cuisine-form-page__places-warning"
              type="warning"
              showIcon
              title="Một số địa điểm chưa có đủ địa chỉ hoặc link Google Maps hợp lệ"
              description="Có thể lưu khi món đang ẩn để hoàn thiện dần. Cần bổ sung đầy đủ trước khi bật hiển thị trên Mini App."
            />
          )}
          {!places.fields.length && (
            <Typography.Text type="secondary">
              Chưa có địa điểm gợi ý.
            </Typography.Text>
          )}
          <div className="cuisine-form-page__places">
            {places.fields.map((item, index) => {
              const place = values.suggestedPlaces[index];
              const mapsUrl = safeCuisineMapsUrl(place?.googleMapsUrl ?? "");
              const placeErrors = errors.suggestedPlaces?.[index];
              const nameInputId = `cuisine-place-${item.id}-name`;
              const addressInputId = `cuisine-place-${item.id}-address`;
              const mapsUrlInputId = `cuisine-place-${item.id}-google-maps-url`;

              return (
                <Card
                  className="cuisine-form-page__place-card"
                  key={item.fieldKey}
                  size="small"
                  title={`Địa điểm ${index + 1}`}
                  extra={
                    canManage && (
                      <Space size={4}>
                        <Tooltip title="Đưa địa điểm lên">
                          <Button
                            htmlType="button"
                            icon={<ArrowUpOutlined />}
                            aria-label="Đưa địa điểm lên"
                            disabled={index === 0 || disabled}
                            onClick={() => places.move(index, index - 1)}
                          />
                        </Tooltip>
                        <Tooltip title="Đưa địa điểm xuống">
                          <Button
                            htmlType="button"
                            icon={<ArrowDownOutlined />}
                            aria-label="Đưa địa điểm xuống"
                            disabled={
                              index === places.fields.length - 1 || disabled
                            }
                            onClick={() => places.move(index, index + 1)}
                          />
                        </Tooltip>
                        <Tooltip title="Xóa địa điểm">
                          <Button
                            htmlType="button"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label="Xóa địa điểm"
                            disabled={disabled}
                            onClick={() => places.remove(index)}
                          />
                        </Tooltip>
                      </Space>
                    )
                  }
                >
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Controller
                        name={`suggestedPlaces.${index}.id`}
                        control={control}
                        render={({ field }) => (
                          <Form.Item
                            label="ID địa điểm"
                            required
                            validateStatus={
                              placeErrors?.id ? "error" : undefined
                            }
                            help={placeErrors?.id?.message}
                            extra="Mã ổn định của địa điểm, tự gợi ý từ tên khi rời ô Tên."
                          >
                            <Input
                              {...field}
                              disabled={disabled}
                              maxLength={100}
                              placeholder="VD: cho-truong-mit"
                            />
                          </Form.Item>
                        )}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Controller
                        name={`suggestedPlaces.${index}.name`}
                        control={control}
                        render={({ field }) => {
                          const errorId = `${nameInputId}-error`;
                          return (
                            <Form.Item
                              label="Tên địa điểm"
                              htmlFor={nameInputId}
                              required
                              validateStatus={
                                placeErrors?.name ? "error" : undefined
                              }
                              help={
                                placeErrors?.name?.message ? (
                                  <span id={errorId}>
                                    {placeErrors.name.message}
                                  </span>
                                ) : undefined
                              }
                            >
                              <Input
                                {...field}
                                id={nameInputId}
                                disabled={disabled}
                                maxLength={200}
                                showCount
                                onBlur={() => {
                                  field.onBlur();
                                  fillIdIfEmpty(
                                    `suggestedPlaces.${index}.id`,
                                    getValues(`suggestedPlaces.${index}.name`),
                                  );
                                }}
                                aria-invalid={Boolean(placeErrors?.name)}
                                aria-describedby={
                                  placeErrors?.name ? errorId : undefined
                                }
                              />
                            </Form.Item>
                          );
                        }}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Controller
                        name={`suggestedPlaces.${index}.address`}
                        control={control}
                        render={({ field }) => {
                          const errorId = `${addressInputId}-error`;
                          return (
                            <Form.Item
                              label="Địa chỉ"
                              htmlFor={addressInputId}
                              required={values.isActive}
                              validateStatus={
                                placeErrors?.address ? "error" : undefined
                              }
                              help={
                                placeErrors?.address?.message ? (
                                  <span id={errorId}>
                                    {placeErrors.address.message}
                                  </span>
                                ) : undefined
                              }
                            >
                              <Input
                                {...field}
                                id={addressInputId}
                                disabled={disabled}
                                maxLength={255}
                                showCount
                                aria-invalid={Boolean(placeErrors?.address)}
                                aria-describedby={
                                  placeErrors?.address ? errorId : undefined
                                }
                              />
                            </Form.Item>
                          );
                        }}
                      />
                    </Col>
                    <Col xs={24} lg={16}>
                      <Controller
                        name={`suggestedPlaces.${index}.googleMapsUrl`}
                        control={control}
                        render={({ field }) => {
                          const errorId = `${mapsUrlInputId}-error`;
                          return (
                            <Form.Item
                              label="Link Google Maps"
                              htmlFor={mapsUrlInputId}
                              required={values.isActive}
                              validateStatus={
                                placeErrors?.googleMapsUrl ? "error" : undefined
                              }
                              help={
                                placeErrors?.googleMapsUrl?.message ? (
                                  <span id={errorId}>
                                    {placeErrors.googleMapsUrl.message}
                                  </span>
                                ) : undefined
                              }
                              extra="Mở Google Maps → Chia sẻ → Sao chép đường liên kết → Dán vào đây"
                            >
                              <Input
                                {...field}
                                id={mapsUrlInputId}
                                type="url"
                                disabled={disabled}
                                maxLength={2048}
                                autoComplete="off"
                                placeholder="Dán link đã sao chép từ Google Maps"
                                aria-invalid={Boolean(
                                  placeErrors?.googleMapsUrl,
                                )}
                                aria-describedby={
                                  placeErrors?.googleMapsUrl
                                    ? errorId
                                    : undefined
                                }
                              />
                            </Form.Item>
                          );
                        }}
                      />
                    </Col>
                    <Col
                      xs={24}
                      lg={8}
                      className="cuisine-form-page__maps-action"
                    >
                      <Button
                        htmlType="button"
                        icon={<EnvironmentOutlined />}
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        disabled={!mapsUrl}
                      >
                        Mở thử trên Google Maps
                      </Button>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </div>
        </Card>

        <Card
          title="Mô tả chi tiết"
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={descriptions.fields.length >= 20 || disabled}
                onClick={() => descriptions.append({ text: "" })}
              >
                Thêm đoạn
              </Button>
            )
          }
        >
          {errors.descriptions?.root?.message && (
            <Alert type="error" title={errors.descriptions.root.message} />
          )}
          {descriptions.fields.map((item, index) => (
            <div className="cuisine-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`descriptions.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Đoạn ${index + 1}`}
                    validateStatus={
                      errors.descriptions?.[index]?.text ? "error" : undefined
                    }
                    help={errors.descriptions?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input.TextArea
                      {...field}
                      disabled={disabled}
                      rows={4}
                      maxLength={5000}
                      showCount
                    />
                  </Form.Item>
                )}
              />
              {canManage && (
                <Space orientation="vertical">
                  <Button
                    htmlType="button"
                    icon={<ArrowUpOutlined />}
                    aria-label="Đưa đoạn lên"
                    disabled={index === 0 || disabled}
                    onClick={() => descriptions.move(index, index - 1)}
                  />
                  <Button
                    htmlType="button"
                    icon={<ArrowDownOutlined />}
                    aria-label="Đưa đoạn xuống"
                    disabled={
                      index === descriptions.fields.length - 1 || disabled
                    }
                    onClick={() => descriptions.move(index, index + 1)}
                  />
                  <Button
                    htmlType="button"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Xóa đoạn"
                    disabled={descriptions.fields.length === 1 || disabled}
                    onClick={() => descriptions.remove(index)}
                  />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card
          title="Điểm nổi bật"
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={highlights.fields.length >= 20 || disabled}
                onClick={() => highlights.append({ text: "" })}
              >
                Thêm điểm nổi bật
              </Button>
            )
          }
        >
          {!highlights.fields.length && (
            <Typography.Text type="secondary">
              Chưa có điểm nổi bật.
            </Typography.Text>
          )}
          {highlights.fields.map((item, index) => (
            <div className="cuisine-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`highlights.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Điểm ${index + 1}`}
                    validateStatus={
                      errors.highlights?.[index]?.text ? "error" : undefined
                    }
                    help={errors.highlights?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input
                      {...field}
                      disabled={disabled}
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>
                )}
              />
              {canManage && (
                <Space>
                  <Button
                    htmlType="button"
                    icon={<ArrowUpOutlined />}
                    aria-label="Đưa điểm nổi bật lên"
                    disabled={index === 0 || disabled}
                    onClick={() => highlights.move(index, index - 1)}
                  />
                  <Button
                    htmlType="button"
                    icon={<ArrowDownOutlined />}
                    aria-label="Đưa điểm nổi bật xuống"
                    disabled={
                      index === highlights.fields.length - 1 || disabled
                    }
                    onClick={() => highlights.move(index, index + 1)}
                  />
                  <Button
                    htmlType="button"
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Xóa điểm nổi bật"
                    disabled={disabled}
                    onClick={() => highlights.remove(index)}
                  />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card
          title={`Thực đơn (${menuFields.fields.length}/50)`}
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={disabled || menuFields.fields.length >= 50}
                onClick={() => menuFields.append(createEmptyCuisineMenuItem())}
              >
                Thêm món trong menu
              </Button>
            )
          }
        >
          {!menuFields.fields.length && (
            <Typography.Text type="secondary">
              Chưa có thực đơn.
            </Typography.Text>
          )}
          {menuFields.fields.map((item, index) => (
            <Card
              key={item.fieldKey}
              size="small"
              title={`Món thực đơn ${index + 1}`}
              style={{ marginBottom: 12 }}
              extra={
                canManage && (
                  <Space size={4}>
                    <Tooltip title="Đưa lên">
                      <Button
                        htmlType="button"
                        icon={<ArrowUpOutlined />}
                        disabled={disabled || index === 0}
                        onClick={() => menuFields.move(index, index - 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Đưa xuống">
                      <Button
                        htmlType="button"
                        icon={<ArrowDownOutlined />}
                        disabled={
                          disabled || index === menuFields.fields.length - 1
                        }
                        onClick={() => menuFields.move(index, index + 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        htmlType="button"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={disabled}
                        onClick={() => menuFields.remove(index)}
                      />
                    </Tooltip>
                  </Space>
                )
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Controller
                    name={`menu.${index}.id`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="ID thực đơn"
                        required
                        validateStatus={
                          errors.menu?.[index]?.id ? "error" : undefined
                        }
                        help={errors.menu?.[index]?.id?.message}
                      >
                        <Input
                          {...field}
                          maxLength={100}
                          disabled={disabled}
                          placeholder="to-dac-biet"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    name={`menu.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="Tên món"
                        required
                        validateStatus={
                          errors.menu?.[index]?.name ? "error" : undefined
                        }
                        help={errors.menu?.[index]?.name?.message}
                      >
                        <Input
                          {...field}
                          maxLength={200}
                          disabled={disabled}
                          onBlur={() => {
                            field.onBlur();
                            fillIdIfEmpty(
                              `menu.${index}.id`,
                              getValues(`menu.${index}.name`),
                              "menu-",
                            );
                          }}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Controller
                    name={`menu.${index}.price`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="Giá"
                        required
                        validateStatus={
                          errors.menu?.[index]?.price ? "error" : undefined
                        }
                        help={errors.menu?.[index]?.price?.message}
                      >
                        <Input
                          {...field}
                          maxLength={100}
                          disabled={disabled}
                          placeholder="55.000đ"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>
              <Controller
                name={`menu.${index}.description`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Mô tả (không bắt buộc)"
                    validateStatus={
                      errors.menu?.[index]?.description ? "error" : undefined
                    }
                    help={errors.menu?.[index]?.description?.message}
                  >
                    <Input.TextArea
                      {...field}
                      rows={2}
                      maxLength={2000}
                      disabled={disabled}
                    />
                  </Form.Item>
                )}
              />
            </Card>
          ))}
        </Card>

        <Card
          title={`Đánh giá và phản hồi (${reviewFields.fields.length}/100)`}
          extra={
            canManage && (
              <Button
                htmlType="button"
                icon={<PlusOutlined />}
                disabled={disabled || reviewFields.fields.length >= 100}
                onClick={() => reviewFields.append(createEmptyCuisineReview())}
              >
                Thêm đánh giá
              </Button>
            )
          }
        >
          <Typography.Paragraph type="secondary">
            Đây là đánh giá do quản trị viên nhập và quản lý, không phải đánh
            giá trực tiếp từ tài khoản Mini App. Điểm trung bình tạm tính:{" "}
            <strong>{averageRating.toFixed(1)}/5</strong> ·{" "}
            {values.reviews.length} đánh giá. Backend tự tính lại averageRating
            và reviewCount khi lưu.
          </Typography.Paragraph>
          {!reviewFields.fields.length && (
            <Typography.Text type="secondary">
              Chưa có đánh giá.
            </Typography.Text>
          )}
          {reviewFields.fields.map((item, index) => (
            <Card
              key={item.fieldKey}
              size="small"
              title={`Đánh giá ${index + 1}`}
              style={{ marginBottom: 12 }}
              extra={
                canManage && (
                  <Space size={4}>
                    <Tooltip title="Đưa lên">
                      <Button
                        htmlType="button"
                        icon={<ArrowUpOutlined />}
                        disabled={disabled || index === 0}
                        onClick={() => reviewFields.move(index, index - 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Đưa xuống">
                      <Button
                        htmlType="button"
                        icon={<ArrowDownOutlined />}
                        disabled={
                          disabled || index === reviewFields.fields.length - 1
                        }
                        onClick={() => reviewFields.move(index, index + 1)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        htmlType="button"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={disabled}
                        onClick={() => reviewFields.remove(index)}
                      />
                    </Tooltip>
                  </Space>
                )
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Controller
                    name={`reviews.${index}.id`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="ID đánh giá"
                        required
                        validateStatus={
                          errors.reviews?.[index]?.id ? "error" : undefined
                        }
                        help={errors.reviews?.[index]?.id?.message}
                      >
                        <Input
                          {...field}
                          maxLength={100}
                          disabled={disabled}
                          placeholder="review-1"
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={10}>
                  <Controller
                    name={`reviews.${index}.reviewerName`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="Người đánh giá"
                        required
                        validateStatus={
                          errors.reviews?.[index]?.reviewerName
                            ? "error"
                            : undefined
                        }
                        help={errors.reviews?.[index]?.reviewerName?.message}
                      >
                        <Input
                          {...field}
                          maxLength={200}
                          disabled={disabled}
                          onBlur={() => {
                            field.onBlur();
                            fillIdIfEmpty(
                              `reviews.${index}.id`,
                              getValues(`reviews.${index}.reviewerName`),
                              "review-",
                            );
                          }}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
                <Col xs={24} md={6}>
                  <Controller
                    name={`reviews.${index}.rating`}
                    control={control}
                    render={({ field }) => (
                      <Form.Item
                        label="Số sao (1–5)"
                        required
                        validateStatus={
                          errors.reviews?.[index]?.rating ? "error" : undefined
                        }
                        help={errors.reviews?.[index]?.rating?.message}
                      >
                        <InputNumber
                          value={field.value}
                          onChange={(num) => field.onChange(num ?? 1)}
                          onBlur={field.onBlur}
                          min={1}
                          max={5}
                          step={1}
                          precision={0}
                          disabled={disabled}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>
              <Controller
                name={`reviews.${index}.feedback`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Nội dung đánh giá"
                    validateStatus={
                      errors.reviews?.[index]?.feedback ? "error" : undefined
                    }
                    help={errors.reviews?.[index]?.feedback?.message}
                  >
                    <Input.TextArea
                      {...field}
                      rows={2}
                      maxLength={5000}
                      disabled={disabled}
                    />
                  </Form.Item>
                )}
              />
              <Controller
                name={`reviews.${index}.adminResponse`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label="Phản hồi từ quản trị viên"
                    validateStatus={
                      errors.reviews?.[index]?.adminResponse
                        ? "error"
                        : undefined
                    }
                    help={errors.reviews?.[index]?.adminResponse?.message}
                  >
                    <Input.TextArea
                      {...field}
                      rows={2}
                      maxLength={5000}
                      disabled={disabled}
                    />
                  </Form.Item>
                )}
              />
            </Card>
          ))}
        </Card>

        <Card title="Mẹo thưởng thức">
          <Controller
            name="tip"
            control={control}
            render={({ field }) => (
              <Form.Item
                validateStatus={errors.tip ? "error" : undefined}
                help={errors.tip?.message}
              >
                <Input.TextArea
                  {...field}
                  disabled={disabled}
                  rows={5}
                  maxLength={2000}
                  showCount
                />
              </Form.Item>
            )}
          />
        </Card>
      </form>

      <CuisinePreviewDrawer
        open={previewOpen}
        values={values}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
