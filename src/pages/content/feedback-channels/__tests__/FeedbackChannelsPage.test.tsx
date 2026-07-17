import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/feedback-channels';
import type { FeedbackChannelAdminItem } from '../../../../types/feedback-channel';
import { FeedbackChannelsPage } from '../FeedbackChannelsPage';

vi.mock('../../../../api/feedback-channels');

const api = vi.mocked(apiModule);

function channel(overrides: Partial<FeedbackChannelAdminItem> = {}): FeedbackChannelAdminItem {
  return {
    id: 'channel-1',
    version: 2,
    title: 'Góp ý chung cho địa phương',
    category: 'Góp ý chung',
    responseTime: 'Tiếp nhận trong giờ hành chính',
    requiredInfo: ['Họ tên', 'Số điện thoại'],
    summary: 'Tóm tắt',
    description: ['Đoạn thứ nhất'],
    examples: ['Ví dụ 1'],
    note: 'Lưu ý',
    mediaId: 'media-1',
    imageUrl: 'https://cdn/channel.webp',
    imageAlt: 'Góp ý chung',
    sortOrder: 0,
    isActive: true,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-15T00:00:00.000Z',
    createdBy: null,
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
          <FeedbackChannelsPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.fetchFeedbackChannels.mockResolvedValue({ data: [channel()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('FeedbackChannelsPage', () => {
  it('renders channels and applies category filter and title search', async () => {
    renderPage();
    expect(await screen.findByText('Góp ý chung cho địa phương')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 kênh, bao gồm cả đang ẩn.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Du lịch'));
    await waitFor(() => expect(api.fetchFeedbackChannels).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Du lịch', page: 1 }), expect.anything()));

    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    await user.type(screen.getByPlaceholderText('Tìm theo tiêu đề'), 'góp ý{Enter}');
    await waitFor(() => expect(api.fetchFeedbackChannels).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'góp ý', page: 1 }), expect.anything()));
  });

  it('toggles visibility with version and refetches server state', async () => {
    const row = channel();
    api.updateFeedbackChannelStatus.mockResolvedValue({ ...row, isActive: false, version: 3 });
    renderPage();
    await screen.findByText(row.title);
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(api.updateFeedbackChannelStatus).toHaveBeenCalledWith(row.id, false, row.version));
    await waitFor(() => expect(api.fetchFeedbackChannels).toHaveBeenCalledTimes(2));
  });

  it('reorders using up/down controls and sends absolute sortOrder', async () => {
    const first = channel({ id: 'a', title: 'Kênh A', sortOrder: 0 });
    const second = channel({ id: 'b', title: 'Kênh B', sortOrder: 1 });
    api.fetchFeedbackChannels.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    api.reorderFeedbackChannels.mockResolvedValue([second, first]);
    renderPage();
    await screen.findByText('Kênh A');

    await userEvent.click(screen.getAllByRole('button', { name: 'Đưa xuống' })[0]);
    await waitFor(() =>
      expect(api.reorderFeedbackChannels).toHaveBeenCalledWith(
        [
          { id: 'b', sortOrder: 0 },
          { id: 'a', sortOrder: 1 },
        ],
        expect.anything(),
      ),
    );
  });

  it('deletes only once after modal confirmation', async () => {
    api.deleteFeedbackChannel.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('Góp ý chung cho địa phương');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.deleteFeedbackChannel).toHaveBeenCalledTimes(1));
  });
});
