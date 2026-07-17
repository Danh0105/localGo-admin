import { EyeOutlined, ReloadOutlined, RollbackOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Modal, Skeleton, Space, Typography, message } from 'antd';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { discardAboutDraft, fetchAboutAdmin, fetchAboutPreview, publishAbout, saveAboutDraft } from '../../../api/about';
import { useAuthStore } from '../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../store/unsaved-changes-store';
import { ApiError } from '../../../types/api';
import { ABOUT_PUBLISHER_ROLES } from '../../../types/about';
import { draftToFormValues, formValuesToDraftPayload } from './about.mapper';
import { aboutFormSchema, type AboutFormValues } from './about.schema';
import { AboutPreviewDrawer } from './AboutPreviewDrawer';
import { HeroSection } from './sections/HeroSection';
import { OverviewSection } from './sections/OverviewSection';
import { StatisticsSection } from './sections/StatisticsSection';
import { HighlightsSection } from './sections/HighlightsSection';
import { MilestonesSection } from './sections/MilestonesSection';
import './about-page.css';

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (error.status === 409) return 'Dữ liệu đã được người khác cập nhật';
    if (error.status && error.status >= 500) return 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    return error.message || 'Thao tác thất bại, vui lòng thử lại';
  }
  return 'Lỗi kết nối mạng, vui lòng kiểm tra lại';
}

export function AboutPage(): JSX.Element {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.role);
  const setDirty = useUnsavedChangesStore((s) => s.setDirty);

  // Both admin-panel roles (MODERATOR, ADMIN) may view and save drafts today — this codebase
  // has no separate "view-only" role. Only ADMIN may publish, per product decision.
  const canPublish = !!role && ABOUT_PUBLISHER_ROLES.includes(role);

  const [conflict, setConflict] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const aboutQuery = useQuery({
    queryKey: ['admin-about'],
    queryFn: ({ signal }) => fetchAboutAdmin(signal),
  });

  const previewQuery = useQuery({
    queryKey: ['admin-about-preview'],
    queryFn: ({ signal }) => fetchAboutPreview(signal),
    enabled: false,
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<AboutFormValues>({
    resolver: zodResolver(aboutFormSchema),
    defaultValues: {
      title: '',
      hero: { imageAlt: '' },
      overview: { title: '', paragraphs: [] },
      statistics: [],
      highlightsSectionTitle: '',
      highlights: [],
      milestonesSectionTitle: '',
      milestones: [],
    },
  });

  useEffect(() => {
    if (aboutQuery.data) {
      reset(draftToFormValues(aboutQuery.data));
    }
    // Only re-sync when a fresh fetch/refetch arrives — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aboutQuery.data]);

  useEffect(() => {
    setDirty(isDirty, 'Bạn có thay đổi chưa lưu ở trang Giới thiệu. Rời khỏi trang sẽ mất các thay đổi này.');
  }, [isDirty, setDirty]);

  useEffect(() => {
    return () => {
      useUnsavedChangesStore.getState().setDirty(false);
    };
  }, []);

  const saveMutation = useMutation({
    mutationFn: (values: AboutFormValues) => saveAboutDraft(formValuesToDraftPayload(values, aboutQuery.data!.version)),
    onSuccess: (draft) => {
      reset(draftToFormValues(draft));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-about'] });
      message.success('Đã lưu nháp');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
      }
      message.error(describeError(error));
    },
  });

  const publishMutation = useMutation({
    mutationFn: publishAbout,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-about'] });
      message.success('Đã xuất bản nội dung Giới thiệu');
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
      }
      message.error(describeError(error));
    },
  });

  const discardMutation = useMutation({
    mutationFn: discardAboutDraft,
    onSuccess: (draft) => {
      reset(draftToFormValues(draft));
      setConflict(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-about'] });
      message.success('Đã hủy các thay đổi chưa xuất bản');
    },
    onError: (error: unknown) => message.error(describeError(error)),
  });

  async function handleLoadLatest(): Promise<void> {
    const result = await aboutQuery.refetch();
    if (result.data) {
      reset(draftToFormValues(result.data));
      setConflict(false);
      message.info('Đã tải phiên bản mới nhất');
    }
  }

  const onSaveDraft = handleSubmit((values) => {
    if (conflict || saveMutation.isPending) return;
    saveMutation.mutate(values);
  });

  function handlePublishClick(): void {
    void handleSubmit((values) => {
      if (conflict || publishMutation.isPending) return;
      Modal.confirm({
        title: 'Xuất bản nội dung Giới thiệu?',
        content: 'Nội dung sẽ hiển thị công khai trên Mini App ngay sau khi xuất bản.',
        okText: 'Xuất bản',
        cancelText: 'Hủy',
        onOk: async () => {
          if (isDirty) {
            await saveMutation.mutateAsync(values);
          }
          await publishMutation.mutateAsync();
        },
      });
    })();
  }

  function handleDiscardClick(): void {
    Modal.confirm({
      title: 'Hủy các thay đổi chưa xuất bản?',
      content: 'Nội dung sẽ quay về bản đã xuất bản gần nhất. Hành động này không thể hoàn tác.',
      okText: 'Hủy thay đổi',
      okButtonProps: { danger: true },
      cancelText: 'Đóng',
      onOk: () => discardMutation.mutateAsync(),
    });
  }

  function openPreview(): void {
    if (!isDirty) {
      setPreviewOpen(true);
      void previewQuery.refetch();
      return;
    }
    Modal.confirm({
      title: 'Lưu nháp trước khi xem trước?',
      content: 'Bạn có thay đổi chưa lưu. Cần lưu nháp thì bản xem trước mới phản ánh đúng nội dung mới nhất.',
      okText: 'Lưu và xem trước',
      cancelText: 'Hủy',
      onOk: () =>
        handleSubmit(async (values) => {
          await saveMutation.mutateAsync(values);
          setPreviewOpen(true);
          void previewQuery.refetch();
        })(),
    });
  }

  if (aboutQuery.isLoading) {
    return (
      <div className="about-page">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 24 }} />
      </div>
    );
  }

  if (aboutQuery.isError) {
    return (
      <div className="about-page">
        <Alert
          type="error"
          showIcon
          message="Không tải được nội dung Giới thiệu"
          description={describeError(aboutQuery.error)}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void aboutQuery.refetch()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  const draft = aboutQuery.data!;
  const isBusy = saveMutation.isPending || discardMutation.isPending || publishMutation.isPending;
  const statusBadge = !draft.publishedAt
    ? { status: 'default' as const, text: 'Chưa xuất bản' }
    : draft.hasUnpublishedChanges
      ? { status: 'warning' as const, text: 'Có thay đổi chưa xuất bản' }
      : { status: 'success' as const, text: 'Đã xuất bản' };

  return (
    <div className="about-page">
      <div className="about-page__header">
        <div>
          <Space align="center">
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Quản lý nội dung Giới thiệu
            </Typography.Title>
            <Badge status={statusBadge.status} text={statusBadge.text} />
          </Space>
          <Typography.Text type="secondary">
            Cập nhật lần cuối: {formatDate(draft.updatedAt)}
            {draft.updatedBy ? ` bởi ${draft.updatedBy}` : ''}
          </Typography.Text>
        </div>
        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={openPreview} loading={previewQuery.isFetching}>
            Xem trước
          </Button>
          <Button
            icon={<RollbackOutlined />}
            onClick={handleDiscardClick}
            disabled={(!isDirty && !draft.hasUnpublishedChanges) || discardMutation.isPending || saveMutation.isPending}
            loading={discardMutation.isPending}
          >
            Hủy thay đổi
          </Button>
          <Button
            type="default"
            icon={<SaveOutlined />}
            onClick={() => void onSaveDraft()}
            disabled={!isDirty || conflict || saveMutation.isPending}
            loading={saveMutation.isPending}
          >
            Lưu nháp
          </Button>
          {canPublish && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handlePublishClick}
              disabled={conflict || publishMutation.isPending || (!isDirty && !draft.hasUnpublishedChanges)}
              loading={publishMutation.isPending}
            >
              Xuất bản
            </Button>
          )}
        </Space>
      </div>

      {conflict && (
        <Alert
          type="warning"
          showIcon
          className="about-page__conflict"
          message="Dữ liệu đã được người khác cập nhật"
          description="Thay đổi bạn đang nhập vẫn được giữ nguyên trên form. Tải phiên bản mới nhất để xem thay đổi của người khác, sau đó áp dụng lại chỉnh sửa của bạn."
          action={
            <Button size="small" onClick={() => void handleLoadLatest()}>
              Tải phiên bản mới
            </Button>
          }
        />
      )}

      <form
        className="about-page__form"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <HeroSection control={control} errors={errors} readOnly={isBusy} />
        <OverviewSection control={control} errors={errors} readOnly={isBusy} />
        <StatisticsSection control={control} errors={errors} readOnly={isBusy} />
        <HighlightsSection control={control} errors={errors} setValue={setValue} readOnly={isBusy} />
        <MilestonesSection control={control} errors={errors} readOnly={isBusy} />
      </form>

      <AboutPreviewDrawer
        open={previewOpen}
        loading={previewQuery.isFetching}
        data={previewQuery.data ?? null}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
