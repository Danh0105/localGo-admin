import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AboutPage } from '../AboutPage';
import { AboutPreviewDrawer } from '../AboutPreviewDrawer';
import * as aboutApi from '../../../../api/about';
import { useAuthStore } from '../../../../store/auth-store';
import { useUnsavedChangesStore } from '../../../../store/unsaved-changes-store';
import { ApiError } from '../../../../types/api';
import type { AboutDraft, AboutPreview } from '../../../../types/about';
import type { CurrentUser } from '../../../../types/user';

vi.mock('../../../../api/about');
vi.mock('../../../../api/media');

const mockedAboutApi = vi.mocked(aboutApi);

function makeDraft(overrides: Partial<AboutDraft> = {}): AboutDraft {
  return {
    id: 'about',
    version: 3,
    title: 'Về LocalGo',
    hero: { mediaId: 'm1', imageUrl: 'https://cdn/hero.jpg', imageAlt: 'Hero alt' },
    overview: { title: 'Tổng quan', paragraphs: ['Đoạn 1', 'Đoạn 2'] },
    statistics: [{ id: 's1', sortOrder: 0, isActive: true, value: '100', unit: '+', label: 'Đối tác' }],
    highlightsSectionTitle: 'Điểm nổi bật',
    highlights: [
      {
        id: 'h1',
        sortOrder: 0,
        isActive: true,
        title: 'Nổi bật 1',
        description: 'Mô tả 1',
        imageUrl: 'https://cdn/h1.jpg',
        imageAlt: 'H1 alt',
      },
    ],
    milestonesSectionTitle: 'Dấu mốc',
    milestones: [{ id: 'ms1', sortOrder: 0, isActive: true, year: '2024', description: 'Ra mắt LocalGo' }],
    hasUnpublishedChanges: false,
    publishedAt: '2024-01-01T00:00:00.000Z',
    publishedBy: 'admin@localgo.vn',
    updatedAt: '2024-01-02T00:00:00.000Z',
    updatedBy: 'admin@localgo.vn',
    ...overrides,
  };
}

function makePreview(overrides: Partial<AboutPreview> = {}): AboutPreview {
  return {
    title: 'Về LocalGo',
    hero: { imageUrl: 'https://cdn/hero.jpg', imageAlt: 'Hero alt' },
    overview: { title: 'Tổng quan', paragraphs: ['Đoạn 1', 'Đoạn 2'] },
    statistics: [{ id: 's1', value: '100', unit: '+', label: 'Đối tác' }],
    highlightsSectionTitle: 'Điểm nổi bật',
    highlights: [{ id: 'h1', title: 'Nổi bật 1', description: 'Mô tả 1', imageUrl: 'https://cdn/h1.jpg', imageAlt: 'H1 alt' }],
    milestonesSectionTitle: 'Dấu mốc',
    milestones: [{ id: 'ms1', year: '2024', description: 'Ra mắt LocalGo' }],
    ...overrides,
  };
}

function setUser(role: CurrentUser['role']): void {
  useAuthStore.setState({
    user: {
      id: 'u1',
      zaloId: null,
      phone: null,
      email: 'user@localgo.vn',
      displayName: 'Người dùng',
      avatarUrl: null,
      role,
      status: 'ACTIVE',
      lastLoginAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  });
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <AboutPage />
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup({ delay: null });
  setUser('ADMIN');
  useUnsavedChangesStore.setState({ isDirty: false });
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
  // antd's message/Modal.confirm portals mount straight onto document.body, outside the React
  // root RTL's own cleanup() unmounts. Their exit animations never resolve in jsdom (no real
  // transitionend), so message.destroy()/Modal.destroyAll() alone can still leave stale nodes
  // behind mid-animation; wiping body after RTL's cleanup has run is the reliable fix.
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('AboutPage', () => {
  it('renders data from GET /admin/about', async () => {
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(makeDraft());
    renderPage();

    expect(await screen.findByDisplayValue('Về LocalGo')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Đoạn 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Đoạn 2')).toBeInTheDocument();
    expect(screen.getByText('Đã xuất bản')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu nháp/ })).toBeDisabled();
  });

  it('adds a statistic and saves a draft with a normalized sortOrder', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    // Echo the submitted payload back, like a real backend would — a stale stub here would
    // shrink the statistics array back down on reset() and make the dirty-state assertion moot.
    mockedAboutApi.saveAboutDraft.mockImplementation(async (payload) => ({
      ...draft,
      ...payload,
      version: draft.version + 1,
      hasUnpublishedChanges: true,
    }));
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    const statsCard = screen.getByText('Các chỉ số').closest('.ant-card') as HTMLElement;
    await user.click(within(statsCard).getByRole('button', { name: /Thêm chỉ số/ }));

    const textboxes = within(statsCard).getAllByRole('textbox');
    // Row 0 is the existing statistic (value/unit/label); the new row is appended after it.
    await user.type(textboxes[3], '500');
    await user.type(textboxes[4], 'người');
    await user.type(textboxes[5], 'Thành viên mới');

    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));

    await waitFor(() => expect(mockedAboutApi.saveAboutDraft).toHaveBeenCalledTimes(1));
    const payload = mockedAboutApi.saveAboutDraft.mock.calls[0][0];
    expect(payload.statistics).toHaveLength(2);
    expect(payload.statistics[1]).toMatchObject({
      value: '500',
      unit: 'người',
      label: 'Thành viên mới',
      sortOrder: 1,
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /Lưu nháp/ })).toBeDisabled());
  });

  it('reorders overview paragraphs and removes one, sending the updated order on save', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.saveAboutDraft.mockResolvedValue(draft);
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    await user.click(screen.getAllByRole('button', { name: 'Di chuyển đoạn văn xuống' })[0]);

    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));
    await waitFor(() => expect(mockedAboutApi.saveAboutDraft).toHaveBeenCalledTimes(1));
    expect(mockedAboutApi.saveAboutDraft.mock.calls[0][0].overview.paragraphs).toEqual(['Đoạn 2', 'Đoạn 1']);
  });

  it('removes a paragraph after confirming, and updates the payload on save', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.saveAboutDraft.mockResolvedValue(draft);
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    await user.click(screen.getAllByRole('button', { name: 'Xóa đoạn văn' })[0]);
    await user.click(await screen.findByRole('button', { name: 'Đồng ý' }));

    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));
    await waitFor(() => expect(mockedAboutApi.saveAboutDraft).toHaveBeenCalledTimes(1));
    expect(mockedAboutApi.saveAboutDraft.mock.calls[0][0].overview.paragraphs).toEqual(['Đoạn 2']);
  });

  it('blocks publish on validation errors without losing what the user typed', async () => {
    const draft = makeDraft({ hasUnpublishedChanges: true });
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    renderPage();
    const titleInput = await screen.findByDisplayValue('Về LocalGo');

    await user.clear(titleInput);
    await user.type(titleInput, 'Bản nháp đang gõ dở');

    // Clear a required field so publish must be blocked by validation.
    const overviewTitleInput = screen.getByDisplayValue('Tổng quan');
    await user.clear(overviewTitleInput);

    await user.click(screen.getByRole('button', { name: /Xuất bản/ }));

    await waitFor(() => expect(screen.getAllByText('Bắt buộc').length).toBeGreaterThan(0));
    expect(mockedAboutApi.publishAbout).not.toHaveBeenCalled();
    expect(mockedAboutApi.saveAboutDraft).not.toHaveBeenCalled();
    // The user's in-progress typing must survive the failed validation.
    expect(screen.getByDisplayValue('Bản nháp đang gõ dở')).toBeInTheDocument();
  });

  it('saves a draft via PUT and does not call publish', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.saveAboutDraft.mockResolvedValue({ ...draft, version: draft.version + 1 });
    renderPage();
    const titleInput = await screen.findByDisplayValue('Về LocalGo');

    await user.type(titleInput, ' mới');
    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));

    await waitFor(() => expect(mockedAboutApi.saveAboutDraft).toHaveBeenCalledTimes(1));
    expect(mockedAboutApi.saveAboutDraft.mock.calls[0][0].version).toBe(3);
    expect(mockedAboutApi.publishAbout).not.toHaveBeenCalled();
  });

  it('preview does not call the publish API', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.fetchAboutPreview.mockResolvedValue(makePreview());
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    await user.click(screen.getByRole('button', { name: /Xem trước/ }));

    await waitFor(() => expect(mockedAboutApi.fetchAboutPreview).toHaveBeenCalledTimes(1));
    expect(mockedAboutApi.publishAbout).not.toHaveBeenCalled();
    expect(await screen.findByText('Xem trước — Giới thiệu (mobile)')).toBeInTheDocument();
  });

  it('publish shows a confirmation modal and guards against double click', async () => {
    const draft = makeDraft({ hasUnpublishedChanges: true });
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.publishAbout.mockResolvedValue(draft);
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    await user.click(screen.getByRole('button', { name: /Xuất bản/ }));
    const confirmButton = await screen.findByRole('button', { name: 'Xuất bản' });

    // antd disables the confirm button synchronously once onOk's promise is pending,
    // so a rapid second click must not trigger a second network call.
    await user.click(confirmButton);
    await user.click(confirmButton).catch(() => undefined);

    await waitFor(() => expect(mockedAboutApi.publishAbout).toHaveBeenCalledTimes(1));
  });

  it('a 403 response surfaces a permission error without discarding the form', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.saveAboutDraft.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' }, undefined, 403),
    );
    renderPage();
    const titleInput = await screen.findByDisplayValue('Về LocalGo');
    await user.type(titleInput, ' sửa');

    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));

    await waitFor(() => expect(mockedAboutApi.saveAboutDraft).toHaveBeenCalledTimes(1));
    expect(await screen.findByDisplayValue('Về LocalGo sửa')).toBeInTheDocument();
  });

  it('a 409 conflict keeps the form and shows a reload option instead of overwriting', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    mockedAboutApi.saveAboutDraft.mockRejectedValue(
      new ApiError({ code: 'ABOUT_VERSION_CONFLICT', message: 'Xung đột phiên bản' }, undefined, 409),
    );
    renderPage();
    const titleInput = await screen.findByDisplayValue('Về LocalGo');
    await user.type(titleInput, ' sửa bởi tôi');

    await user.click(screen.getByRole('button', { name: /Lưu nháp/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Về LocalGo sửa bởi tôi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xuất bản/ })).toBeDisabled();
  });

  it('marks unsaved changes in the shared store while the form is dirty', async () => {
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    renderPage();
    const titleInput = await screen.findByDisplayValue('Về LocalGo');

    expect(useUnsavedChangesStore.getState().isDirty).toBe(false);
    await user.type(titleInput, '!');
    await waitFor(() => expect(useUnsavedChangesStore.getState().isDirty).toBe(true));
  });

  it('hides the publish button for MODERATOR and still allows saving drafts', async () => {
    setUser('MODERATOR');
    const draft = makeDraft();
    mockedAboutApi.fetchAboutAdmin.mockResolvedValue(draft);
    renderPage();
    await screen.findByDisplayValue('Về LocalGo');

    expect(screen.queryByRole('button', { name: /Xuất bản/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu nháp/ })).toBeInTheDocument();
  });
});

describe('AboutPreviewDrawer', () => {
  it('renders only the items present in the resolved preview payload (inactive items are excluded upstream)', () => {
    render(
      <ConfigProvider locale={viVN}>
        <AboutPreviewDrawer open loading={false} data={makePreview({ highlights: [], milestones: [] })} onClose={() => {}} />
      </ConfigProvider>,
    );

    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.queryByText('Nổi bật 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Ra mắt LocalGo')).not.toBeInTheDocument();
  });
});
