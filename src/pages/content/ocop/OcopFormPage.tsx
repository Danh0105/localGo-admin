import { ArrowDownOutlined, ArrowLeftOutlined, ArrowUpOutlined, DeleteOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Radio, Row, Select, Skeleton, Space, Switch, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { createOcopProduct, fetchOcopProduct, updateOcopProduct } from '../../../api/ocop';
import { useAuthStore } from '../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { OCOP_CATEGORIES } from '../../../types/ocop';
import { getApiFieldError } from '../../../utils/api-field-error';
import { ImageUploadField } from '../about/ImageUploadField';
import { describeOcopError } from './ocop-errors';
import { EMPTY_OCOP_FORM, formToOcopPayload, ocopFormSchema, ocopToForm, type OcopFormValues } from './ocop.schema';
import { OcopPreviewDrawer } from './OcopPreviewDrawer';
import './ocop.css';

export function OcopFormPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const isCreate = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.user?.role === 'ADMIN');
  const setGlobalDirty = useUnsavedChangesStore((state) => state.setDirty);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [conflict, setConflict] = useState(false);

  const productQuery = useQuery({ queryKey: ['admin-ocop-product', id], queryFn: ({ signal }) => fetchOcopProduct(id!, signal), enabled: !isCreate });
  const { control, handleSubmit, reset, setError, setValue, watch, formState: { errors, isDirty } } = useForm<OcopFormValues>({
    resolver: zodResolver(ocopFormSchema), defaultValues: EMPTY_OCOP_FORM,
  });
  const descriptions = useFieldArray({ control, name: 'descriptions', keyName: 'fieldKey' });
  const highlights = useFieldArray({ control, name: 'highlights', keyName: 'fieldKey' });
  const values = watch();

  useEffect(() => { if (productQuery.data) reset(ocopToForm(productQuery.data)); }, [productQuery.data, reset]);
  useEffect(() => { setGlobalDirty(canManage && isDirty, 'Bạn có thay đổi chưa lưu ở sản phẩm OCOP. Rời khỏi trang sẽ mất các thay đổi này.'); }, [canManage, isDirty, setGlobalDirty]);
  useEffect(() => () => useUnsavedChangesStore.getState().setDirty(false), []);

  const saveMutation = useMutation({
    mutationFn: (form: OcopFormValues) => {
      const payload = formToOcopPayload(form);
      return isCreate ? createOcopProduct(payload) : updateOcopProduct(id!, { ...payload, version: productQuery.data!.version });
    },
    onSuccess: (saved) => {
      reset(ocopToForm(saved)); setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-ocop'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-ocop-product', saved.id] });
      message.success(isCreate ? 'Đã tạo sản phẩm OCOP' : 'Đã lưu thay đổi');
      navigate(`/content/ocop/${saved.id}`, { replace: true });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409 && error.code === 'OCOP_PRODUCT_VERSION_CONFLICT') setConflict(true);
      const contactPhoneError = getApiFieldError(error, 'contactPhone', 'Số điện thoại liên hệ chưa hợp lệ');
      if (contactPhoneError) setError('contactPhone', { type: 'server', message: contactPhoneError });
      message.error(describeOcopError(error));
    },
  });

  function cancel(): void {
    const leave = () => { setGlobalDirty(false); navigate('/content/ocop'); };
    if (!isDirty || !canManage) return leave();
    Modal.confirm({ title: 'Hủy thay đổi?', content: 'Các nội dung chưa lưu sẽ bị mất.', okText: 'Rời trang', cancelText: 'Ở lại', okButtonProps: { danger: true }, onOk: leave });
  }
  async function loadLatest(): Promise<void> {
    const result = await productQuery.refetch();
    if (result.data) { reset(ocopToForm(result.data)); setConflict(false); message.info('Đã tải phiên bản mới nhất'); }
  }

  if (isCreate && !canManage) return <Alert type="error" showIcon message="Bạn không có quyền tạo sản phẩm OCOP" action={<Button onClick={() => navigate('/content/ocop')}>Về danh sách</Button>} />;
  if (!isCreate && productQuery.isLoading) return <Skeleton active paragraph={{ rows: 14 }} />;
  if (!isCreate && productQuery.isError) return <Alert type="error" showIcon message="Không tải được sản phẩm OCOP" description={describeOcopError(productQuery.error)} action={<Button icon={<ReloadOutlined />} onClick={() => void productQuery.refetch()}>Thử lại</Button>} />;

  const disabled = !canManage || saveMutation.isPending;
  return <div className="ocop-form-page">
    <div className="ocop-form-page__header">
      <div><Button type="text" htmlType="button" icon={<ArrowLeftOutlined />} onClick={cancel}>Danh sách</Button>
        <Typography.Title level={3}>{isCreate ? 'Thêm sản phẩm OCOP mới' : `${canManage ? 'Chỉnh sửa' : 'Chi tiết'} ${productQuery.data?.name ?? ''}`}</Typography.Title></div>
      <Space wrap><Button htmlType="button" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem trước</Button><Button htmlType="button" onClick={cancel}>{canManage ? 'Hủy' : 'Đóng'}</Button>
        {canManage && <Button type="primary" htmlType="button" icon={<SaveOutlined />} loading={saveMutation.isPending}
          disabled={conflict || saveMutation.isPending || (!isCreate && !isDirty)} onClick={() => void handleSubmit((form) => saveMutation.mutate(form))()}>Lưu</Button>}</Space>
    </div>
    {!canManage && <Alert type="info" showIcon message="Bạn đang xem ở chế độ chỉ đọc" />}
    {conflict && <Alert type="warning" showIcon message="Dữ liệu đã được người khác cập nhật" description="Nội dung bạn đang nhập vẫn được giữ trên form. Hãy tải phiên bản mới nhất trước khi tiếp tục lưu." action={<Button size="small" onClick={() => void loadLatest()}>Tải phiên bản mới nhất</Button>} />}
    <form className="ocop-form-page__form" onSubmit={(event) => event.preventDefault()}>
      <Card title="Thông tin cơ bản"><Row gutter={16}>
        <Col xs={24} lg={16}><Controller name="name" control={control} render={({ field }) => <Form.Item label="Tên sản phẩm" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}><Input {...field} disabled={disabled} maxLength={150} showCount /></Form.Item>} /></Col>
        <Col xs={24} lg={8}><Controller name="category" control={control} render={({ field }) => <Form.Item label="Danh mục" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}><Select {...field} disabled={disabled} options={OCOP_CATEGORIES.map((value) => ({ value, label: value }))} /></Form.Item>} /></Col>
      </Row><Row gutter={16}>
        <Col xs={24} md={12} xl={6}><Controller name="rating" control={control} render={({ field }) => <Form.Item label="Hạng sao OCOP" required validateStatus={errors.rating ? 'error' : undefined} help={errors.rating?.message}><Radio.Group {...field} disabled={disabled} options={[3,4,5].map((value) => ({ value, label: `${value} sao` }))} /></Form.Item>} /></Col>
        <Col xs={24} md={12} xl={6}><Controller name="producer" control={control} render={({ field }) => <Form.Item label="Nhà sản xuất" required validateStatus={errors.producer ? 'error' : undefined} help={errors.producer?.message}><Input {...field} disabled={disabled} maxLength={150} showCount /></Form.Item>} /></Col>
        <Col xs={24} md={12} xl={6}><Controller name="priceRange" control={control} render={({ field }) => <Form.Item label="Khoảng giá" required validateStatus={errors.priceRange ? 'error' : undefined} help={errors.priceRange?.message}><Input {...field} disabled={disabled} maxLength={100} placeholder="VD: 80.000đ - 120.000đ" /></Form.Item>} /></Col>
        <Col xs={24} md={12} xl={6}><Controller name="contactPhone" control={control} render={({ field }) => <Form.Item label="Số điện thoại liên hệ" required validateStatus={errors.contactPhone ? 'error' : undefined} help={errors.contactPhone?.message}><Input {...field} disabled={disabled} maxLength={30} inputMode="tel" autoComplete="tel" showCount placeholder="0900 123 456" /></Form.Item>} /></Col>
      </Row>
      <Controller name="address" control={control} render={({ field }) => <Form.Item label="Địa chỉ" required validateStatus={errors.address ? 'error' : undefined} help={errors.address?.message}><Input {...field} disabled={disabled} maxLength={255} showCount /></Form.Item>} />
      <Row gutter={16}><Col xs={12} lg={4}><Controller name="sortOrder" control={control} render={({ field }) => <Form.Item label="Thứ tự"><InputNumber {...field} disabled={disabled} min={0} precision={0} style={{ width: '100%' }} /></Form.Item>} /></Col>
        <Col xs={12} lg={8}><Controller name="isActive" control={control} render={({ field }) => <Form.Item label="Hiển thị trên Mini App"><Switch checked={field.value} disabled={disabled} onChange={field.onChange} /></Form.Item>} /></Col></Row>
      <Controller name="summary" control={control} render={({ field }) => <Form.Item label="Mô tả ngắn" required validateStatus={errors.summary ? 'error' : undefined} help={errors.summary?.message}><Input.TextArea {...field} disabled={disabled} rows={3} maxLength={300} showCount /></Form.Item>} />
      </Card>
      <Card title="Ảnh đại diện"><ImageUploadField label="ảnh đại diện" imageUrl={values.imageUrl ?? undefined} alt={values.imageAlt} disabled={disabled} errorMessage={errors.imageUrl?.message} errorId="ocop-image-error" hint="JPEG, PNG hoặc WebP; backend tự tối ưu sang WebP."
        onUploaded={({ mediaId, imageUrl }) => { setValue('mediaId', mediaId, { shouldDirty: true, shouldValidate: true }); setValue('imageUrl', imageUrl, { shouldDirty: true, shouldValidate: true }); }}
        onRemove={() => { setValue('mediaId', null, { shouldDirty: true, shouldValidate: true }); setValue('imageUrl', null, { shouldDirty: true, shouldValidate: true }); }} />
        <Controller name="imageAlt" control={control} render={({ field }) => <Form.Item label="Mô tả ảnh" validateStatus={errors.imageAlt ? 'error' : undefined} help={errors.imageAlt?.message}><Input {...field} disabled={disabled} maxLength={150} showCount /></Form.Item>} /></Card>
      <Card title="Giới thiệu sản phẩm" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={descriptions.fields.length >= 20 || disabled} onClick={() => descriptions.append({ text: '' })}>Thêm đoạn</Button>}>
        {errors.descriptions?.root?.message && <Alert type="error" message={errors.descriptions.root.message} />}
        {descriptions.fields.map((item, index) => <div className="ocop-form-page__dynamic-row" key={item.fieldKey}>
          <Controller name={`descriptions.${index}.text`} control={control} render={({ field }) => <Form.Item label={`Đoạn ${index + 1}`} validateStatus={errors.descriptions?.[index]?.text ? 'error' : undefined} help={errors.descriptions?.[index]?.text?.message} style={{ flex: 1 }}><Input.TextArea {...field} disabled={disabled} rows={4} maxLength={5000} showCount /></Form.Item>} />
          {canManage && <Space orientation="vertical"><Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa đoạn lên" disabled={index === 0 || disabled} onClick={() => descriptions.move(index,index-1)} /><Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa đoạn xuống" disabled={index === descriptions.fields.length-1 || disabled} onClick={() => descriptions.move(index,index+1)} /><Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa đoạn" disabled={descriptions.fields.length===1 || disabled} onClick={() => descriptions.remove(index)} /></Space>}
        </div>)}</Card>
      <Card title="Điểm nổi bật" extra={canManage && <Button htmlType="button" icon={<PlusOutlined />} disabled={highlights.fields.length >= 20 || disabled} onClick={() => highlights.append({ text: '' })}>Thêm điểm nổi bật</Button>}>
        {!highlights.fields.length && <Typography.Text type="secondary">Chưa có điểm nổi bật.</Typography.Text>}
        {highlights.fields.map((item,index) => <div className="ocop-form-page__dynamic-row" key={item.fieldKey}>
          <Controller name={`highlights.${index}.text`} control={control} render={({ field }) => <Form.Item label={`Điểm ${index+1}`} validateStatus={errors.highlights?.[index]?.text ? 'error' : undefined} help={errors.highlights?.[index]?.text?.message} style={{ flex: 1 }}><Input {...field} disabled={disabled} maxLength={200} showCount /></Form.Item>} />
          {canManage && <Space><Button htmlType="button" icon={<ArrowUpOutlined />} aria-label="Đưa điểm nổi bật lên" disabled={index===0 || disabled} onClick={() => highlights.move(index,index-1)} /><Button htmlType="button" icon={<ArrowDownOutlined />} aria-label="Đưa điểm nổi bật xuống" disabled={index===highlights.fields.length-1 || disabled} onClick={() => highlights.move(index,index+1)} /><Button htmlType="button" danger icon={<DeleteOutlined />} aria-label="Xóa điểm nổi bật" disabled={disabled} onClick={() => highlights.remove(index)} /></Space>}
        </div>)}</Card>
      <Card title="Ghi chú kết nối"><Controller name="contactNote" control={control} render={({ field }) => <Form.Item validateStatus={errors.contactNote ? 'error' : undefined} help={errors.contactNote?.message}><Input.TextArea {...field} disabled={disabled} rows={5} maxLength={2000} showCount placeholder="Thông tin liên hệ, cách đặt mua hoặc ghi chú kết nối..." /></Form.Item>} /></Card>
    </form>
    <OcopPreviewDrawer open={previewOpen} values={values} onClose={() => setPreviewOpen(false)} />
  </div>;
}
