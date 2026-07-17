import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/news';
import { useAuthStore } from '../../../../store/auth-store';
import type { NewsAdminArticle } from '../../../../types/news';
import { NewsPage } from '../NewsPage';

vi.mock('../../../../api/news');

const api = vi.mocked(apiModule);
const admin = {
  id: 'admin',
  zaloId: null,
  phone: null,
  email: null,
  displayName: 'Admin',
  avatarUrl: null,
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  lastLoginAt: null,
  createdAt: '',
  updatedAt: '',
};

function article(overrides: Partial<NewsAdminArticle> = {}): NewsAdminArticle {
  return {
    id: 'news-1',
    version: 2,
    title: 'Thông báo họp dân',
    category: 'Thông báo',
    publishedAt: '2026-01-01T08:00:00.000Z',
    author: 'UBND xã',
    summary: 'Thông tin họp dân',
    content: ['Nội dung thông báo'],
    tags: ['thông báo'],
    relatedLinks: ['Lịch tiếp dân'],
    mediaId: 'media-1',
    imageUrl: 'https://cdn/news.webp',
    imageAlt: 'Họp dân',
    isActive: true,
    updatedAt: '2026-07-16T00:00:00.000Z',
    updatedBy: null,
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter>
          <NewsPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchNews.mockResolvedValue({ data: [article()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('NewsPage', () => {
  it('renders articles sorted by publishedAt descending and applies filters', async () => {
    const newest = article({ id: 'new', title: 'Tin mới', publishedAt: '2026-07-01T08:00:00.000Z' });
    const oldest = article({ id: 'old', title: 'Tin cũ', publishedAt: '2026-01-01T08:00:00.000Z' });
    api.fetchNews.mockResolvedValue({ data: [oldest, newest], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();

    const newNode = await screen.findByText('Tin mới');
    const oldNode = screen.getByText('Tin cũ');
    expect(newNode.compareDocumentPosition(oldNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Tổng cộng 2 bài viết, bao gồm cả đang ẩn và lên lịch.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Du lịch'));
    await waitFor(() => expect(api.fetchNews).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Du lịch', page: 1 }), expect.anything()));

    await user.type(screen.getByPlaceholderText('Tìm theo tiêu đề'), 'họp dân{Enter}');
    await waitFor(() => expect(api.fetchNews).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'họp dân', page: 1 }), expect.anything()));
  });

  it('shows scheduled and hidden status badges', async () => {
    api.fetchNews.mockResolvedValue({
      data: [
        article({ id: 'future', title: 'Bài lên lịch', publishedAt: '2099-01-01T08:00:00.000Z' }),
        article({ id: 'hidden', title: 'Bài ẩn', isActive: false }),
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    renderPage();
    expect(await screen.findByText('Bài lên lịch')).toBeInTheDocument();
    expect(screen.getByText('Lên lịch')).toBeInTheDocument();
    expect(screen.getAllByText('Ẩn').some((node) => node.className.includes('ant-tag'))).toBe(true);
  });

  it('toggles visibility with version and refetches server state', async () => {
    const row = article();
    api.updateNewsStatus.mockResolvedValue({ ...row, isActive: false, version: 3 });
    renderPage();
    await screen.findByText(row.title);
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(api.updateNewsStatus).toHaveBeenCalledWith(row.id, false, row.version));
    await waitFor(() => expect(api.fetchNews).toHaveBeenCalledTimes(2));
  });

  it('deletes only once after modal confirmation', async () => {
    api.deleteNewsArticle.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('Thông báo họp dân');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.deleteNewsArticle).toHaveBeenCalledTimes(1));
  });

  it('locks write actions for read-only roles', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderPage();
    await screen.findByText('Thông báo họp dân');
    expect(screen.getByText('Bạn đang xem ở chế độ chỉ đọc')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Viết bài mới/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  });
});
