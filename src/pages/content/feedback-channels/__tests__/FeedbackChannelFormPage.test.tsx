import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/feedback-channels';
import { ApiError } from '../../../../types/api';
import type { FeedbackChannelAdminItem } from '../../../../types/feedback-channel';
import { FeedbackChannelFormPage } from '../FeedbackChannelFormPage';

vi.mock('../../../../api/feedback-channels');
vi.mock('../../about/ImageUploadField', () => ({
  ImageUploadField: ({ onUploaded, onRemove }: { onUploaded: (value: { mediaId: string; imageUrl: string }) => void; onRemove: () => void }) => (
    <div data-testid="image-upload">
      <button type="button" onClick={() => onUploaded({ mediaId: 'media-new', imageUrl: 'https://cdn/new.webp' })}>Upload thành công</button>
      <button type="button" onClick={onRemove}>Xóa ảnh</button>
    </div>
  ),
}));

const api = vi.mocked(apiModule);

const item: FeedbackChannelAdminItem = {
  id: 'channel-1',
  version: 3,
  title: 'Góp ý chung cho địa phương',
  category: 'Góp ý chung',
  responseTime: 'Tiếp nhận trong giờ hành chính',
  requiredInfo: ['Họ tên'],
  summary: 'Tóm tắt',
  description: ['Đoạn cũ'],
  examples: ['Ví dụ cũ'],
  note: 'Lưu ý cũ',
  mediaId: 'media-1',
  imageUrl: 'https://cdn/channel.webp',
  imageAlt: 'Góp ý chung',
  sortOrder: 0,
  isActive: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/feedback-channels/channel-1']}>
          <Routes>
            <Route path="/content/feedback-channels/:id" element={<FeedbackChannelFormPage />} />
            <Route path="/content/feedback-channels" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.fetchFeedbackChannel.mockResolvedValue(item);
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('FeedbackChannelFormPage', () => {
  it('updates with trimmed payload and uploaded media id', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateFeedbackChannel.mockResolvedValue({ ...item, title: 'Tiêu đề mới', mediaId: 'media-new', version: 4 });
    renderForm();

    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, '  Tiêu đề mới  ');
    await user.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateFeedbackChannel).toHaveBeenCalled());
    expect(api.updateFeedbackChannel.mock.calls[0][0]).toBe(item.id);
    expect(api.updateFeedbackChannel.mock.calls[0][1]).toEqual(
      expect.objectContaining({ title: 'Tiêu đề mới', version: item.version, mediaId: 'media-new' }),
    );
  });

  it('adds a new required-info item', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.title);

    await user.click(screen.getByRole('button', { name: /Thêm mục/ }));
    const input = screen.getByText('Mục 2').closest('.ant-form-item')?.querySelector('input');
    if (!input) throw new Error('Không tìm thấy input mục mới');
    fireEvent.change(input, { target: { value: 'Số điện thoại' } });

    expect(screen.getByDisplayValue('Số điện thoại')).toBeInTheDocument();
  });

  it('blocks save on required validation without losing typed data', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Bắt buộc')).toBeInTheDocument();
    expect(api.updateFeedbackChannel).not.toHaveBeenCalled();
  });

  it('previews current values without calling a public API', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, 'Kênh xem trước');
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    expect(await screen.findByRole('heading', { name: 'Kênh xem trước' })).toBeInTheDocument();
    expect(api.fetchFeedbackChannel).toHaveBeenCalledTimes(1);
    expect(api.updateFeedbackChannel).not.toHaveBeenCalled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateFeedbackChannel.mockRejectedValue(
      new ApiError({ code: 'FEEDBACK_CHANNEL_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' }, undefined, 409),
    );
    renderForm();
    const title = await screen.findByDisplayValue(item.title);
    await user.clear(title);
    await user.type(title, 'Tiêu đề chưa bị ghi đè');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tiêu đề chưa bị ghi đè')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
