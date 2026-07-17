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
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { createCuisineItem, fetchCuisineItem, updateCuisineItem } from '../../../api/cuisine';
import { useAuthStore } from '../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { CUISINE_CATEGORIES } from '../../../types/cuisine';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeCuisineError, getCuisineSuggestedPlaceApiFieldErrors } from './cuisine-errors';
import {
  createEmptyCuisineSuggestedPlace,
  cuisineFormSchema,
  cuisineToForm,
  EMPTY_CUISINE_FORM,
  formToCuisinePayload,
  type CuisineFormValues,
  type CuisineSuggestedPlaceFormValue,
} from './cuisine.schema';
import { CuisinePreviewDrawer } from './CuisinePreviewDrawer';
import { getSafeGoogleMapsUrl, isValidGoogleMapsUrl } from './google-maps';
import './cuisine.css';

function hasMissingMapsData(place: CuisineSuggestedPlaceFormValue): boolean {
  return !place.address.trim() || !isValidGoogleMapsUrl(place.googleMapsUrl);
}

function cannotActivate(place: CuisineSuggestedPlaceFormValue): boolean {
  return !place.name.trim() || hasMissingMapsData(place);
}

export function CuisineFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const itemQuery = useQuery({
    queryKey: ['admin-cuisine-item', id],
    queryFn: ({ signal }) => fetchCuisineItem(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<CuisineFormValues>({
    resolver: zodResolver(cuisineFormSchema),
    defaultValues: EMPTY_CUISINE_FORM,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const places = useFieldArray({ control, name: 'suggestedPlaces', keyName: 'fieldKey' });
  const descriptions = useFieldArray({ control, name: 'descriptions', keyName: 'fieldKey' });
  const highlights = useFieldArray({ control, name: 'highlights', keyName: 'fieldKey' });
  const values = watch();
  const hasIncompleteMapsData = values.suggestedPlaces.some(hasMissingMapsData);

  useEffect(() => {
    if (itemQuery.data) reset(cuisineToForm(itemQuery.data));
  }, [itemQuery.data, reset]);

  useEffect(() => {
    setGlobalDirty(canManage && isDirty, 'Bạn có thay đổi chưa lưu ở Ẩm thực. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [canManage, isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: CuisineFormValues) => {
      const payload = formToCuisinePayload(form);
      return isCreate
        ? createCuisineItem(payload)
        : updateCuisineItem(id!, { ...payload, version: itemQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(cuisineToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-cuisine'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-cuisine-item', saved.id] });
      message.success(isCreate ? 'Đã tạo món ăn' : 'Đã lưu thay đổi');
      navigate(`/content/cuisine/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'CUISINE_ITEM_VERSION_CONFLICT') {
        setConflict(true);
      }
      for (const fieldError of getCuisineSuggestedPlaceApiFieldErrors(error)) {
        const visibleField = fieldError.field === 'id' ? 'name' : fieldError.field;
        setError(
          `suggestedPlaces.${fieldError.index}.${visibleField}` as FieldPath<CuisineFormValues>,
          { type: 'server', message: fieldError.message },
        );
      }
      message.error(describeCuisineError(error));
    },
  });

  const disabled = !canManage || saveMutation.isPending;

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/cuisine');
    };
    if (!isDirty || !canManage) return leave();
    Modal.confirm({
      title: 'Hủy thay đổi?',
      content: 'Các nội dung chưa lưu sẽ bị mất.',
      okText: 'Rời trang',
      cancelText: 'Ở lại',
      okButtonProps: { danger: true },
      onOk: leave,
    });
  }

  async function loadLatest(): Promise<void> {
    const result = await itemQuery.refetch();
    if (result.data) {
      reset(cuisineToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  function changeVisibility(checked: boolean, onChange: (value: boolean) => void): void {
    if (checked && values.suggestedPlaces.some(cannotActivate)) {
      values.suggestedPlaces.forEach((place, index) => {
        if (!place.name.trim()) {
          setError(`suggestedPlaces.${index}.name`, { type: 'manual', message: 'Bắt buộc khi bật hiển thị' });
        }
        if (!place.address.trim()) {
          setError(`suggestedPlaces.${index}.address`, { type: 'manual', message: 'Bắt buộc khi bật hiển thị' });
        }
        if (!isValidGoogleMapsUrl(place.googleMapsUrl)) {
          setError(`suggestedPlaces.${index}.googleMapsUrl`, { type: 'manual', message: 'Cần link Google Maps hợp lệ trước khi bật hiển thị' });
        }
      });
      message.warning('Hãy hoàn tất tên, địa chỉ và link Google Maps của mọi địa điểm trước khi bật hiển thị');
      return;
    }
    onChange(checked);
  }

  if (isCreate && !canManage) {
    return <Alert type="error" showIcon title="Bạn không có quyền tạo món ăn" action={<Button onClick={() => navigate('/content/cuisine')}>Về danh sách</Button>} />;
  }
  if (!isCreate && itemQuery.isLoading) return <Skeleton active paragraph={{ rows: 16 }} />;
  if (!isCreate && itemQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được món ăn"
        description={describeCuisineError(itemQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="cuisine-form-page">
      <div className="cuisine-form-page__header">
        <div>
          <Button type="text" htmlType="button" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>
            {isCreate ? 'Thêm món ăn mới' : `${canManage ? 'Chỉnh sửa' : 'Chi tiết'} ${itemQuery.data?.name ?? ''}`}
          </Typography.Title>
        </div>
        <Space wrap>
          <Button htmlType="button" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button>
          <Button htmlType="button" onClick={cancel}>{canManage ? 'Hủy' : 'Đóng'}</Button>
          {canManage && (
            <Button
              type="primary"
              htmlType="button"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
              disabled={conflict || saveMutation.isPending || (!isCreate && !isDirty)}
              onClick={() => void handleSubmit((form) => saveMutation.mutate(form))()}
            >
              Lưu
            </Button>
          )}
        </Space>
      </div>

      {!canManage && <Alert type="info" showIcon title="Bạn đang xem ở chế độ chỉ đọc" />}
      {conflict && (
        <Alert
          type="warning"
          showIcon
          title="Dữ liệu đã được người khác cập nhật"
          description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải phiên bản mới nhất</Button>}
        />
      )}

      <form className="cuisine-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="name" control={control} render={({ field }) => (
                <Form.Item label="Tên món" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
                  <Input {...field} disabled={disabled} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="category" control={control} render={({ field }) => (
                <Form.Item label="Danh mục" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}>
                  <Select {...field} disabled={disabled} options={CUISINE_CATEGORIES.map((value) => ({ value, label: value }))} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Controller name="priceRange" control={control} render={({ field }) => (
                <Form.Item label="Khoảng giá" required validateStatus={errors.priceRange ? 'error' : undefined} help={errors.priceRange?.message}>
                  <Input {...field} disabled={disabled} maxLength={100} placeholder="VD: 40.000đ - 80.000đ" />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={12}>
              <Controller name="bestTime" control={control} render={({ field }) => (
                <Form.Item label="Thời điểm nên ăn" required validateStatus={errors.bestTime ? 'error' : undefined} help={errors.bestTime?.message}>
                  <Input {...field} disabled={disabled} maxLength={100} placeholder="VD: Buổi sáng" />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={12} lg={4}>
              <Controller name="sortOrder" control={control} render={({ field }) => (
                <Form.Item label="Thứ tự">
                  <InputNumber {...field} disabled={disabled} min={0} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              )} />
            </Col>
            <Col xs={12} lg={8}>
              <Controller name="isActive" control={control} render={({ field }) => (
                <Form.Item label="Hiển thị trên Mini App">
                  <Switch checked={field.value} disabled={disabled} onChange={(checked) => changeVisibility(checked, field.onChange)} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Controller name="summary" control={control} render={({ field }) => (
            <Form.Item label="Mô tả ngắn" required validateStatus={errors.summary ? 'error' : undefined} help={errors.summary?.message}>
              <Input.TextArea {...field} disabled={disabled} rows={3} maxLength={300} showCount />
            </Form.Item>
          )} />
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
              setValue('mediaId', mediaId, { shouldDirty: true, shouldValidate: true });
              setValue('imageUrl', imageUrl, { shouldDirty: true, shouldValidate: true });
            }}
            onRemove={() => {
              setValue('mediaId', null, { shouldDirty: true, shouldValidate: true });
              setValue('imageUrl', null, { shouldDirty: true, shouldValidate: true });
            }}
          />
          <Controller name="imageAlt" control={control} render={({ field }) => (
            <Form.Item label="Mô tả ảnh" validateStatus={errors.imageAlt ? 'error' : undefined} help={errors.imageAlt?.message}>
              <Input {...field} disabled={disabled} maxLength={150} showCount />
            </Form.Item>
          )} />
        </Card>

        <Card
          title="Địa điểm gợi ý"
          extra={canManage && (
            <Button
              htmlType="button"
              icon={<PlusOutlined />}
              disabled={places.fields.length >= 20 || disabled}
              onClick={() => places.append(createEmptyCuisineSuggestedPlace())}
            >
              Thêm địa điểm
            </Button>
          )}
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
          {!places.fields.length && <Typography.Text type="secondary">Chưa có địa điểm gợi ý.</Typography.Text>}
          <div className="cuisine-form-page__places">
            {places.fields.map((item, index) => {
              const place = values.suggestedPlaces[index];
              const mapsUrl = getSafeGoogleMapsUrl(place?.googleMapsUrl ?? '');
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
                  extra={canManage && (
                    <Space size={4}>
                      <Tooltip title="Đưa địa điểm lên">
                        <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa địa điểm lên" disabled={index === 0 || disabled} onClick={() => places.move(index, index - 1)} />
                      </Tooltip>
                      <Tooltip title="Đưa địa điểm xuống">
                        <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa địa điểm xuống" disabled={index === places.fields.length - 1 || disabled} onClick={() => places.move(index, index + 1)} />
                      </Tooltip>
                      <Tooltip title="Xóa địa điểm">
                        <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa địa điểm" disabled={disabled} onClick={() => places.remove(index)} />
                      </Tooltip>
                    </Space>
                  )}
                >
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Controller name={`suggestedPlaces.${index}.name`} control={control} render={({ field }) => {
                        const errorId = `${nameInputId}-error`;
                        return (
                          <Form.Item
                            label="Tên địa điểm"
                            htmlFor={nameInputId}
                            required
                            validateStatus={placeErrors?.name ? 'error' : undefined}
                            help={placeErrors?.name?.message ? <span id={errorId}>{placeErrors.name.message}</span> : undefined}
                          >
                            <Input {...field} id={nameInputId} disabled={disabled} maxLength={200} showCount aria-invalid={Boolean(placeErrors?.name)} aria-describedby={placeErrors?.name ? errorId : undefined} />
                          </Form.Item>
                        );
                      }} />
                    </Col>
                    <Col xs={24} md={12}>
                      <Controller name={`suggestedPlaces.${index}.address`} control={control} render={({ field }) => {
                        const errorId = `${addressInputId}-error`;
                        return (
                          <Form.Item
                            label="Địa chỉ"
                            htmlFor={addressInputId}
                            required={values.isActive}
                            validateStatus={placeErrors?.address ? 'error' : undefined}
                            help={placeErrors?.address?.message ? <span id={errorId}>{placeErrors.address.message}</span> : undefined}
                          >
                            <Input {...field} id={addressInputId} disabled={disabled} maxLength={255} showCount aria-invalid={Boolean(placeErrors?.address)} aria-describedby={placeErrors?.address ? errorId : undefined} />
                          </Form.Item>
                        );
                      }} />
                    </Col>
                    <Col xs={24} lg={16}>
                      <Controller name={`suggestedPlaces.${index}.googleMapsUrl`} control={control} render={({ field }) => {
                        const errorId = `${mapsUrlInputId}-error`;
                        return (
                          <Form.Item
                            label="Link Google Maps"
                            htmlFor={mapsUrlInputId}
                            required={values.isActive}
                            validateStatus={placeErrors?.googleMapsUrl ? 'error' : undefined}
                            help={placeErrors?.googleMapsUrl?.message ? <span id={errorId}>{placeErrors.googleMapsUrl.message}</span> : undefined}
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
                              aria-invalid={Boolean(placeErrors?.googleMapsUrl)}
                              aria-describedby={placeErrors?.googleMapsUrl ? errorId : undefined}
                            />
                          </Form.Item>
                        );
                      }} />
                    </Col>
                    <Col xs={24} lg={8} className="cuisine-form-page__maps-action">
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
          extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={descriptions.fields.length >= 20 || disabled} onClick={() => descriptions.append({ text: '' })}>Thêm đoạn</Button>}
        >
          {errors.descriptions?.root?.message && <Alert type="error" title={errors.descriptions.root.message} />}
          {descriptions.fields.map((item, index) => (
            <div className="cuisine-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`descriptions.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.descriptions?.[index]?.text ? 'error' : undefined} help={errors.descriptions?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} disabled={disabled} rows={4} maxLength={5000} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space orientation="vertical">
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0 || disabled} onClick={() => descriptions.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === descriptions.fields.length - 1 || disabled} onClick={() => descriptions.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={descriptions.fields.length === 1 || disabled} onClick={() => descriptions.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card
          title="Điểm nổi bật"
          extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={highlights.fields.length >= 20 || disabled} onClick={() => highlights.append({ text: '' })}>Thêm điểm nổi bật</Button>}
        >
          {!highlights.fields.length && <Typography.Text type="secondary">Chưa có điểm nổi bật.</Typography.Text>}
          {highlights.fields.map((item, index) => (
            <div className="cuisine-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`highlights.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Điểm ${index + 1}`} validateStatus={errors.highlights?.[index]?.text ? 'error' : undefined} help={errors.highlights?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input {...field} disabled={disabled} maxLength={200} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space>
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa điểm nổi bật lên" disabled={index === 0 || disabled} onClick={() => highlights.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa điểm nổi bật xuống" disabled={index === highlights.fields.length - 1 || disabled} onClick={() => highlights.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa điểm nổi bật" disabled={disabled} onClick={() => highlights.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card title="Mẹo thưởng thức">
          <Controller name="tip" control={control} render={({ field }) => (
            <Form.Item validateStatus={errors.tip ? 'error' : undefined} help={errors.tip?.message}>
              <Input.TextArea {...field} disabled={disabled} rows={5} maxLength={2000} showCount />
            </Form.Item>
          )} />
        </Card>
      </form>

      <CuisinePreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
