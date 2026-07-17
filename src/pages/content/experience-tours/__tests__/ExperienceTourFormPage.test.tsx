import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/experience-tours';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { ExperienceTourAdminItem } from '../../../../types/experience-tour';
import { ExperienceTourFormPage } from '../ExperienceTourFormPage';

vi.mock('../../../../api/experience-tours');
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

const item: ExperienceTourAdminItem = {
  id: 'tour-vuon',
  version: 3,
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
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/experience-tours/tour-vuon']}>
          <Routes>
            <Route path="/content/experience-tours/:id" element={<ExperienceTourFormPage />} />
            <Route path="/content/experience-tours" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchExperienceTour.mockResolvedValue(item);
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

describe('ExperienceTourFormPage', () => {
  it('updates with trimmed payload, current version, and uploaded media id', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateExperienceTour.mockResolvedValue({ ...item, name: 'Tour mới', mediaId: 'media-new', version: 4 });
    renderForm();

    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, '  Tour mới  ');
    await user.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateExperienceTour).toHaveBeenCalled());
    expect(api.updateExperienceTour.mock.calls[0][0]).toBe(item.id);
    expect(api.updateExperienceTour.mock.calls[0][1]).toEqual(expect.objectContaining({
      name: 'Tour mới',
      version: item.version,
      mediaId: 'media-new',
      itinerary: item.itinerary,
      contactPhone: item.contactPhone,
    }));
  });

  it('reorders itinerary steps and submits the visible order', async () => {
    api.updateExperienceTour.mockResolvedValue({ ...item, itinerary: ['Thăm vườn cây', 'Gặp hướng dẫn viên'], version: 4 });
    renderForm();
    await screen.findByDisplayValue(item.name);

    await userEvent.click(screen.getAllByRole('button', { name: 'Đưa bước lên' })[1]);
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateExperienceTour).toHaveBeenCalled());
    expect(api.updateExperienceTour.mock.calls[0][1]).toEqual(expect.objectContaining({
      itinerary: ['Thăm vườn cây', 'Gặp hướng dẫn viên'],
    }));
  });

  it('previews the current itinerary order without calling a public API', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    await screen.findByDisplayValue(item.name);
    await user.click(screen.getAllByRole('button', { name: 'Đưa bước lên' })[1]);
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('Bước 1:')).toBeInTheDocument();
    expect(within(drawer).getByText('Thăm vườn cây')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: item.contactPhone })).toHaveAttribute('href', 'tel:0900123456');
    expect(api.fetchExperienceTour).toHaveBeenCalledTimes(1);
    expect(api.updateExperienceTour).not.toHaveBeenCalled();
  });

  it('shows the required phone error and keeps a backend field error on the form', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const phone = await screen.findByDisplayValue(item.contactPhone);
    await user.clear(phone);
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    const phoneItem = phone.closest<HTMLElement>('.ant-form-item');
    if (!phoneItem) throw new Error('Không tìm thấy trường số điện thoại');
    expect(await within(phoneItem).findByText('Bắt buộc')).toBeInTheDocument();
    expect(api.updateExperienceTour).not.toHaveBeenCalled();

    await user.type(phone, '0909 111 222');
    api.updateExperienceTour.mockRejectedValue(new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu chưa hợp lệ',
      details: [{ path: ['contactPhone'], message: 'Số điện thoại liên hệ không hợp lệ' }],
    }, undefined, 400));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    expect(await within(phoneItem).findByText('Số điện thoại liên hệ không hợp lệ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0909 111 222')).toBeInTheDocument();
  });

  it('disables the contact phone in read-only mode', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderForm();
    expect(await screen.findByDisplayValue(item.contactPhone)).toBeDisabled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateExperienceTour.mockRejectedValue(new ApiError(
      { code: 'EXPERIENCE_TOUR_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' },
      undefined,
      409,
    ));
    renderForm();
    const phone = await screen.findByDisplayValue(item.contactPhone);
    await user.clear(phone);
    await user.type(phone, '0909 999 888');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0909 999 888')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
