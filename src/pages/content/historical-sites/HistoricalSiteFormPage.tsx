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
  createHistoricalSite,
  fetchHistoricalSite,
  updateHistoricalSite,
} from '../../../api/historical-sites';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeHistoricalSiteError } from './historical-site-errors';
import {
  EMPTY_HISTORICAL_SITE_FORM,
  historicalSiteFormSchema,
  historicalSiteFormToPayload,
  historicalSiteToForm,
  type HistoricalSiteFormValues,
} from './historical-site.schema';
import { HistoricalSitePreviewDrawer } from './HistoricalSitePreviewDrawer';
import './historical-sites.css';

const CURRENT_YEAR = new Date().getFullYear();

export function HistoricalSiteFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const siteQuery = useQuery({
    queryKey: ['admin-historical-site', id],
    queryFn: ({ signal }) => fetchHistoricalSite(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<HistoricalSiteFormValues>({
    resolver: zodResolver(historicalSiteFormSchema),
    defaultValues: EMPTY_HISTORICAL_SITE_FORM,
  });

  const historyItems = useFieldArray({ control, name: 'historyItems', keyName: 'fieldKey' });
  const highlightItems = useFieldArray({ control, name: 'highlightItems', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => {
    if (siteQuery.data) reset(historicalSiteToForm(siteQuery.data));
  }, [reset, siteQuery.data]);

  useEffect(() => {
    setGlobalDirty(isDirty, 'Bạn có thay đổi chưa lưu ở Di tích lịch sử. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: HistoricalSiteFormValues) => {
      const payload = historicalSiteFormToPayload(form);
      return isCreate
        ? createHistoricalSite(payload)
        : updateHistoricalSite(id!, { ...payload, version: siteQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(historicalSiteToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-historical-sites'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-historical-site', saved.id] });
      message.success(isCreate ? 'Đã tạo di tích' : 'Đã lưu thay đổi');
      navigate(`/content/historical-sites/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (
        error instanceof ApiError &&
        error.status === 409 &&
        error.code === 'HISTORICAL_SITE_VERSION_CONFLICT'
      ) {
        setConflict(true);
      }
      message.error(describeHistoricalSiteError(error));
    },
  });

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/historical-sites');
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
    const result = await siteQuery.refetch();
    if (result.data) {
      reset(historicalSiteToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (!isCreate && siteQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!isCreate && siteQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được di tích"
        description={describeHistoricalSiteError(siteQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void siteQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="historical-site-form-page">
      <div className="historical-site-form-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>
            {isCreate ? 'Thêm Di tích lịch sử' : `Chỉnh sửa ${siteQuery.data?.name ?? ''}`}
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
          message="Dữ liệu đã được người khác cập nhật"
          description="Nội dung đang nhập vẫn được giữ nguyên. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải phiên bản mới</Button>}
        />
      )}

      <form className="historical-site-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="name" control={control} render={({ field }) => (
                <Form.Item label="Tên di tích" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
                  <Input {...field} maxLength={150} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="rank" control={control} render={({ field }) => (
                <Form.Item label="Xếp hạng" required>
                  <Select {...field} options={['Cấp quốc gia', 'Cấp tỉnh', 'Chưa xếp hạng'].map((value) => ({ value, label: value }))} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Controller name="address" control={control} render={({ field }) => (
            <Form.Item label="Địa chỉ" required validateStatus={errors.address ? 'error' : undefined} help={errors.address?.message}>
              <Input {...field} maxLength={255} showCount />
            </Form.Item>
          )} />
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Controller name="recognizedYear" control={control} render={({ field }) => (
                <Form.Item label="Năm công nhận" validateStatus={errors.recognizedYear ? 'error' : undefined} help={errors.recognizedYear?.message} extra={values.rank === 'Chưa xếp hạng' ? 'Có thể để trống khi chưa xếp hạng.' : undefined}>
                  <InputNumber {...field} value={field.value ?? undefined} onChange={(value) => field.onChange(value ?? null)} min={1} max={CURRENT_YEAR} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={12}>
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
            label="ảnh đại diện"
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

        <Card title="Lịch sử di tích" extra={<Button icon={<PlusOutlined />} disabled={historyItems.fields.length >= 20} onClick={() => historyItems.append({ text: '' })}>Thêm đoạn</Button>}>
          {historyItems.fields.map((item, index) => (
            <div className="historical-site-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`historyItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.historyItems?.[index]?.text ? 'error' : undefined} help={errors.historyItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} rows={4} maxLength={5000} showCount />
                </Form.Item>
              )} />
              <Space orientation="vertical">
                <Button icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0} onClick={() => historyItems.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === historyItems.fields.length - 1} onClick={() => historyItems.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={historyItems.fields.length === 1} onClick={() => historyItems.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card title="Điểm nổi bật" extra={<Button icon={<PlusOutlined />} disabled={highlightItems.fields.length >= 20} onClick={() => highlightItems.append({ text: '' })}>Thêm điểm nổi bật</Button>}>
          {highlightItems.fields.length === 0 && <Typography.Text type="secondary">Chưa có điểm nổi bật.</Typography.Text>}
          {highlightItems.fields.map((item, index) => (
            <div className="historical-site-form-page__dynamic-row historical-site-form-page__highlight" key={item.fieldKey}>
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
      </form>

      <HistoricalSitePreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
