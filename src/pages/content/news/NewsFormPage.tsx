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
import { Alert, Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Skeleton, Space, Switch, Typography, message } from 'antd';
import dayjs from 'dayjs';
import type { JSX } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { createNewsArticle, fetchNewsArticle, updateNewsArticle } from '../../../api/news';
import { useAuthStore } from '../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { NEWS_CATEGORIES } from '../../../types/news';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeNewsError, getNewsErrorDetails, getNewsErrorRequestId } from './news-errors';
import {
  EMPTY_NEWS_FORM,
  newsFormSchema,
  newsFormToPayload,
  newsToForm,
  type NewsFormValues,
} from './news.schema';
import { NewsPreviewDrawer } from './NewsPreviewDrawer';
import './news.css';

function isFutureDate(value: string): boolean {
  return Number.isFinite(Date.parse(value)) && new Date(value).getTime() > Date.now();
}

function scheduledMessage(value: string): string {
  return `Đã lên lịch đăng lúc ${new Date(value).toLocaleString('vi-VN')}`;
}

export function NewsFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const articleQuery = useQuery({
    queryKey: ['admin-news-article', id],
    queryFn: ({ signal }) => fetchNewsArticle(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: EMPTY_NEWS_FORM,
  });

  const contentItems = useFieldArray({ control, name: 'contentItems', keyName: 'fieldKey' });
  const tagItems = useFieldArray({ control, name: 'tagItems', keyName: 'fieldKey' });
  const relatedItems = useFieldArray({ control, name: 'relatedItems', keyName: 'fieldKey' });
  const values = watch();
  const isScheduled = useMemo(() => isFutureDate(values.publishedAt), [values.publishedAt]);
  const saveErrorTitle = isCreate ? 'Không thể tạo bài viết' : 'Không thể cập nhật bài viết';

  useEffect(() => {
    if (articleQuery.data) reset(newsToForm(articleQuery.data));
  }, [articleQuery.data, reset]);

  useEffect(() => {
    setGlobalDirty(canManage && isDirty, 'Bạn có thay đổi chưa lưu ở Tin tức. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [canManage, isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: NewsFormValues) => {
      const payload = newsFormToPayload(form);
      return isCreate ? createNewsArticle(payload) : updateNewsArticle(id!, { ...payload, version: articleQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(newsToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-news-article', saved.id] });
      message.success(saved.isActive && isFutureDate(saved.publishedAt) ? scheduledMessage(saved.publishedAt) : (isCreate ? 'Đã tạo bài viết' : 'Đã lưu thay đổi'));
      navigate(`/content/news/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'NEWS_ARTICLE_VERSION_CONFLICT') {
        setConflict(true);
      }
      message.error(`${saveErrorTitle}: ${describeNewsError(error)}`, 6);
    },
  });
  const saveErrorDetails = getNewsErrorDetails(saveMutation.error);
  const saveErrorRequestId = getNewsErrorRequestId(saveMutation.error);

  const disabled = !canManage || saveMutation.isPending;

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/news');
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
    const result = await articleQuery.refetch();
    if (result.data) {
      reset(newsToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (isCreate && !canManage) {
    return <Alert type="error" showIcon message="Bạn không có quyền viết bài mới" action={<Button onClick={() => navigate('/content/news')}>Về danh sách</Button>} />;
  }
  if (!isCreate && articleQuery.isLoading) return <Skeleton active paragraph={{ rows: 16 }} />;
  if (!isCreate && articleQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được bài viết"
        description={describeNewsError(articleQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void articleQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="news-form-page">
      <div className="news-form-page__header">
        <div>
          <Button type="text" htmlType="button" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>
            {isCreate ? 'Viết bài mới' : `${canManage ? 'Chỉnh sửa' : 'Chi tiết'} ${articleQuery.data?.title ?? ''}`}
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
      {saveMutation.isError && !conflict && (
        <Alert
          type="error"
          showIcon
          closable
          message={saveErrorTitle}
          description={(
            <div className="news-form-page__save-error">
              <div>{describeNewsError(saveMutation.error)}</div>
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
      {values.isActive && isScheduled && (
        <Alert type="info" showIcon message="Bài viết đang được lên lịch" description={`Bài sẽ hiển thị từ ${new Date(values.publishedAt).toLocaleString('vi-VN')}.`} />
      )}

      <form className="news-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller name="title" control={control} render={({ field }) => (
                <Form.Item label="Tiêu đề" required validateStatus={errors.title ? 'error' : undefined} help={errors.title?.message}>
                  <Input {...field} disabled={disabled} maxLength={200} showCount />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={8}>
              <Controller name="category" control={control} render={({ field }) => (
                <Form.Item label="Danh mục" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}>
                  <Select {...field} disabled={disabled} options={NEWS_CATEGORIES.map((value) => ({ value, label: value }))} />
                </Form.Item>
              )} />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Controller name="publishedAt" control={control} render={({ field }) => (
                <Form.Item label="Ngày đăng" required validateStatus={errors.publishedAt ? 'error' : undefined} help={errors.publishedAt?.message}>
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm"
                    value={Number.isFinite(Date.parse(field.value)) ? dayjs(field.value) : null}
                    disabled={disabled}
                    style={{ width: '100%' }}
                    onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                  />
                </Form.Item>
              )} />
            </Col>
            <Col xs={24} lg={12}>
              <Controller name="author" control={control} render={({ field }) => (
                <Form.Item label="Tác giả / đơn vị đăng" required validateStatus={errors.author ? 'error' : undefined} help={errors.author?.message}>
                  <Input {...field} disabled={disabled} maxLength={150} showCount />
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
            errorId="news-image-error"
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

        <Card title="Nội dung" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={contentItems.fields.length >= 30 || disabled} onClick={() => contentItems.append({ text: '' })}>Thêm đoạn</Button>}>
          {contentItems.fields.map((item, index) => (
            <div className="news-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`contentItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.contentItems?.[index]?.text ? 'error' : undefined} help={errors.contentItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input.TextArea {...field} disabled={disabled} rows={4} maxLength={5000} showCount />
                </Form.Item>
              )} />
              {canManage && (
                <Space orientation="vertical">
                  <Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0 || disabled} onClick={() => contentItems.move(index, index - 1)} />
                  <Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === contentItems.fields.length - 1 || disabled} onClick={() => contentItems.move(index, index + 1)} />
                  <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={contentItems.fields.length === 1 || disabled} onClick={() => contentItems.remove(index)} />
                </Space>
              )}
            </div>
          ))}
        </Card>

        <Card title="Từ khóa (tags)" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={tagItems.fields.length >= 15 || disabled} onClick={() => tagItems.append({ text: '' })}>Thêm từ khóa</Button>}>
          {!tagItems.fields.length && <Typography.Text type="secondary">Chưa có từ khóa.</Typography.Text>}
          {tagItems.fields.map((item, index) => (
            <div className="news-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`tagItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Tag ${index + 1}`} validateStatus={errors.tagItems?.[index]?.text ? 'error' : undefined} help={errors.tagItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input {...field} disabled={disabled} maxLength={100} showCount />
                </Form.Item>
              )} />
              {canManage && <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa từ khóa" disabled={disabled} onClick={() => tagItems.remove(index)} />}
            </div>
          ))}
        </Card>

        <Card title="Liên quan" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={relatedItems.fields.length >= 15 || disabled} onClick={() => relatedItems.append({ text: '' })}>Thêm mục liên quan</Button>}>
          <Typography.Paragraph type="secondary">Nhập nhãn hiển thị tự do, chưa phải link điều hướng.</Typography.Paragraph>
          {!relatedItems.fields.length && <Typography.Text type="secondary">Chưa có mục liên quan.</Typography.Text>}
          {relatedItems.fields.map((item, index) => (
            <div className="news-form-page__dynamic-row" key={item.fieldKey}>
              <Controller name={`relatedItems.${index}.text`} control={control} render={({ field }) => (
                <Form.Item label={`Mục ${index + 1}`} validateStatus={errors.relatedItems?.[index]?.text ? 'error' : undefined} help={errors.relatedItems?.[index]?.text?.message} style={{ flex: 1 }}>
                  <Input {...field} disabled={disabled} maxLength={100} showCount />
                </Form.Item>
              )} />
              {canManage && <Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa mục liên quan" disabled={disabled} onClick={() => relatedItems.remove(index)} />}
            </div>
          ))}
        </Card>
      </form>

      <NewsPreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
