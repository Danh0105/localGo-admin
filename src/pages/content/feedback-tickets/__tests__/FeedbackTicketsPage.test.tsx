import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as channelsApi from '../../../../api/feedback-channels';
import * as ticketsApi from '../../../../api/feedback-tickets';
import { ApiError } from '../../../../types/api';
import type { FeedbackTicketListItem } from '../../../../types/feedback-ticket';
import { FeedbackTicketsPage } from '../FeedbackTicketsPage';

vi.mock('../../../../api/feedback-channels');
vi.mock('../../../../api/feedback-tickets');

const channelsMock = vi.mocked(channelsApi);
const ticketsMock = vi.mocked(ticketsApi);

function ticket(overrides: Partial<FeedbackTicketListItem> = {}): FeedbackTicketListItem {
  return {
    id: 'ticket-1',
    ticketCode: 'PH-000001',
    fullName: 'Nguyễn Văn A',
    phoneMasked: '090***234',
    channelId: 'channel-1',
    channelTitle: 'Góp ý chung',
    contentSummary: 'Góp ý về đường xá',
    submittedAt: '2026-07-01T08:00:00.000Z',
    status: 'new',
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter>
          <FeedbackTicketsPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  channelsMock.fetchFeedbackChannels.mockResolvedValue({
    data: [],
    meta: { page: 1, limit: 100, total: 0, totalPages: 1 },
  });
  ticketsMock.fetchFeedbackTickets.mockResolvedValue({
    data: [ticket()],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('FeedbackTicketsPage', () => {
  it('renders tickets sorted by submission time descending and has no reorder controls', async () => {
    const older = ticket({ id: 'old', ticketCode: 'PH-000001', submittedAt: '2026-01-01T08:00:00.000Z' });
    const newer = ticket({ id: 'new', ticketCode: 'PH-000002', submittedAt: '2026-07-10T08:00:00.000Z' });
    ticketsMock.fetchFeedbackTickets.mockResolvedValue({ data: [older, newer], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    renderPage();

    const newNode = await screen.findByText('PH-000002');
    const oldNode = screen.getByText('PH-000001');
    expect(newNode.compareDocumentPosition(oldNode) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Đưa lên' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Đưa xuống' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Thêm mới/ })).not.toBeInTheDocument();
  });

  it('applies status filter and search', async () => {
    renderPage();
    await screen.findByText('PH-000001');
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });

    const [statusSelect] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(statusSelect);
    fireEvent.click(await screen.findByTitle('Đang xử lý'));
    await waitFor(() =>
      expect(ticketsMock.fetchFeedbackTickets).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'in_progress', page: 1 }), expect.anything()),
    );

    await user.type(screen.getByPlaceholderText('Tìm theo họ tên, SĐT hoặc mã ticket'), 'Nguyễn{Enter}');
    await waitFor(() =>
      expect(ticketsMock.fetchFeedbackTickets).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Nguyễn', page: 1 }), expect.anything()),
    );
  });

  it('shows the no-tickets-at-all empty state before any filter is applied', async () => {
    ticketsMock.fetchFeedbackTickets.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    renderPage();
    expect(await screen.findByText('Chưa có phản hồi nào')).toBeInTheDocument();
  });

  it('shows a distinct empty state once a filter is applied and matches nothing', async () => {
    ticketsMock.fetchFeedbackTickets.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });
    renderPage();
    await waitFor(() => expect(screen.getByText('Chưa có phản hồi nào')).toBeInTheDocument());

    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    await user.type(screen.getByPlaceholderText('Tìm theo họ tên, SĐT hoặc mã ticket'), 'không tồn tại{Enter}');
    expect(await screen.findByText('Không có phản hồi khớp bộ lọc')).toBeInTheDocument();
  });

  it('shows a retry-capable error message when the queue fails to load', async () => {
    ticketsMock.fetchFeedbackTickets.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'Không có quyền' }, undefined, 403));
    renderPage();
    expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument();
  });
});
