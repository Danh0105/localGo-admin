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
import { createFeedbackChannel, fetchFeedbackChannel, updateFeedbackChannel } from '../../../api/feedback-channels';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { FEEDBACK_CATEGORIES } from '../../../types/feedback-channel';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeFeedbackChannelError } from './feedback-channel-errors';
import {
  EMPTY_FEEDBACK_CHANNEL_FORM,
  feedbackChannelFormSchema,
  feedbackChannelFormToPayload,
  feedbackChannelToForm,
  type FeedbackChannelFormValues,
} from './feedback-channel.schema';
import { FeedbackChannelPreviewDrawer } from './FeedbackChannelPreviewDrawer';
import './feedback-channels.css';

export function FeedbackChannelFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const channelQuery = useQuery({
    queryKey: ['admin-feedback-channel', id],
    queryFn: ({ signal }) => fetchFeedbackChannel(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FeedbackChannelFormValues>({
    resolver: zodResolver(feedbackChannelFormSchema),
    defaultValues: EMPTY_FEEDBACK_CHANNEL_FORM,
  });

  const descriptions = useFieldArray({ control, name: 'descriptions', keyName: 'fieldKey' });
  const requiredInfoItems = useFieldArray({ control, name: 'requiredInfoItems', keyName: 'fieldKey' });
  const exampleItems = useFieldArray({ control, name: 'exampleItems', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => {
    if (channelQuery.data) reset(feedbackChannelToForm(channelQuery.data));
  }, [reset, channelQuery.data]);

  useEffect(() => {
    setGlobalDirty(isDirty, 'Bạn có thay đổi chưa lưu ở kênh phản hồi. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: FeedbackChannelFormValues) => {
      const payload = feedbackChannelFormToPayload(form);
      return isCreate
        ? createFeedbackChannel(payload)
        : updateFeedbackChannel(id!, { ...payload, version: channelQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(feedbackChannelToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback-channels'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-feedback-channel', saved.id] });
      message.success(isCreate ? 'Đã tạo kênh phản hồi' : 'Đã lưu thay đổi');
      navigate(`/content/feedback-channels/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'FEEDBACK_CHANNEL_VERSION_CONFLICT') {
        setConflict(true);
      }
      message.error(describeFeedbackChannelError(error));
    },
  });

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/feedback-channels');
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
    const result = await channelQuery.refetch();
    if (result.data) {
      reset(feedbackChannelToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (!isCreate && channelQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!isCreate && channelQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được kênh phản hồi"
        description={describeFeedbackChannelError(channelQuery.error)}
        action={<Button icon={<ReloadOutlined />} onClick={() => void channelQuery.refetch()}>Thử lại</Button>}
      />
    );
  }

  return (
    <div className="feedback-channel-form-page">
      <div className="feedback-channel-form-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
          <Typography.Title level={3}>{isCreate ? 'Thêm kênh phản hồi' : `Chỉnh sửa ${channelQuery.data?.title ?? ''}`}</Typography.Title>
        </div>
        <Space wrap>
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
          description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải bản mới nhất trước khi tiếp tục lưu."
          action={<Button size="small" onClick={() => void loadLatest()}>Tải bản mới nhất</Button>}
        />
      )}

      <form className="feedback-channel-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Tiêu đề" required validateStatus={errors.title ? 'error' : undefined} help={errors.title?.message}>
                    <Input {...field} maxLength={150} showCount />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} lg={8}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Danh mục" required>
                    <Select {...field} options={FEEDBACK_CATEGORIES.map((value) => ({ value, label: value }))} />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller
                name="responseTime"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Thời gian phản hồi dự kiến" required validateStatus={errors.responseTime ? 'error' : undefined} help={errors.responseTime?.message}>
                    <Input {...field} maxLength={150} placeholder="Tiếp nhận trong giờ hành chính" />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={12} lg={4}>
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Thứ tự">
                    <InputNumber {...field} min={0} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={12} lg={4}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Hiển thị">
                    <Switch checked={field.value} onChange={field.onChange} />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <Controller
            name="summary"
            control={control}
            render={({ field }) => (
              <Form.Item label="Tóm tắt" required validateStatus={errors.summary ? 'error' : undefined} help={errors.summary?.message}>
                <Input.TextArea {...field} rows={3} maxLength={300} showCount />
              </Form.Item>
            )}
          />
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
          <Controller
            name="imageAlt"
            control={control}
            render={({ field }) => (
              <Form.Item label="Mô tả ảnh" validateStatus={errors.imageAlt ? 'error' : undefined} help={errors.imageAlt?.message}>
                <Input {...field} maxLength={150} showCount />
              </Form.Item>
            )}
          />
        </Card>

        <Card
          title="Mô tả chi tiết"
          extra={<Button icon={<PlusOutlined />} disabled={descriptions.fields.length >= 20} onClick={() => descriptions.append({ text: '' })}>Thêm đoạn</Button>}
        >
          {errors.descriptions?.root?.message && <Alert type="error" message={errors.descriptions.root.message} />}
          {descriptions.fields.map((item, index) => (
            <div className="feedback-channel-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`descriptions.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Đoạn ${index + 1}`}
                    validateStatus={errors.descriptions?.[index]?.text ? 'error' : undefined}
                    help={errors.descriptions?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input.TextArea {...field} rows={4} maxLength={5000} showCount />
                  </Form.Item>
                )}
              />
              <Space orientation="vertical">
                <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => descriptions.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} disabled={index === descriptions.fields.length - 1} onClick={() => descriptions.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} disabled={descriptions.fields.length === 1} onClick={() => descriptions.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card
          title="Thông tin cần cung cấp"
          extra={<Button icon={<PlusOutlined />} disabled={requiredInfoItems.fields.length >= 20} onClick={() => requiredInfoItems.append({ text: '' })}>Thêm mục</Button>}
        >
          {errors.requiredInfoItems?.root?.message && <Alert type="error" message={errors.requiredInfoItems.root.message} />}
          {requiredInfoItems.fields.map((item, index) => (
            <div className="feedback-channel-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`requiredInfoItems.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Mục ${index + 1}`}
                    validateStatus={errors.requiredInfoItems?.[index]?.text ? 'error' : undefined}
                    help={errors.requiredInfoItems?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input {...field} maxLength={300} placeholder="Họ tên, Số điện thoại, ..." />
                  </Form.Item>
                )}
              />
              <Space>
                <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => requiredInfoItems.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} disabled={index === requiredInfoItems.fields.length - 1} onClick={() => requiredInfoItems.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} disabled={requiredInfoItems.fields.length === 1} onClick={() => requiredInfoItems.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card
          title="Ví dụ nội dung"
          extra={<Button icon={<PlusOutlined />} disabled={exampleItems.fields.length >= 20} onClick={() => exampleItems.append({ text: '' })}>Thêm ví dụ</Button>}
        >
          {exampleItems.fields.length === 0 && <Typography.Text type="secondary">Chưa có ví dụ.</Typography.Text>}
          {exampleItems.fields.map((item, index) => (
            <div className="feedback-channel-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`exampleItems.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Ví dụ ${index + 1}`}
                    validateStatus={errors.exampleItems?.[index]?.text ? 'error' : undefined}
                    help={errors.exampleItems?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input {...field} maxLength={300} />
                  </Form.Item>
                )}
              />
              <Space>
                <Button icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => exampleItems.move(index, index - 1)} />
                <Button icon={<ArrowDownOutlined />} disabled={index === exampleItems.fields.length - 1} onClick={() => exampleItems.move(index, index + 1)} />
                <Button danger icon={<DeleteOutlined />} onClick={() => exampleItems.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>

        <Card title="Lưu ý">
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <Form.Item validateStatus={errors.note ? 'error' : undefined} help={errors.note?.message}>
                <Input.TextArea {...field} rows={3} maxLength={2000} showCount placeholder="Lưu ý dành cho người gửi phản hồi" />
              </Form.Item>
            )}
          />
        </Card>
      </form>

      <FeedbackChannelPreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
