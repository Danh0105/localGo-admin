import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/contacts';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { ContactAdminItem } from '../../../../types/contact';
import { ContactFormPage } from '../ContactFormPage';

vi.mock('../../../../api/contacts');
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

const item: ContactAdminItem = {
  id: 'ubnd',
  version: 3,
  name: 'UBND xã Lộc Trung',
  category: 'Hành chính',
  role: 'Tiếp nhận thủ tục hành chính',
  phone: '+84 123 456 789',
  email: 'contact@localgo.vn',
  address: 'Trung tâm xã',
  workingTime: '07:30 - 17:00',
  summary: 'Đầu mối hành chính',
  description: ['Đoạn cũ'],
  supportTopics: ['Nội dung cũ'],
  note: 'Gọi trong giờ làm việc',
  mediaId: 'media-1',
  imageUrl: 'https://cdn/contact.webp',
  imageAlt: 'Trụ sở',
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
        <MemoryRouter initialEntries={['/content/contacts/ubnd']}>
          <Routes>
            <Route path="/content/contacts/:id" element={<ContactFormPage />} />
            <Route path="/content/contacts" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchContact.mockResolvedValue(item);
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

describe('ContactFormPage', () => {
  it('updates with trimmed payload and omits empty optional email', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateContact.mockResolvedValue({ ...item, name: 'Liên hệ mới', email: null, mediaId: 'media-new', version: 4 });
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, '  Liên hệ mới  ');
    await user.clear(screen.getByDisplayValue(item.email!));
    await user.click(screen.getByRole('button', { name: 'Upload thành công' }));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(api.updateContact).toHaveBeenCalled());
    expect(api.updateContact.mock.calls[0][1]).toEqual(expect.objectContaining({
      name: 'Liên hệ mới',
      version: item.version,
      mediaId: 'media-new',
      phone: item.phone,
    }));
    expect(api.updateContact.mock.calls[0][1]).not.toHaveProperty('email');
  });

  it('adds and reorders descriptions and support topics', async () => {
    renderForm();
    const user = userEvent.setup({ delay: null });
    await screen.findByDisplayValue(item.name);
    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const description = screen.getByText('Đoạn 2').closest('.ant-form-item')?.querySelector('textarea');
    if (!description) throw new Error('Không tìm thấy textarea mô tả');
    fireEvent.change(description, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);

    await user.click(screen.getByRole('button', { name: /Thêm nội dung/ }));
    const topic = screen.getByText('Nội dung 2').closest('.ant-form-item')?.querySelector('input');
    if (!topic) throw new Error('Không tìm thấy input hỗ trợ');
    fireEvent.change(topic, { target: { value: 'Hỗ trợ mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa nội dung hỗ trợ lên' })[1]);

    expect(screen.getByDisplayValue('Đoạn mới')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hỗ trợ mới')).toBeInTheDocument();
  });

  it('blocks invalid phone and email without losing input', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, 'Tên vẫn còn');
    fireEvent.change(screen.getByDisplayValue(item.phone), { target: { value: 'abc-123' } });
    fireEvent.change(screen.getByDisplayValue(item.email!), { target: { value: 'email-sai' } });
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Số điện thoại chỉ gồm số, khoảng trắng và dấu + ở đầu')).toBeInTheDocument();
    expect(screen.getByText('Email chưa đúng định dạng')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tên vẫn còn')).toBeInTheDocument();
    expect(api.updateContact).not.toHaveBeenCalled();
  });

  it('previews current tel and mailto links without calling a public API', async () => {
    renderForm();
    await screen.findByDisplayValue(item.name);
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    const call = await screen.findByRole('link', { name: /Gọi ngay/ });
    const mail = screen.getByRole('link', { name: /Gửi email/ });
    expect(call).toHaveAttribute('href', `tel:${item.phone}`);
    expect(mail).toHaveAttribute('href', `mailto:${item.email}`);
    expect(api.fetchContact).toHaveBeenCalledTimes(1);
    expect(api.updateContact).not.toHaveBeenCalled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    const user = userEvent.setup({ delay: null });
    api.updateContact.mockRejectedValue(new ApiError({ code: 'CONTACT_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' }, undefined, 409));
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
