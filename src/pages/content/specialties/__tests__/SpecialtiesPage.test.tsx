import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpecialtiesPage } from '../SpecialtiesPage';
import * as specialtiesApi from '../../../../api/specialties';
import { ApiError } from '../../../../types/api';
import type { SpecialtyAdminItem } from '../../../../types/specialty';

vi.mock('../../../../api/specialties');

const mockedApi = vi.mocked(specialtiesApi);

function makeItem(overrides: Partial<SpecialtyAdminItem> = {}): SpecialtyAdminItem {
  return {
    id: 'nem-nuong',
    version: 1,
    name: 'Nem nướng Ninh Hòa',
    category: 'Món ăn',
    price: '80.000đ/phần',
    season: 'Quanh năm',
    summary: 'Món nem nướng đặc trưng',
    description: ['Đoạn 1'],
    buyPlaces: ['Chợ Đầm'],
    mediaId: 'media-1',
    imageUrl: 'https://cdn/nem.jpg',
    imageAlt: 'Nem nướng',
    sortOrder: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    createdBy: null,
    updatedBy: null,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter>
          <SpecialtiesPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  // pointerEventsCheck: 0 — antd's Select/Table/Modal can be mid rc-motion transition in
  // jsdom (no real transitionend fires), which briefly leaves pointer-events: none on
  // ancestors; that's a test-environment artifact, not a real interaction bug to catch here.
  user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
});

afterEach(() => {
  vi.resetAllMocks();
  // antd's static message/Modal APIs cache their own DOM container/root internally; destroying
  // them via their own API (not a raw innerHTML wipe) keeps that bookkeeping consistent so the
  // next test's message.error() still renders into a live, attached container.
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
});

describe('SpecialtiesPage', () => {
  it('renders the list from GET /admin/specialties', async () => {
    mockedApi.fetchSpecialties.mockResolvedValue({
      data: [makeItem()],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    renderPage();

    expect(await screen.findByText('Nem nướng Ninh Hòa')).toBeInTheDocument();
    expect(screen.getByText('80.000đ/phần')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 đặc sản, bao gồm cả đang ẩn.')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    mockedApi.fetchSpecialties.mockResolvedValue({
      data: [makeItem()],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    renderPage();
    await screen.findByText('Nem nướng Ninh Hòa');

    // rc-select opens on mousedown and selects options via its own mousedown handler —
    // userEvent's full pointer sequence doesn't reliably trigger it under jsdom, so use
    // fireEvent directly for this interaction (a common antd + RTL testing workaround).
    // rc-select renders a visually-hidden aria mirror list (role="option") alongside the real
    // clickable, virtualized list — target the real item (`.ant-select-item-option`) by title,
    // since that's what the mousedown handler that actually fires onChange is bound to.
    fireEvent.mouseDown(screen.getByText('Tất cả danh mục'));
    const option = await screen.findByTitle('Trái cây');
    fireEvent.click(option);

    await waitFor(() =>
      expect(mockedApi.fetchSpecialties).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'Trái cây', page: 1 }),
        expect.anything(),
      ),
    );
  });

  it('searches by name', async () => {
    mockedApi.fetchSpecialties.mockResolvedValue({
      data: [makeItem()],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    renderPage();
    await screen.findByText('Nem nướng Ninh Hòa');

    const searchInput = screen.getByPlaceholderText('Tìm theo tên');
    await user.type(searchInput, 'Nem{Enter}');

    await waitFor(() =>
      expect(mockedApi.fetchSpecialties).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'Nem', page: 1 }),
        expect.anything(),
      ),
    );
  });

  it('toggling the visibility switch reflects the new state immediately', async () => {
    const item = makeItem({ isActive: true });
    mockedApi.fetchSpecialties.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateSpecialtyStatus.mockResolvedValue({ ...item, isActive: false });
    renderPage();
    await screen.findByText('Nem nướng Ninh Hòa');

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeChecked();
    await user.click(toggle);

    await waitFor(() => expect(mockedApi.updateSpecialtyStatus).toHaveBeenCalledWith(item.id, false, item.version));
    await waitFor(() => expect(mockedApi.fetchSpecialties).toHaveBeenCalledTimes(2));
  });

  it('moving a row down sends a normalized reorder payload', async () => {
    const itemA = makeItem({ id: 'a', name: 'Đặc sản A', sortOrder: 0 });
    const itemB = makeItem({ id: 'b', name: 'Đặc sản B', sortOrder: 1 });
    mockedApi.fetchSpecialties.mockResolvedValue({ data: [itemA, itemB], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    mockedApi.reorderSpecialties.mockResolvedValue([itemB, itemA]);
    renderPage();
    await screen.findByText('Đặc sản A');

    const [moveDown] = screen.getAllByRole('button', { name: 'Đưa xuống' });
    await user.click(moveDown);

    await waitFor(() => expect(mockedApi.reorderSpecialties).toHaveBeenCalledTimes(1));
    // react-query's mutation executor calls mutationFn with internal extra args when it's passed
    // by reference (not wrapped) — assert only the payload we actually control, the first arg.
    expect(mockedApi.reorderSpecialties.mock.calls[0][0]).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
    ]);
  });

  it('deletes a specialty after confirmation and guards against double click', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialties.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.deleteSpecialty.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('Nem nướng Ninh Hòa');

    await user.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() => expect(mockedApi.deleteSpecialty).toHaveBeenCalledTimes(1));
    expect(mockedApi.deleteSpecialty.mock.calls[0][0]).toBe(item.id);
  });

  it('surfaces a 403 error without corrupting the list', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialties.mockResolvedValue({ data: [item], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedApi.updateSpecialtyStatus.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' }, undefined, 403),
    );
    renderPage();
    await screen.findByText('Nem nướng Ninh Hòa');

    fireEvent.click(screen.getByRole('switch'));

    expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này')).toBeInTheDocument();
    expect(screen.getByText('Nem nướng Ninh Hòa')).toBeInTheDocument();
  });

  it('shows a retry action when the list fails to load', async () => {
    mockedApi.fetchSpecialties.mockRejectedValue(new ApiError({ code: 'NETWORK_ERROR', message: 'Lỗi kết nối mạng' }, undefined, undefined));
    renderPage();

    expect(await screen.findByText('Không tải được danh sách Đặc sản')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thử lại/ })).toBeInTheDocument();
  });
});
