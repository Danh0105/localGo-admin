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
import { createTemple, fetchTemple, updateTemple } from '../../../api/temples';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeTempleError, getTempleErrorDetails, getTempleErrorRequestId } from './temple-errors';
import { EMPTY_TEMPLE_FORM, formToPayload, templeFormSchema, templeToForm, type TempleFormValues } from './temple.schema';
import { TemplePreviewDrawer } from './TemplePreviewDrawer';
import './temples.css';

export function TempleFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const templeQuery = useQuery({
    queryKey: ['admin-temple', id],
    queryFn: ({ signal }) => fetchTemple(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TempleFormValues>({ resolver: zodResolver(templeFormSchema), defaultValues: EMPTY_TEMPLE_FORM });

  const descriptions = useFieldArray({ control, name: 'descriptions', keyName: 'fieldKey' });
  const events = useFieldArray({ control, name: 'events', keyName: 'fieldKey' });
  const values = watch();
  const saveErrorTitle = isCreate ? 'Không thể tạo địa điểm' : 'Không thể cập nhật địa điểm';

  useEffect(() => {
    if (templeQuery.data) reset(templeToForm(templeQuery.data));
  }, [reset, templeQuery.data]);

  useEffect(() => {
    setGlobalDirty(isDirty, 'Bạn có thay đổi chưa lưu ở điểm du lịch. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: TempleFormValues) => {
      const payload = formToPayload(form);
      return isCreate ? createTemple(payload) : updateTemple(id!, { ...payload, version: templeQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(templeToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-temples'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-temple', saved.id] });
      message.success(isCreate ? 'Đã tạo địa điểm' : 'Đã lưu thay đổi');
      navigate(`/content/temples/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'TEMPLE_VERSION_CONFLICT') setConflict(true);
      message.error(`${saveErrorTitle}: ${describeTempleError(error)}`, 6);
    },
  });
  const saveErrorDetails = getTempleErrorDetails(saveMutation.error);
  const saveErrorRequestId = getTempleErrorRequestId(saveMutation.error);

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/temples');
    };
    if (!isDirty) return leave();
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
    const result = await templeQuery.refetch();
    if (result.data) {
      reset(templeToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (!isCreate && templeQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!isCreate && templeQuery.isError) {
    return <Alert type="error" showIcon message="Không tải được địa điểm" description={describeTempleError(templeQuery.error)} action={<Button icon={<ReloadOutlined />} onClick={() => void templeQuery.refetch()}>Thử lại</Button>} />;
  }

  return (
    <div className="temple-form-page">
      <div className="temple-form-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>{isCreate ? 'Thêm Đền - Chùa - Miếu' : `Chỉnh sửa ${templeQuery.data?.name ?? ''}`}</Typography.Title>
        </div>
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button>
          <Button onClick={cancel}>Hủy</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saveMutation.isPending} disabled={conflict || saveMutation.isPending || (!isCreate && !isDirty)} onClick={() => void handleSubmit((form) => saveMutation.mutate(form))()}>Lưu</Button>
        </Space>
      </div>

      {conflict && (
        <Alert
          type="warning"
          showIcon
          message="Dữ liệu đã được người khác cập nhật"
          description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải bản mới nhất</Button>}
        />
      )}
      {saveMutation.isError && !conflict && (
        <Alert
          type="error"
          showIcon
          closable
          message={saveErrorTitle}
          description={(
            <div className="temple-form-page__save-error">
              <div>{describeTempleError(saveMutation.error)}</div>
              {saveErrorDetails.length > 0 && (
                <>
                  <Typography.Text strong>Chi tiết cần kiểm tra:</Typography.Text>
                  <ul>
                    {saveErrorDetails.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                </>
              )}
              {saveErrorRequestId && (
                <div>
                  Mã tra cứu lỗi: <Typography.Text code copyable>{saveErrorRequestId}</Typography.Text>
                </div>
              )}
              <Typography.Text type="secondary">
                Thông tin đang nhập vẫn được giữ nguyên. Bạn có thể chỉnh lại và bấm Lưu để thử lại.
              </Typography.Text>
            </div>
          )}
          onClose={() => saveMutation.reset()}
        />
      )}

      <form className="temple-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="name" control={control} render={({ field }) => <Form.Item label="Tên địa điểm" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}><Input {...field} maxLength={150} showCount /></Form.Item>} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="type" control={control} render={({ field }) => <Form.Item label="Loại" required><Select {...field} options={['Đình', 'Chùa', 'Miếu'].map((value) => ({ value, label: value }))} /></Form.Item>} />
            </Col>
          </Row>
          <Controller name="address" control={control} render={({ field }) => <Form.Item label="Địa chỉ" required validateStatus={errors.address ? 'error' : undefined} help={errors.address?.message}><Input {...field} maxLength={255} showCount /></Form.Item>} />
          <Row gutter={16}>
            <Col xs={24} lg={16}><Controller name="openHours" control={control} render={({ field }) => <Form.Item label="Giờ mở cửa" required validateStatus={errors.openHours ? 'error' : undefined} help={errors.openHours?.message}><Input {...field} maxLength={100} /></Form.Item>} /></Col>
            <Col xs={12} lg={4}><Controller name="sortOrder" control={control} render={({ field }) => <Form.Item label="Thứ tự"><InputNumber {...field} min={0} precision={0} style={{ width: '100%' }} /></Form.Item>} /></Col>
            <Col xs={12} lg={4}><Controller name="isActive" control={control} render={({ field }) => <Form.Item label="Hiển thị"><Switch checked={field.value} onChange={field.onChange} /></Form.Item>} /></Col>
          </Row>
          <Controller name="summary" control={control} render={({ field }) => <Form.Item label="Mô tả ngắn" required validateStatus={errors.summary ? 'error' : undefined} help={errors.summary?.message}><Input.TextArea {...field} rows={3} maxLength={300} showCount /></Form.Item>} />
        </Card>

        <Card title="Ảnh đại diện">
          <ImageUploadField
            label="ảnh đại diện"
            imageUrl={values.imageUrl ?? undefined}
            alt={values.imageAlt}
            disabled={saveMutation.isPending}
            errorMessage={errors.imageUrl?.message}
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
          <Controller name="imageAlt" control={control} render={({ field }) => <Form.Item label="Mô tả ảnh" validateStatus={errors.imageAlt ? 'error' : undefined} help={errors.imageAlt?.message}><Input {...field} maxLength={150} showCount /></Form.Item>} />
        </Card>

        <Card title="Mô tả chi tiết" extra={<Button icon={<PlusOutlined />} disabled={descriptions.fields.length >= 20} onClick={() => descriptions.append({ text: '' })}>Thêm đoạn</Button>}>
          {errors.descriptions?.root?.message && <Alert type="error" message={errors.descriptions.root.message} />}
          {descriptions.fields.map((item, index) => (
            <div className="temple-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`descriptions.${index}.text`} control={control} render={({ field }) => <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.descriptions?.[index]?.text ? 'error' : undefined} help={errors.descriptions?.[index]?.text?.message} style={{ flex: 1 }}><Input.TextArea {...field} rows={4} maxLength={5000} showCount /></Form.Item>} />
              <Space orientation="vertical">
                <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => descriptions.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} disabled={index === descriptions.fields.length - 1} onClick={() => descriptions.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} disabled={descriptions.fields.length === 1} onClick={() => descriptions.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card title="Lễ hội - Sự kiện" extra={<Button icon={<PlusOutlined />} disabled={events.fields.length >= 30} onClick={() => events.append({ time: '', name: '' })}>Thêm sự kiện</Button>}>
          {events.fields.length === 0 && <Typography.Text type="secondary">Chưa có sự kiện.</Typography.Text>}
          {events.fields.map((item, index) => (
            <div className="temple-form-page__dynamic-row temple-form-page__event" key={item.fieldKey}>
              <Controller name={`events.${index}.time`} control={control} render={({ field }) => <Form.Item label="Thời gian" validateStatus={errors.events?.[index]?.time ? 'error' : undefined} help={errors.events?.[index]?.time?.message}><Input {...field} maxLength={50} placeholder="16/3 âm lịch" /></Form.Item>} />
              <Controller name={`events.${index}.name`} control={control} render={({ field }) => <Form.Item label="Tên sự kiện" validateStatus={errors.events?.[index]?.name ? 'error' : undefined} help={errors.events?.[index]?.name?.message}><Input {...field} maxLength={150} /></Form.Item>} />
              <Space>
                <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => events.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} disabled={index === events.fields.length - 1} onClick={() => events.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} onClick={() => events.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>
      </form>

      <TemplePreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
