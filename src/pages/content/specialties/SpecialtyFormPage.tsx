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
import { createSpecialty, fetchSpecialty, updateSpecialty } from '../../../api/specialties';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import type { SpecialtyCategory } from '../../../types/specialty';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeSpecialtyError } from './specialty-errors';
import { EMPTY_SPECIALTY_FORM, formToPayload, specialtyFormSchema, specialtyToForm, type SpecialtyFormValues } from './specialty.schema';
import { SpecialtyPreviewDrawer } from './SpecialtyPreviewDrawer';
import './specialties.css';

const CATEGORY_OPTIONS = (['Món ăn', 'Trái cây', 'Quà mang về'] as SpecialtyCategory[]).map((value) => ({ value, label: value }));

export function SpecialtyFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const specialtyQuery = useQuery({
    queryKey: ['admin-specialty', id],
    queryFn: ({ signal }) => fetchSpecialty(id!, signal),
    enabled: !isCreate,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<SpecialtyFormValues>({ resolver: zodResolver(specialtyFormSchema), defaultValues: EMPTY_SPECIALTY_FORM });

  const descriptions = useFieldArray({ control, name: 'descriptions', keyName: 'fieldKey' });
  const buyPlaces = useFieldArray({ control, name: 'buyPlaces', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => {
    if (specialtyQuery.data) reset(specialtyToForm(specialtyQuery.data));
  }, [reset, specialtyQuery.data]);

  useEffect(() => {
    setGlobalDirty(isDirty, 'Bạn có thay đổi chưa lưu ở đặc sản. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setGlobalDirty]);

  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: SpecialtyFormValues) => {
      const payload = formToPayload(form);
      return isCreate ? createSpecialty(payload) : updateSpecialty(id!, { ...payload, version: specialtyQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(specialtyToForm(saved));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-specialties'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-specialty', saved.id] });
      message.success(isCreate ? 'Đã tạo đặc sản' : 'Đã lưu thay đổi');
      navigate(`/content/specialties/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'SPECIALTY_VERSION_CONFLICT') setConflict(true);
      message.error(describeSpecialtyError(error));
    },
  });

  function cancel(): void {
    const leave = () => {
      setGlobalDirty(false);
      navigate('/content/specialties');
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
    const result = await specialtyQuery.refetch();
    if (result.data) {
      reset(specialtyToForm(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  if (!isCreate && specialtyQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!isCreate && specialtyQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không tải được đặc sản"
        description={describeSpecialtyError(specialtyQuery.error)}
        action={
          <Button icon={<ReloadOutlined />} onClick={() => void specialtyQuery.refetch()}>
            Thử lại
          </Button>
        }
      />
    );
  }

  return (
    <div className="specialty-form-page">
      <div className="specialty-form-page__header">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={cancel}>
            Danh sách
          </Button>
          <Typography.Title level={3}>
            {isCreate ? 'Thêm đặc sản mới' : `Chỉnh sửa ${specialtyQuery.data?.name ?? ''}`}
          </Typography.Title>
        </div>
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            Xem trước
          </Button>
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
          action={
            <Button size="small" onClick={() => void loadLatest()}>
              Tải bản mới nhất
            </Button>
          }
        />
      )}

      <form className="specialty-form-page__form" onSubmit={(event) => event.preventDefault()}>
        <Card title="Thông tin cơ bản">
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Tên đặc sản" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
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
                    <Select {...field} options={CATEGORY_OPTIONS} />
                  </Form.Item>
                )}
              />
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Giá" required validateStatus={errors.price ? 'error' : undefined} help={errors.price?.message}>
                    <Input {...field} maxLength={100} placeholder="VD: 50.000đ/kg" />
                  </Form.Item>
                )}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Controller
                name="season"
                control={control}
                render={({ field }) => (
                  <Form.Item label="Mùa vụ" required validateStatus={errors.season ? 'error' : undefined} help={errors.season?.message}>
                    <Input {...field} maxLength={100} placeholder="VD: Quanh năm, Tháng 5 - Tháng 8" />
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
                  <Form.Item label="Hiển thị trên Mini App">
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
          extra={
            <Button icon={<PlusOutlined />} disabled={descriptions.fields.length >= 20} onClick={() => descriptions.append({ text: '' })}>
              Thêm đoạn
            </Button>
          }
        >
          {errors.descriptions?.root?.message && <Alert type="error" message={errors.descriptions.root.message} />}
          {descriptions.fields.map((item, index) => (
            <div className="specialty-form-page__dynamic-row" key={item.fieldKey}>
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
                <Button icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0} onClick={() => descriptions.move(index, index - 1)} />
                <Button
                  icon={<ArrowDownOutlined />}
                  aria-label="Đưa đoạn xuống"
                  disabled={index === descriptions.fields.length - 1}
                  onClick={() => descriptions.move(index, index + 1)}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  aria-label="Xóa đoạn"
                  disabled={descriptions.fields.length === 1}
                  onClick={() => descriptions.remove(index)}
                />
              </Space>
            </div>
          ))}
        </Card>

        <Card
          title="Địa điểm mua"
          extra={
            <Button icon={<PlusOutlined />} disabled={buyPlaces.fields.length >= 20} onClick={() => buyPlaces.append({ text: '' })}>
              Thêm địa điểm
            </Button>
          }
        >
          {buyPlaces.fields.length === 0 && <Typography.Text type="secondary">Chưa có địa điểm mua.</Typography.Text>}
          {buyPlaces.fields.map((item, index) => (
            <div className="specialty-form-page__dynamic-row" key={item.fieldKey}>
              <Controller
                name={`buyPlaces.${index}.text`}
                control={control}
                render={({ field }) => (
                  <Form.Item
                    label={`Địa điểm ${index + 1}`}
                    validateStatus={errors.buyPlaces?.[index]?.text ? 'error' : undefined}
                    help={errors.buyPlaces?.[index]?.text?.message}
                    style={{ flex: 1 }}
                  >
                    <Input {...field} maxLength={200} placeholder="VD: Chợ Bến Thành, Quận 1" />
                  </Form.Item>
                )}
              />
              <Space>
                <Button icon={<ArrowUpOutlined />} aria-label="Đưa địa điểm lên" disabled={index === 0} onClick={() => buyPlaces.move(index, index - 1)} />
                <Button
                  icon={<ArrowDownOutlined />}
                  aria-label="Đưa địa điểm xuống"
                  disabled={index === buyPlaces.fields.length - 1}
                  onClick={() => buyPlaces.move(index, index + 1)}
                />
                <Button danger icon={<DeleteOutlined />} aria-label="Xóa địa điểm" onClick={() => buyPlaces.remove(index)} />
              </Space>
            </div>
          ))}
        </Card>
      </form>

      <SpecialtyPreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
