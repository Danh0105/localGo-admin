import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/cuisine';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { CuisineAdminItem } from '../../../../types/cuisine';
import { CuisineFormPage } from '../CuisineFormPage';

vi.mock('../../../../api/cuisine');
vi.mock('../../about/ImageUploadField', () => ({
  ImageUploadField: () => <div data-testid="image-upload">Ảnh đã chọn</div>,
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

const item: CuisineAdminItem = {
  id: 'pho',
  version: 2,
  name: 'Phở LocalGo',
  category: 'Món nước',
  priceRange: '40.000đ - 70.000đ',
  bestTime: 'Buổi sáng',
  suggestedPlaceDetails: [{
    id: 'place-center',
    name: 'Quán trung tâm',
    address: '12 Đường LocalGo',
    googleMapsUrl: 'https://maps.app.goo.gl/Center123',
  }],
  summary: 'Món nước truyền thống',
  description: ['Nước dùng thanh'],
  highlights: ['Nấu từ xương'],
  tip: 'Dùng khi nóng',
  mediaId: 'media-1',
  imageUrl: 'https://cdn/pho.webp',
  imageAlt: 'Tô phở',
  sortOrder: 0,
  isActive: true,
  updatedAt: '2026-07-15T00:00:00.000Z',
  updatedBy: null,
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/cuisine/pho']}>
          <Routes>
            <Route path="/content/cuisine/:id" element={<CuisineFormPage />} />
            <Route path="/content/cuisine" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchCuisineItem.mockResolvedValue(item);
});

afterEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null });
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
});

describe('CuisineFormPage', () => {
  it('updates with the new trimmed place contract and current version', async () => {
    api.updateCuisineItem.mockResolvedValue({ ...item, name: 'Tên mới', version: 3 });
    renderForm();
    const user = userEvent.setup({ delay: null });
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, '  Tên mới  ');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateCuisineItem).toHaveBeenCalled());
    expect(api.updateCuisineItem.mock.calls[0][1]).toEqual(expect.objectContaining({
      name: 'Tên mới',
      version: 2,
      mediaId: 'media-1',
      suggestedPlaceDetails: [{
        id: 'place-center',
        name: 'Quán trung tâm',
        address: '12 Đường LocalGo',
        googleMapsUrl: 'https://maps.app.goo.gl/Center123',
      }],
    }));
    expect(api.updateCuisineItem.mock.calls[0][1]).not.toHaveProperty('suggestedPlaces');
  });

  it('adds, reorders and removes places without losing another row data', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.name);
    await user.click(screen.getByRole('button', { name: /Thêm địa điểm/ }));

    const names = screen.getAllByLabelText('Tên địa điểm');
    const addresses = screen.getAllByLabelText('Địa chỉ');
    const mapsUrls = screen.getAllByLabelText('Link Google Maps');
    await user.type(names[1], 'Quán mới');
    await user.type(addresses[1], '34 Đường Mới');
    await user.type(mapsUrls[1], 'https://www.google.com/maps/place/Quan+Moi');

    await user.click(screen.getAllByRole('button', { name: 'Đưa địa điểm lên' })[1]);
    expect(screen.getAllByLabelText('Tên địa điểm')[0]).toHaveValue('Quán mới');
    expect(screen.getAllByLabelText('Địa chỉ')[0]).toHaveValue('34 Đường Mới');
    expect(screen.getAllByLabelText('Link Google Maps')[0]).toHaveValue('https://www.google.com/maps/place/Quan+Moi');

    await user.click(screen.getAllByRole('button', { name: 'Xóa địa điểm' })[1]);
    expect(screen.getByLabelText('Tên địa điểm')).toHaveValue('Quán mới');
    expect(screen.getByLabelText('Địa chỉ')).toHaveValue('34 Đường Mới');
    expect(screen.getByLabelText('Link Google Maps')).toHaveValue('https://www.google.com/maps/place/Quan+Moi');
  });

  it('uses the exact pasted Google Maps link and disables it when invalid', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.name);

    const mapsLink = screen.getByRole('link', { name: /Mở thử trên Google Maps/ });
    expect(mapsLink).toHaveAttribute('href', 'https://maps.app.goo.gl/Center123');
    expect(mapsLink).toHaveAttribute('target', '_blank');
    expect(mapsLink).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(screen.getByRole('button', { name: /Thêm địa điểm/ }));
    expect(screen.getAllByRole('button', { name: /Mở thử trên Google Maps/ })[0]).toBeDisabled();
    expect(screen.getByText('Một số địa điểm chưa có đủ địa chỉ hoặc link Google Maps hợp lệ')).toBeInTheDocument();
    expect(screen.queryByLabelText('Vĩ độ (lat)')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Kinh độ (lng)')).not.toBeInTheDocument();
  });

  it('rejects a fake Google Maps domain without changing the pasted value', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    const mapsUrl = await screen.findByLabelText('Link Google Maps');
    await user.clear(mapsUrl);
    await user.type(mapsUrl, 'https://google.com.evil.example/maps/place/Fake');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Link phải là URL HTTPS hợp lệ của Google Maps')).toBeInTheDocument();
    expect(screen.getByLabelText('Link Google Maps')).toHaveValue('https://google.com.evil.example/maps/place/Fake');
    expect(screen.getByRole('button', { name: /Mở thử trên Google Maps/ })).toBeDisabled();
    expect(api.updateCuisineItem).not.toHaveBeenCalled();
  });

  it('previews place address and directions without calling a public API', async () => {
    renderForm();
    await screen.findByDisplayValue(item.name);
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toHaveTextContent('Quán trung tâm');
    expect(drawer).toHaveTextContent('12 Đường LocalGo');
    const previewLink = screen.getByRole('link', { name: /Chỉ đường bằng Google Maps/ });
    expect(previewLink).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/Center123',
    );
    expect(previewLink).toHaveAttribute('target', '_blank');
    expect(previewLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(api.fetchCuisineItem).toHaveBeenCalledTimes(1);
    expect(api.updateCuisineItem).not.toHaveBeenCalled();
  });

  it('maps a nested backend validation error to the correct coordinate field', async () => {
    api.updateCuisineItem.mockRejectedValue(new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu chưa hợp lệ',
      details: [{
        path: 'suggestedPlaceDetails.0.googleMapsUrl',
        message: 'Link Google Maps từ backend không hợp lệ',
      }],
    }, undefined, 422));
    renderForm();
    const user = userEvent.setup({ delay: null });
    const summary = await screen.findByDisplayValue(item.summary);
    await user.type(summary, ' cập nhật');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Link Google Maps từ backend không hợp lệ')).toBeInTheDocument();
    expect(screen.getByLabelText('Link Google Maps')).toHaveValue('https://maps.app.goo.gl/Center123');
  });

  it('does not allow an incomplete hidden legacy record to be activated', async () => {
    api.fetchCuisineItem.mockResolvedValue({
      ...item,
      suggestedPlaceDetails: undefined,
      suggestedPlaces: ['Quán legacy'],
      isActive: false,
    });
    renderForm();
    await screen.findByDisplayValue(item.name);
    const visibility = screen.getByRole('switch');
    expect(visibility).not.toBeChecked();
    await userEvent.click(visibility);

    expect(visibility).not.toBeChecked();
    expect(await screen.findByText('Hãy hoàn tất tên, địa chỉ và link Google Maps của mọi địa điểm trước khi bật hiển thị')).toBeInTheDocument();
  });

  it('keeps all place input and locks save after conflict', async () => {
    api.updateCuisineItem.mockRejectedValue(new ApiError({
      code: 'CUISINE_ITEM_VERSION_CONFLICT',
      message: 'Dữ liệu đã thay đổi',
    }, undefined, 409));
    renderForm();
    const user = userEvent.setup({ delay: null });
    const address = await screen.findByLabelText('Địa chỉ');
    const mapsUrl = screen.getByLabelText('Link Google Maps');
    await user.clear(address);
    await user.type(address, 'Địa chỉ chưa bị ghi đè');
    await user.clear(mapsUrl);
    await user.type(mapsUrl, 'https://www.google.com/maps/place/Chua+Luu');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByLabelText('Địa chỉ')).toHaveValue('Địa chỉ chưa bị ghi đè');
    expect(screen.getByLabelText('Link Google Maps')).toHaveValue('https://www.google.com/maps/place/Chua+Luu');
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
