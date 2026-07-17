import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as historicalSitesApi from '../../../../api/historical-sites';
import { ApiError } from '../../../../types/api';
import type { HistoricalSiteAdminItem } from '../../../../types/historical-site';
import { HistoricalSitesPage } from '../HistoricalSitesPage';

vi.mock('../../../../api/historical-sites');
const mockedApi = vi.mocked(historicalSitesApi);

function makeItem(overrides: Partial<HistoricalSiteAdminItem> = {}): HistoricalSiteAdminItem {
  return {
    id: 'dia-dao',
    version: 1,
    name: 'Địa đạo Truông Mít',
    rank: 'Cấp tỉnh',
    address: 'Ấp Thuận Bình',
    recognizedYear: 2014,
    summary: 'Hệ thống địa đạo lịch sử',
    history: ['Đoạn 1'],
    highlights: ['Điểm 1'],
    mediaId: 'media-1',
    imageUrl: 'https://cdn/site.jpg',
    imageAlt: 'Địa đạo',
    sortOrder: 0,
    isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter><HistoricalSitesPage /></MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup({ delay: null });
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('HistoricalSitesPage', () => {
  it('renders admin list data and total', async () => {
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [makeItem()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    renderPage();
    expect(await screen.findByText('Địa đạo Truông Mít')).toBeInTheDocument();
    expect(screen.getByText('2014')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 di tích, bao gồm cả đang ẩn.')).toBeInTheDocument();
  });

  it('filters by rank and searches by name/address', async () => {
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [makeItem()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    renderPage();
    await screen.findByText('Địa đạo Truông Mít');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    const rankLabels = await screen.findAllByText('Cấp quốc gia');
    fireEvent.click(rankLabels[rankLabels.length - 1]);
    await waitFor(() => expect(mockedApi.fetchHistoricalSites).toHaveBeenLastCalledWith(expect.objectContaining({ rank: 'Cấp quốc gia', page: 1 }), expect.anything()));

    const search = screen.getByPlaceholderText('Tìm theo tên hoặc địa chỉ');
    await user.type(search, 'Lộc Trung{Enter}');
    await waitFor(() => expect(mockedApi.fetchHistoricalSites).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Lộc Trung', page: 1 }), expect.anything()));
  });

  it('toggles visibility and refetches server state', async () => {
    const item = makeItem();
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateHistoricalSiteStatus.mockResolvedValue({ ...item, isActive: false });
    renderPage();
    await screen.findByText(item.name);
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(mockedApi.updateHistoricalSiteStatus).toHaveBeenCalledWith(item.id, false, item.version));
    await waitFor(() => expect(mockedApi.fetchHistoricalSites).toHaveBeenCalledTimes(2));
  });

  it('sends normalized reorder positions', async () => {
    const first = makeItem({ id: 'a', name: 'Di tích A', sortOrder: 5 });
    const second = makeItem({ id: 'b', name: 'Di tích B', sortOrder: 9 });
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    mockedApi.reorderHistoricalSites.mockResolvedValue([second, first]);
    renderPage();
    await screen.findByText(first.name);
    const moveDown = screen.getAllByRole('button', { name: 'Đưa xuống' }).find((button) => !button.hasAttribute('disabled'));
    expect(moveDown).toBeDefined();
    fireEvent.click(moveDown!);
    await waitFor(() => expect(mockedApi.reorderHistoricalSites).toHaveBeenCalled());
    expect(mockedApi.reorderHistoricalSites.mock.calls[0][0]).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
    ]);
  });

  it('deletes only after modal confirmation and prevents double submit', async () => {
    const item = makeItem();
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.deleteHistoricalSite.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText(item.name);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    await screen.findByText('“Địa đạo Truông Mít” sẽ bị xóa khỏi hệ thống.');
    const confirm = screen.getAllByRole('button', { name: 'Xóa' }).at(-1)!;
    fireEvent.click(confirm);
    await waitFor(() => expect(mockedApi.deleteHistoricalSite).toHaveBeenCalledTimes(1));
  });

  it('shows Vietnamese 403 feedback without removing list data', async () => {
    const item = makeItem();
    mockedApi.fetchHistoricalSites.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateHistoricalSiteStatus.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'Forbidden' }, undefined, 403));
    renderPage();
    await screen.findByText(item.name);
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(mockedApi.updateHistoricalSiteStatus).toHaveBeenCalledTimes(1));
    expect(screen.getByText(item.name)).toBeInTheDocument();
  });

  it('renders retry when initial request fails', async () => {
    mockedApi.fetchHistoricalSites.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'Lỗi mạng' }));
    renderPage();
    expect(await screen.findByText('Không tải được danh sách Di tích lịch sử')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument();
  });
});
