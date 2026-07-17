import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/experience-tours';
import { useAuthStore } from '../../../../store/auth-store';
import type { ExperienceTourAdminItem } from '../../../../types/experience-tour';
import { ExperienceToursPage } from '../ExperienceToursPage';

vi.mock('../../../../api/experience-tours');

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

function tour(overrides: Partial<ExperienceTourAdminItem> = {}): ExperienceTourAdminItem {
  return {
    id: 'tour-vuon',
    version: 2,
    name: 'Tour vườn cây Lộc Trung',
    category: 'Nửa ngày',
    duration: '4 giờ',
    startTime: '08:00 hoặc 14:00',
    priceRange: '150.000đ - 250.000đ',
    meetingPoint: 'Nhà văn hóa xã Lộc Trung',
    contactPhone: '0900 123 456',
    summary: 'Khám phá vườn cây địa phương',
    description: ['Dạo vườn cùng nông dân'],
    itinerary: ['Gặp hướng dẫn viên', 'Thăm vườn cây'],
    included: ['Nước uống'],
    note: 'Mang giày thoải mái',
    mediaId: 'media-1',
    imageUrl: 'https://cdn/tour.webp',
    imageAlt: 'Vườn cây',
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
          <ExperienceToursPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchExperienceTours.mockResolvedValue({ data: [tour()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
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

describe('ExperienceToursPage', () => {
  it('renders list data and applies category/search filters', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();
    expect(await screen.findByText('Tour vườn cây Lộc Trung')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 tour, bao gồm cả đang ẩn.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Gia đình'));
    await waitFor(() => expect(api.fetchExperienceTours).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Gia đình', page: 1 }), expect.anything()));

    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc điểm hẹn'), 'Lộc Trung{Enter}');
    await waitFor(() => expect(api.fetchExperienceTours).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Lộc Trung', page: 1 }), expect.anything()));
  });

  it('toggles visibility with version and refetches server state', async () => {
    const row = tour();
    api.updateExperienceTourStatus.mockResolvedValue({ ...row, isActive: false, version: 3 });
    renderPage();
    await screen.findByText(row.name);
    await userEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(api.updateExperienceTourStatus).toHaveBeenCalledWith(row.id, false, row.version));
    await waitFor(() => expect(api.fetchExperienceTours).toHaveBeenCalledTimes(2));
  });

  it('normalizes display reorder positions to a zero-based sequence', async () => {
    const first = tour({ id: 'a', name: 'Tour A', sortOrder: 8 });
    const second = tour({ id: 'b', name: 'Tour B', sortOrder: 12 });
    api.fetchExperienceTours.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    api.reorderExperienceTours.mockResolvedValue([second, first]);
    renderPage();
    await screen.findByText(first.name);
    await userEvent.click(screen.getAllByRole('button', { name: 'Đưa xuống' })[0]);
    await waitFor(() => expect(api.reorderExperienceTours).toHaveBeenCalled());
    expect(api.reorderExperienceTours.mock.calls[0][0]).toEqual([{ id: 'b', sortOrder: 0 }, { id: 'a', sortOrder: 1 }]);
  });

  it('deletes only once after modal confirmation', async () => {
    api.deleteExperienceTour.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('Tour vườn cây Lộc Trung');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.deleteExperienceTour).toHaveBeenCalledTimes(1));
  });

  it('locks write actions for read-only roles', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderPage();
    await screen.findByText('Tour vườn cây Lộc Trung');
    expect(screen.getByText('Bạn đang xem ở chế độ chỉ đọc')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Thêm tour mới/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  });
});
