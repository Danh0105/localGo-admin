import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/map-places';
import { useAuthStore } from '../../../../store/auth-store';
import type { MapPlaceAdminItem } from '../../../../types/map-place';
import { MapPlacesPage } from '../MapPlacesPage';

vi.mock('../../../../api/map-places');

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

function place(overrides: Partial<MapPlaceAdminItem> = {}): MapPlaceAdminItem {
  return {
    id: 'ubnd',
    version: 2,
    name: 'UBND xã Lộc Trung',
    category: 'Hành chính',
    address: 'Trung tâm xã Lộc Trung',
    coordinates: { lat: 11.2418, lng: 106.2024 },
    openTime: '07:30 - 17:00',
    distanceFromCenter: '0 km',
    summary: 'Điểm hành chính trung tâm',
    description: ['Nơi tiếp nhận thủ tục'],
    highlights: ['Bãi đỗ xe rộng'],
    directionNote: 'Đi theo trục đường chính',
    mediaId: 'media-1',
    imageUrl: 'https://cdn/place.webp',
    imageAlt: 'Trụ sở UBND',
    sortOrder: 0,
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
          <MapPlacesPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchMapPlaces.mockResolvedValue({ data: [place()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
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

describe('MapPlacesPage', () => {
  it('renders list data and applies category/search filters', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();
    expect(await screen.findByText('UBND xã Lộc Trung')).toBeInTheDocument();
    expect(screen.getByText('11.2418, 106.2024')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 điểm, bao gồm cả đang ẩn.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Du lịch'));
    await waitFor(() => expect(api.fetchMapPlaces).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Du lịch', page: 1 }), expect.anything()));

    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc địa chỉ'), 'Lộc Trung{Enter}');
    await waitFor(() => expect(api.fetchMapPlaces).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Lộc Trung', page: 1 }), expect.anything()));
  });

  it('toggles visibility with version and refetches server state', async () => {
    const row = place();
    api.updateMapPlaceStatus.mockResolvedValue({ ...row, isActive: false, version: 3 });
    renderPage();
    await screen.findByText(row.name);
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(api.updateMapPlaceStatus).toHaveBeenCalledWith(row.id, false, row.version));
    await waitFor(() => expect(api.fetchMapPlaces).toHaveBeenCalledTimes(2));
  });

  it('normalizes display reorder positions to a zero-based sequence', async () => {
    const first = place({ id: 'a', name: 'Điểm A', sortOrder: 8 });
    const second = place({ id: 'b', name: 'Điểm B', sortOrder: 12 });
    api.fetchMapPlaces.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    api.reorderMapPlaces.mockResolvedValue([second, first]);
    renderPage();
    await screen.findByText(first.name);
    await userEvent.click(screen.getAllByRole('button', { name: 'Đưa xuống' })[0]);
    await waitFor(() => expect(api.reorderMapPlaces).toHaveBeenCalled());
    expect(api.reorderMapPlaces.mock.calls[0][0]).toEqual([{ id: 'b', sortOrder: 0 }, { id: 'a', sortOrder: 1 }]);
  });

  it('deletes only once after modal confirmation', async () => {
    api.deleteMapPlace.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('UBND xã Lộc Trung');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.deleteMapPlace).toHaveBeenCalledTimes(1));
  });

  it('locks write actions for read-only roles', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderPage();
    await screen.findByText('UBND xã Lộc Trung');
    expect(screen.getByText('Bạn đang xem ở chế độ chỉ đọc')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Thêm điểm mới/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  });
});
