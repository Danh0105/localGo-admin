import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Skeleton, Space, Switch, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createExperienceTour,
  fetchExperienceTour,
  updateExperienceTour,
} from '../../../api/experience-tours';
import { useAuthStore } from '../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { EXPERIENCE_TOUR_CATEGORIES } from '../../../types/experience-tour';
import { getApiFieldError } from '../../../utils/api-field-error';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeExperienceTourError } from './experience-tour-errors';
import {
  EMPTY_EXPERIENCE_TOUR_FORM,
  experienceTourFormSchema,
  experienceTourFormToPayload,
  experienceTourToForm,
  type ExperienceTourFormValues,
} from './experience-tour.schema';
import { ExperienceTourPreviewDrawer } from './ExperienceTourPreviewDrawer';
import './experience-tours.css';

export function ExperienceTourFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const itemQuery = useQuery({
    queryKey: ['admin-experience-tour-item', id],
    queryFn: ({ signal }) => fetchExperienceTour(id!, signal),
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
  } = useForm<ExperienceTourFormValues>({
    resolver: zodResolver(experienceTourFormSchema),
    defaultValues: EMPTY_EXPERIENCE_TOUR_FORM,
  });

  const descriptionItems = useFieldArray({ control, name: 'descriptionItems', keyName: 'fieldKey' });
  const itineraryItems = useFieldArray({ control, name: 'itineraryItems', keyName: 'fieldKey' });
  const includedItems = useFieldArray({ control, name: 'includedItems', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => {
    if (itemQuery.data) reset(experienceTourToForm(itemQuery.data));
  }, [itemQuery.data, reset]);

  useEffect(() => {
    setGlobalDirty(canManage && isDirty, 'Bạn có thay đổi chưa lưu ở Tour trải nghiệm. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [canManage, isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: ExperienceTourFormValues) => {
      const payload = experienceTourFormToPayload(form);
      return isCreate
        ? createExperienceTour(payload)
        : updateExperienceTour(id!, { ...payload, version: itemQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(experienceTourToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-experience-tours'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-experience-tour-item', saved.id] });
      message.success(isCreate ? 'Đã tạo tour trải nghiệm' : 'Đã lưu thay đổi');
      navigate(`/content/experience-tours/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'EXPERIENCE_TOUR_VERSION_CONFLICT') {
        setConflict(true);
      }
      const contactPhoneError = getApiFieldError(error, 'contactPhone', 'Số điện thoại liên hệ chưa hợp lệ');
      if (contactPhoneError) setError('contactPhone', { type: 'server', message: contactPhoneError });
      message.error(describeExperienceTourError(error));
    },
  });

  const disabled = !canManage || saveMutation.isPending;

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/experience-tours');
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
      reset(experienceTourToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (isCreate && !canManage) {
    return <Alert type="error" showIcon message="Bạn không có quyền tạo tour trải nghiệm" action={<Button onClick={() => navigate('/content/experience-tours')}>Về danh sách</Button>} />;
  }
  if (!isCreate && itemQuery.isLoading) return <Skeleton active paragraph={{ rows: 16 }} />;
  if (!isCreate && itemQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được tour trải nghiệm"
        description={describeExperienceTourError(itemQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="experience-tour-form-page">
      <div className="experience-tour-form-page__header">
        <div>
          <Button type="text" htmlType="button" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>
            {isCreate ? 'Thêm tour trải nghiệm' : `${canManage ? 'Chỉnh sửa' : 'Chi tiết'} ${itemQuery.data?.name ?? ''}`}
          </Typography.Title>
        </div>
        <Space wrap>
          <Controller name="isActive" control={control} render={({ field }) => (
            <Space>
              <Typography.Text>Hiển thị trên Mini App</Typography.Text>
              <Switch checked={field.value} disabled={disabled} onChange={field.onChange} />
            </Space>
          )} />
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

      {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}
      {conflict && (
        <Alert
          type="warning"
          showIcon
          message="Dữ liệu đã được người khác cập nhật"
          description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải phiên bản mới nhất</Button>}
        />
      )}

      <form className="experience-tour-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="name" control={control} render={({ field }) => (
                <Form.Item label="Tên tour" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
                  <Input {...field} disabled={disabled} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="category" control={control} render={({ field }) => (
                <Form.Item label="Danh mục" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}>
                  <Select {...field} disabled={disabled} options={EXPERIENCE_TOUR_CATEGORIES.map((value) => ({ value, label: value }))} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12} xl={6}>
              <Controller name="duration" control={control} render={({ field }) => (
                <Form.Item label="Thời lượng" required validateStatus={errors.duration ? 'error' : undefined} help={errors.duration?.message}>
                  <Input {...field} disabled={disabled} maxLength={100} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Controller name="startTime" control={control} render={({ field }) => (
                <Form.Item label="Khung giờ khởi hành" required validateStatus={errors.startTime ? 'error' : undefined} help={errors.startTime?.message}>
                  <Input {...field} disabled={disabled} maxLength={100} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Controller name="priceRange" control={control} render={({ field }) => (
                <Form.Item label="Khoảng giá" required validateStatus={errors.priceRange ? 'error' : undefined} help={errors.priceRange?.message}>
                  <Input {...field} disabled={disabled} maxLength={100} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Controller name="contactPhone" control={control} render={({ field }) => (
                <Form.Item label="Số điện thoại liên hệ" required validateStatus={errors.contactPhone ? 'error' : undefined} help={errors.contactPhone?.message}>
                  <Input {...field} disabled={disabled} maxLength={30} inputMode="tel" autoComplete="tel" showCount placeholder="0900 123 456" />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="meetingPoint" control={control} render={({ field }) => (
                <Form.Item label="Điểm hẹn" required validateStatus={errors.meetingPoint ? 'error' : undefined} help={errors.meetingPoint?.message}>
                  <Input {...field} disabled={disabled} maxLength={255} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="sortOrder" control={control} render={({ field }) => (
                <Form.Item label="Thứ tự hiển thị">
                  <InputNumber {...field} disabled={disabled} min={0} precision={0} style={{ width: '100%' }} />
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
            label="Ảnh đại diện"
            imageUrl={values.imageUrl ?? undefined}
            alt={values.imageAlt}
            disabled={disabled}
            errorMessage={errors.imageUrl?.message}
            errorId="experience-tour-image-error"
            hint="JPEG, PNG hoặc WebP; form chỉ gửi mediaId sau khi upload."
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

        <Card title="Mô tả chi tiết" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={descriptionItems.fields.length >= 20 || disabled} onClick={() => descriptionItems.append({ text: '' })}>Thêm đoạn</Button>}>
          {descriptionItems.fields.map((item, index) => (
            <div className="experience-tour-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`descriptionItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.descriptionItems?.[index]?.text ? 'error' : undefined} help={errors.descriptionItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} disabled={disabled} rows={4} maxLength={5000} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space orientation="vertical">
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0 || disabled} onClick={() => descriptionItems.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === descriptionItems.fields.length - 1 || disabled} onClick={() => descriptionItems.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={descriptionItems.fields.length === 1 || disabled} onClick={() => descriptionItems.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card title="Lịch trình" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={itineraryItems.fields.length >= 30 || disabled} onClick={() => itineraryItems.append({ text: '' })}>Thêm bước</Button>}>
          {itineraryItems.fields.map((item, index) => (
            <div className="experience-tour-form-page__dynamic-row" key={item.fieldKey}>
              <span className="experience-tour-form-page__step-badge" aria-label={`Bước ${index + 1}`}>{index + 1}</span>
              <Controller name={`itineraryItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Bước ${index + 1}`} validateStatus={errors.itineraryItems?.[index]?.text ? 'error' : undefined} help={errors.itineraryItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} disabled={disabled} rows={2} maxLength={300} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space>
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa bước lên" disabled={index === 0 || disabled} onClick={() => itineraryItems.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa bước xuống" disabled={index === itineraryItems.fields.length - 1 || disabled} onClick={() => itineraryItems.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa bước" disabled={itineraryItems.fields.length === 1 || disabled} onClick={() => itineraryItems.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card title="Bao gồm" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={includedItems.fields.length >= 20 || disabled} onClick={() => includedItems.append({ text: '' })}>Thêm mục</Button>}>
          {!includedItems.fields.length && <Typography.Text type="secondary">Chưa có mục bao gồm.</Typography.Text>}
          {includedItems.fields.map((item, index) => (
            <div className="experience-tour-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`includedItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Mục ${index + 1}`} validateStatus={errors.includedItems?.[index]?.text ? 'error' : undefined} help={errors.includedItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input {...field} disabled={disabled} maxLength={300} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space>
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa mục bao gồm lên" disabled={index === 0 || disabled} onClick={() => includedItems.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa mục bao gồm xuống" disabled={index === includedItems.fields.length - 1 || disabled} onClick={() => includedItems.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa mục bao gồm" disabled={disabled} onClick={() => includedItems.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card title="Ghi chú">
          <Controller name="note" control={control} render={({ field }) => (
            <Form.Item validateStatus={errors.note ? 'error' : undefined} help={errors.note?.message}>
              <Input.TextArea {...field} disabled={disabled} rows={5} maxLength={2000} showCount />
            </Form.Item>
          )} />
        </Card>
      </form>

      <ExperienceTourPreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
