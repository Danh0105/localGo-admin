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
  createAgricultureItem,
  fetchAgricultureItem,
  updateAgricultureItem,
} from '../../../api/agriculture';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { AGRICULTURE_CATEGORIES } from '../../../types/agriculture';
import { ApiError } from '../../../types/api';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeAgricultureError } from './agriculture-errors';
import {
  EMPTY_AGRICULTURE_FORM,
  agricultureFormSchema,
  agricultureFormToPayload,
  agricultureToForm,
  type AgricultureFormValues,
} from './agriculture.schema';
import { AgriculturePreviewDrawer } from './AgriculturePreviewDrawer';
import './agriculture.css';

export function AgricultureFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const itemQuery = useQuery({
    queryKey: ['admin-agriculture-item', id],
    queryFn: ({ signal }) => fetchAgricultureItem(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AgricultureFormValues>({
    resolver: zodResolver(agricultureFormSchema),
    defaultValues: EMPTY_AGRICULTURE_FORM,
  });

  const descriptionItems = useFieldArray({ control, name: 'descriptionItems', keyName: 'fieldKey' });
  const highlightItems = useFieldArray({ control, name: 'highlightItems', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => {
    if (itemQuery.data) reset(agricultureToForm(itemQuery.data));
  }, [itemQuery.data, reset]);

  useEffect(() => {
    setGlobalDirty(isDirty, 'Bạn có thay đổi chưa lưu ở Nông nghiệp. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: AgricultureFormValues) => {
      const payload = agricultureFormToPayload(form);
      return isCreate
        ? createAgricultureItem(payload)
        : updateAgricultureItem(id!, { ...payload, version: itemQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(agricultureToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-agriculture'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-agriculture-item', saved.id] });
      message.success(isCreate ? 'Đã tạo mục nông nghiệp' : 'Đã lưu thay đổi');
      navigate(`/content/agriculture/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'AGRICULTURE_ITEM_VERSION_CONFLICT') {
        setConflict(true);
      }
      message.error(describeAgricultureError(error));
    },
  });

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/agriculture');
    };
    if (!isDirty) return leave();
    Modal.confirm({
      title: 'Hủy thay đổi?',
      content: 'Các nội dung chưa lưu sẽ bị mất.',
      okText: 'Hủy thay đổi',
      cancelText: 'Tiếp tục chỉnh sửa',
      okButtonProps: { danger: true },
      onOk: leave,
    });
  }

  async function loadLatest(): Promise<void> {
    const result = await itemQuery.refetch();
    if (result.data) {
      reset(agricultureToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (!isCreate && itemQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!isCreate && itemQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không tải được mục nông nghiệp"
        description={describeAgricultureError(itemQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void itemQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="agriculture-form-page">
      <div className="agriculture-form-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>
            {isCreate ? 'Thêm mục Nông nghiệp' : `Chỉnh sửa ${itemQuery.data?.name ?? ''}`}
          </Typography.Title>
        </div>
        <Space wrap>
          <Controller name="isActive" control={control} render={({ field }) => (
            <Space><Typography.Text>Hiển thị trên Mini App</Typography.Text><Switch checked={field.value} onChange={field.onChange} /></Space>
          )} />
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button>
          <Button onClick={cancel}>Hủy</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saveMutation.isPending}
            disabled={conflict || saveMutation.isPending || (!isCreate && !isDirty)}
            onClick={() => void handleSubmit((form) => saveMutation.mutate(form))()}
          >
            Lưu
          </Button>
        </Space>
      </div>

      {conflict && (
        <Alert
          type="warning"
          showIcon
          title="Dữ liệu đã được người khác cập nhật"
          description="Nội dung đang nhập vẫn được giữ nguyên. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải phiên bản mới</Button>}
        />
      )}

      <form className="agriculture-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="name" control={control} render={({ field }) => (
                <Form.Item label="Tên mục" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
                  <Input {...field} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="category" control={control} render={({ field }) => (
                <Form.Item label="Danh mục" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}>
                  <Select {...field} options={AGRICULTURE_CATEGORIES.map((value) => ({ value, label: value }))} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Controller name="location" control={control} render={({ field }) => (
            <Form.Item label="Khu vực / vị trí" required validateStatus={errors.location ? 'error' : undefined} help={errors.location?.message}>
              <Input {...field} maxLength={255} showCount />
            </Form.Item>
          )} />
          <Row gutter={16}>
            <Col xs={24} lg={8}>
              <Controller name="season" control={control} render={({ field }) => (
                <Form.Item label="Mùa vụ" required validateStatus={errors.season ? 'error' : undefined} help={errors.season?.message}>
                  <Input {...field} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="scale" control={control} render={({ field }) => (
                <Form.Item label="Quy mô" required validateStatus={errors.scale ? 'error' : undefined} help={errors.scale?.message}>
                  <Input {...field} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="sortOrder" control={control} render={({ field }) => (
                <Form.Item label="Thứ tự hiển thị"><InputNumber {...field} min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
              )} />
            </Col>
          </Row>
          <Controller name="summary" control={control} render={({ field }) => (
            <Form.Item label="Mô tả ngắn" required validateStatus={errors.summary ? 'error' : undefined} help={errors.summary?.message}>
              <Input.TextArea {...field} rows={3} maxLength={300} showCount />
            </Form.Item>
          )} />
        </Card>

        <Card title="Ảnh đại diện">
          <ImageUploadField
            label="Ảnh đại diện"
            imageUrl={values.imageUrl ?? undefined}
            alt={values.imageAlt}
            disabled={saveMutation.isPending}
            errorMessage={errors.imageUrl?.message}
            hint="JPEG, PNG hoặc WebP; file được upload trước, form chỉ gửi mediaId."
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
              <Input {...field} maxLength={150} showCount />
            </Form.Item>
          )} />
        </Card>

        <Card title="Thông tin mô hình" extra={<Button icon={<PlusOutlined />} disabled={descriptionItems.fields.length >= 20} onClick={() => descriptionItems.append({ text: '' })}>Thêm đoạn</Button>}>
          {descriptionItems.fields.map((item, index) => (
            <div className="agriculture-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`descriptionItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.descriptionItems?.[index]?.text ? 'error' : undefined} help={errors.descriptionItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} rows={4} maxLength={5000} showCount />
                </Form.Item>
              )} />
              <Space orientation="vertical">
                <Button icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0} onClick={() => descriptionItems.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === descriptionItems.fields.length - 1} onClick={() => descriptionItems.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={descriptionItems.fields.length === 1} onClick={() => descriptionItems.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card title="Điểm nổi bật" extra={<Button icon={<PlusOutlined />} disabled={highlightItems.fields.length >= 20} onClick={() => highlightItems.append({ text: '' })}>Thêm điểm nổi bật</Button>}>
          {highlightItems.fields.length === 0 && <Typography.Text type="secondary">Chưa có điểm nổi bật.</Typography.Text>}
          {highlightItems.fields.map((item, index) => (
            <div className="agriculture-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`highlightItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Điểm ${index + 1}`} validateStatus={errors.highlightItems?.[index]?.text ? 'error' : undefined} help={errors.highlightItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input {...field} maxLength={200} showCount />
                </Form.Item>
              )} />
              <Space>
                <Button icon={<ArrowUpOutlined />} aria-label="Đưa điểm lên" disabled={index === 0} onClick={() => highlightItems.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} aria-label="Đưa điểm xuống" disabled={index === highlightItems.fields.length - 1} onClick={() => highlightItems.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} aria-label="Xóa điểm" onClick={() => highlightItems.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card title="Hỗ trợ người dân">
          <Controller name="support" control={control} render={({ field }) => (
            <Form.Item label="Thông tin liên hệ / hướng dẫn hỗ trợ" required validateStatus={errors.support ? 'error' : undefined} help={errors.support?.message}>
              <Input.TextArea {...field} rows={5} maxLength={2000} showCount />
            </Form.Item>
          )} />
        </Card>
      </form>

      <AgriculturePreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
