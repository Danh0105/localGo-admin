import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as agricultureApi from '../../../../api/agriculture';
import { ApiError } from '../../../../types/api';
import type { AgricultureAdminItem } from '../../../../types/agriculture';
import { AgriculturePage } from '../AgriculturePage';

vi.mock('../../../../api/agriculture');
const mockedApi = vi.mocked(agricultureApi);

function makeItem(overrides: Partial<AgricultureAdminItem> = {}): AgricultureAdminItem {
  return {
    id: 'lua', version: 1, name: 'Lúa hữu cơ', category: 'Cây trồng chủ lực', location: 'Xã Lộc Trung',
    season: 'Đông Xuân', scale: '50 ha', summary: 'Vùng lúa hữu cơ', description: ['Đoạn 1'],
    highlights: ['Điểm 1'], support: 'Liên hệ hợp tác xã', mediaId: 'media-1',
    imageUrl: 'https://cdn/rice.jpg', imageAlt: 'Cánh đồng lúa', sortOrder: 0, isActive: true,
    updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><ConfigProvider locale={viVN}><MemoryRouter><AgriculturePage /></MemoryRouter></ConfigProvider></QueryClientProvider>);
}

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => { user = userEvent.setup({ delay: null }); });
afterEach(() => {
  vi.clearAllMocks();
  act(() => { message.destroy(); Modal.destroyAll(); });
  document.body.innerHTML = '';
});

describe('AgriculturePage', () => {
  it('renders list data and total', async () => {
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [makeItem()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    renderPage();
    expect(await screen.findByText('Lúa hữu cơ')).toBeInTheDocument();
    expect(screen.getByText('50 ha')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 mục, bao gồm cả đang ẩn.')).toBeInTheDocument();
  });

  it('filters by category and searches by name/location', async () => {
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [makeItem()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    renderPage();
    await screen.findByText('Lúa hữu cơ');
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    const labels = await screen.findAllByText('Chăn nuôi');
    fireEvent.click(labels[labels.length - 1]);
    await waitFor(() => expect(mockedApi.fetchAgricultureItems).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Chăn nuôi', page: 1 }), expect.anything()));
    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc khu vực'), 'Lộc Trung{Enter}');
    await waitFor(() => expect(mockedApi.fetchAgricultureItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Lộc Trung', page: 1 }), expect.anything()));
  });

  it('toggles visibility and refetches server state', async () => {
    const item = makeItem();
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateAgricultureStatus.mockResolvedValue({ ...item, isActive: false });
    renderPage();
    await screen.findByText(item.name);
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(mockedApi.updateAgricultureStatus).toHaveBeenCalledWith(item.id, false, item.version));
    await waitFor(() => expect(mockedApi.fetchAgricultureItems).toHaveBeenCalledTimes(2));
  });

  it('normalizes reorder positions to a zero-based sequence', async () => {
    const first = makeItem({ id: 'a', name: 'Mục A', sortOrder: 5 });
    const second = makeItem({ id: 'b', name: 'Mục B', sortOrder: 9 });
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    mockedApi.reorderAgricultureItems.mockResolvedValue([second, first]);
    renderPage();
    await screen.findByText(first.name);
    const moveDown = screen.getAllByRole('button', { name: 'Đưa xuống' }).find((button) => !button.hasAttribute('disabled'))!;
    fireEvent.click(moveDown);
    await waitFor(() => expect(mockedApi.reorderAgricultureItems).toHaveBeenCalled());
    expect(mockedApi.reorderAgricultureItems.mock.calls[0][0]).toEqual([{ id: 'b', sortOrder: 0 }, { id: 'a', sortOrder: 1 }]);
  });

  it('deletes only after modal confirmation', async () => {
    const item = makeItem();
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.deleteAgricultureItem.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText(item.name);
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    await screen.findByText('“Lúa hữu cơ” sẽ bị xóa khỏi hệ thống.');
    fireEvent.click(screen.getAllByRole('button', { name: 'Xóa' }).at(-1)!);
    await waitFor(() => expect(mockedApi.deleteAgricultureItem).toHaveBeenCalledTimes(1));
  });

  it('keeps list data when a mutation is forbidden', async () => {
    const item = makeItem();
    mockedApi.fetchAgricultureItems.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateAgricultureStatus.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'Forbidden' }, undefined, 403));
    renderPage();
    await screen.findByText(item.name);
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(mockedApi.updateAgricultureStatus).toHaveBeenCalledTimes(1));
    expect(screen.getByText(item.name)).toBeInTheDocument();
  });
});
