import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ticketsApi from '../../../../api/feedback-tickets';
import type { FeedbackTicketDetail } from '../../../../types/feedback-ticket';
import { FeedbackTicketDetailPage } from '../FeedbackTicketDetailPage';

vi.mock('../../../../api/feedback-tickets');

const api = vi.mocked(ticketsApi);

function detail(overrides: Partial<FeedbackTicketDetail> = {}): FeedbackTicketDetail {
  return {
    id: 'ticket-1',
    ticketCode: 'PH-000001',
    fullName: 'Nguyễn Văn A',
    phone: '0901234567',
    channelId: 'channel-1',
    channelTitle: 'Góp ý chung',
    content: 'Nội dung phản hồi đầy đủ',
    submittedAt: '2026-07-01T08:00:00.000Z',
    status: 'new',
    adminNote: null,
    lastHandledBy: null,
    lastHandledAt: null,
    ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/feedback-tickets/ticket-1']}>
          <Routes>
            <Route path="/content/feedback-tickets/:id" element={<FeedbackTicketDetailPage />} />
            <Route path="/content/feedback-tickets" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.fetchFeedbackTicket.mockResolvedValue(detail());
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => {
    message.destroy();
  });
  document.body.innerHTML = '';
});

describe('FeedbackTicketDetailPage', () => {
  it('renders full ticket details from the API', async () => {
    renderPage();
    expect(await screen.findByText('Phản hồi PH-000001')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Nội dung phản hồi đầy đủ')).toBeInTheDocument();
    const callLink = screen.getByRole('link', { name: 'Gọi cho Nguyễn Văn A' });
    expect(callLink).toHaveAttribute('href', 'tel:0901234567');
  });

  it('disables status options that are not a valid transition from "new"', async () => {
    renderPage();
    await screen.findByText('Phản hồi PH-000001');
    fireEvent.mouseDown(screen.getByRole('combobox'));

    const resolvedOption = await screen.findByTitle('Đã xử lý');
    const closedOption = screen.getByTitle('Đã đóng');
    expect(resolvedOption).toHaveAttribute('aria-disabled', 'true');
    expect(closedOption).toHaveAttribute('aria-disabled', 'true');

    const inProgressOption = screen.getByTitle('Đang xử lý');
    expect(inProgressOption).toHaveAttribute('aria-disabled', 'false');
  });

  it('submits a valid status change with admin note and reflects it immediately', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    api.updateFeedbackTicketStatus.mockResolvedValue(detail({ status: 'in_progress', adminNote: 'Đang liên hệ người dân' }));
    renderPage();
    await screen.findByText('Phản hồi PH-000001');

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByTitle('Đang xử lý'));
    await user.type(screen.getByPlaceholderText(/Ghi chú cho cán bộ xử lý/), 'Đang liên hệ người dân');

    const submit = screen.getByRole('button', { name: /Cập nhật/ });
    await user.click(submit);
    await user.click(submit);

    await waitFor(() =>
      expect(api.updateFeedbackTicketStatus).toHaveBeenCalledWith('ticket-1', {
        status: 'in_progress',
        adminNote: 'Đang liên hệ người dân',
      }),
    );
    expect(api.updateFeedbackTicketStatus).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getAllByText('Đang xử lý').length).toBeGreaterThan(0));
  });
});
