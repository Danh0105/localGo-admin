import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/news';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { NewsAdminArticle } from '../../../../types/news';
import { NewsFormPage } from '../NewsFormPage';

vi.mock('../../../../api/news');
vi.mock('../../about/ImageUploadField', () => ({
  ImageUploadField: ({ onUploaded, onRemove }: { onUploaded: (value: { mediaId: string; imageUrl: string }) => void; onRemove: () => void }) => (
    <div data-testid="image-upload">
      <button type="button" onClick={() => onUploaded({ mediaId: 'media-new', imageUrl: 'https://cdn/new.webp' })}>Upload thành công</button>
      <button type="button" onClick={onRemove}>Xóa ảnh</button>
    </div>
  ),
}));

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

const item: NewsAdminArticle = {
  id: 'news-1',
  version: 3,
  title: 'Thông báo họp dân',
  category: 'Thông báo',
  publishedAt: '2026-01-01T08:00:00.000Z',
  author: 'UBND xã',
  summary: 'Thông tin họp dân',
  content: ['Đoạn cũ'],
  tags: ['thông báo'],
  relatedLinks: ['Lịch tiếp dân'],
  mediaId: 'media-1',
  imageUrl: 'https://cdn/news.webp',
  imageAlt: 'Họp dân',
  isActive: true,
  updatedAt: '2026-07-16T00:00:00.000Z',
  updatedBy: null,
};

function renderForm(initialEntry = '/content/news/news-1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/content/news/:id" element={<NewsFormPage />} />
            <Route path="/content/news" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchNewsArticle.mockResolvedValue(item);
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

describe('NewsFormPage', () => {
  it('updates with trimmed payload, ISO publishedAt, and uploaded media id', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateNewsArticle.mockResolvedValue({ ...item, title: 'Tin mới', mediaId: 'media-new', version: 4 });
    renderForm();

    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, '  Tin mới  ');
    await user.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateNewsArticle).toHaveBeenCalled());
    expect(api.updateNewsArticle.mock.calls[0][0]).toBe(item.id);
    expect(api.updateNewsArticle.mock.calls[0][1]).toEqual(expect.objectContaining({
      title: 'Tin mới',
      version: item.version,
      mediaId: 'media-new',
      publishedAt: '2026-01-01T08:00:00.000Z',
    }));
  });

  it('adds and reorders content, tags, and related labels', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.title);

    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const paragraph = screen.getByText('Đoạn 2').closest('.ant-form-item')?.querySelector('textarea');
    if (!paragraph) throw new Error('Không tìm thấy textarea nội dung');
    fireEvent.change(paragraph, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);

    await user.click(screen.getByRole('button', { name: /Thêm từ khóa/ }));
    const tag = screen.getByText('Tag 2').closest('.ant-form-item')?.querySelector('input');
    if (!tag) throw new Error('Không tìm thấy input tag');
    fireEvent.change(tag, { target: { value: 'tag mới' } });

    await user.click(screen.getByRole('button', { name: /Thêm mục liên quan/ }));
    const related = screen.getByText('Mục 2').closest('.ant-form-item')?.querySelector('input');
    if (!related) throw new Error('Không tìm thấy input liên quan');
    fireEvent.change(related, { target: { value: 'Nhãn mới' } });

    expect(screen.getByDisplayValue('Đoạn mới')).toBeInTheDocument();
    expect(screen.getByDisplayValue('tag mới')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nhãn mới')).toBeInTheDocument();
  });

  it('blocks save on required validation without losing typed data', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Bắt buộc')).toBeInTheDocument();
    expect(api.updateNewsArticle).not.toHaveBeenCalled();
  });

  it('previews current values without calling a public API', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, 'Tin xem trước');
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    expect(await screen.findByRole('heading', { name: 'Tin xem trước' })).toBeInTheDocument();
    expect(api.fetchNewsArticle).toHaveBeenCalledTimes(1);
    expect(api.updateNewsArticle).not.toHaveBeenCalled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateNewsArticle.mockRejectedValue(new ApiError(
      { code: 'NEWS_ARTICLE_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' },
      undefined,
      409,
    ));
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, 'Tiêu đề chưa bị ghi đè');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tiêu đề chưa bị ghi đè')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });

  it('shows a persistent, actionable update error without clearing the form', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateNewsArticle.mockRejectedValue(new ApiError(
      {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: [
          'title must be shorter than or equal to 200 characters',
          'publishedAt must be a valid ISO 8601 date string',
        ],
      },
      'req-news-123',
      422,
    ));
    renderForm();

    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, 'Tiêu đề admin đang nhập');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Không thể cập nhật bài viết')).toBeInTheDocument();
    expect(screen.getByText('Tiêu đề: tối đa 200 ký tự')).toBeInTheDocument();
    expect(screen.getByText('Ngày đăng: ngày giờ không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('req-news-123')).toBeInTheDocument();
    expect(screen.getByText(/Thông tin đang nhập vẫn được giữ nguyên/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tiêu đề admin đang nhập')).toBeInTheDocument();
  });

  it('clearly identifies a create error and tells the admin how to resolve a duplicate title', async () => {
    api.createNewsArticle.mockRejectedValue(new ApiError(
      { code: 'NEWS_ARTICLE_SLUG_EXISTS', message: 'Slug bài viết đã tồn tại' },
      'req-news-create-456',
      409,
    ));
    renderForm('/content/news/new');

    const title = screen.getByText('Tiêu đề').closest('.ant-form-item')?.querySelector('input');
    const author = screen.getByText('Tác giả / đơn vị đăng').closest('.ant-form-item')?.querySelector('input');
    const summary = screen.getByText('Mô tả ngắn').closest('.ant-form-item')?.querySelector('textarea');
    const content = screen.getByText('Đoạn 1').closest('.ant-form-item')?.querySelector('textarea');
    if (!title || !author || !summary || !content) throw new Error('Không tìm thấy trường bắt buộc');

    fireEvent.change(title, { target: { value: 'Tiêu đề bị trùng' } });
    fireEvent.change(author, { target: { value: 'UBND xã' } });
    fireEvent.change(summary, { target: { value: 'Mô tả bài viết' } });
    fireEvent.change(content, { target: { value: 'Nội dung bài viết' } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Không thể tạo bài viết')).toBeInTheDocument();
    expect(screen.getByText(/Vui lòng đổi tiêu đề rồi thử lại/)).toBeInTheDocument();
    expect(screen.getByText('req-news-create-456')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tiêu đề bị trùng')).toBeInTheDocument();
  });
});
