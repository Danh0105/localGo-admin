import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/map-places';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { MapPlaceAdminItem } from '../../../../types/map-place';
import { MapPlaceFormPage } from '../MapPlaceFormPage';

vi.mock('../../../../api/map-places');
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

const item: MapPlaceAdminItem = {
  id: 'ubnd',
  version: 3,
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
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/map-places/ubnd']}>
          <Routes>
            <Route path="/content/map-places/:id" element={<MapPlaceFormPage />} />
            <Route path="/content/map-places" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchMapPlace.mockResolvedValue(item);
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

describe('MapPlaceFormPage', () => {
  it('updates with trimmed payload, numeric coordinates, and uploaded media id', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateMapPlace.mockResolvedValue({ ...item, name: 'Điểm mới', mediaId: 'media-new', version: 4 });
    renderForm();

    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, '  Điểm mới  ');
    await user.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateMapPlace).toHaveBeenCalled());
    expect(api.updateMapPlace.mock.calls[0][0]).toBe(item.id);
    expect(api.updateMapPlace.mock.calls[0][1]).toEqual(expect.objectContaining({
      name: 'Điểm mới',
      version: item.version,
      mediaId: 'media-new',
      coordinates: { lat: 11.2418, lng: 106.2024 },
    }));
  });

  it('adds and reorders descriptions and highlights without losing values', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.name);

    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const description = screen.getByText('Đoạn 2').closest('.ant-form-item')?.querySelector('textarea');
    if (!description) throw new Error('Không tìm thấy textarea mô tả');
    fireEvent.change(description, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);

    await user.click(screen.getByRole('button', { name: /Thêm điểm nổi bật/ }));
    const highlight = screen.getByText('Điểm 2').closest('.ant-form-item')?.querySelector('input');
    if (!highlight) throw new Error('Không tìm thấy input điểm nổi bật');
    fireEvent.change(highlight, { target: { value: 'Điểm mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa điểm nổi bật lên' })[1]);

    expect(screen.getByDisplayValue('Đoạn mới')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Điểm mới')).toBeInTheDocument();
  });

  it('blocks invalid coordinates without losing typed data', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, 'Tên vẫn còn');
    const latInput = screen.getByDisplayValue('11.2418');
    fireEvent.change(latInput, { target: { value: '91' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Vĩ độ phải từ -90 đến 90')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tên vẫn còn')).toBeInTheDocument();
    expect(api.updateMapPlace).not.toHaveBeenCalled();
  });

  it('previews current values without calling a public API', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, 'Tên xem trước');
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    expect(await screen.findByRole('heading', { name: 'Tên xem trước' })).toBeInTheDocument();
    expect(api.fetchMapPlace).toHaveBeenCalledTimes(1);
    expect(api.updateMapPlace).not.toHaveBeenCalled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateMapPlace.mockRejectedValue(new ApiError(
      { code: 'MAP_PLACE_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' },
      undefined,
      409,
    ));
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, 'Tên chưa bị ghi đè');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tên chưa bị ghi đè')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
