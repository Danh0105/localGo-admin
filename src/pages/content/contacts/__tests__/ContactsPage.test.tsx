import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../../api/contacts';
import { useAuthStore } from '../../../../store/auth-store';
import type { ContactAdminItem } from '../../../../types/contact';
import { ContactsPage } from '../ContactsPage';

vi.mock('../../../../api/contacts');

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

function contact(overrides: Partial<ContactAdminItem> = {}): ContactAdminItem {
  return {
    id: 'ubnd',
    version: 2,
    name: 'UBND xã Lộc Trung',
    category: 'Hành chính',
    role: 'Tiếp nhận thủ tục hành chính',
    phone: '+84 123 456 789',
    email: 'contact@localgo.vn',
    address: 'Trung tâm xã',
    workingTime: '07:30 - 17:00',
    summary: 'Đầu mối hành chính',
    description: ['Hỗ trợ người dân'],
    supportTopics: ['Thủ tục hành chính'],
    note: 'Gọi trong giờ làm việc',
    mediaId: 'media-1',
    imageUrl: 'https://cdn/contact.webp',
    imageAlt: 'Trụ sở',
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
          <ContactsPage />
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: admin });
  api.fetchContacts.mockResolvedValue({ data: [contact()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
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

describe('ContactsPage', () => {
  it('renders list data and applies category/search filters', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderPage();
    expect(await screen.findByText('UBND xã Lộc Trung')).toBeInTheDocument();
    expect(screen.getByText('+84 123 456 789')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 liên hệ, bao gồm cả đang ẩn.')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Khẩn cấp'));
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Khẩn cấp', page: 1 }), expect.anything()));

    await user.type(screen.getByPlaceholderText('Tìm theo tên hoặc số điện thoại'), '123{Enter}');
    await waitFor(() => expect(api.fetchContacts).toHaveBeenLastCalledWith(expect.objectContaining({ search: '123', page: 1 }), expect.anything()));
  });

  it('toggles status and normalizes reorder positions', async () => {
    const first = contact({ id: 'a', name: 'Liên hệ A', sortOrder: 8 });
    const second = contact({ id: 'b', name: 'Liên hệ B', sortOrder: 12 });
    api.fetchContacts.mockResolvedValue({ data: [first, second], meta: { page: 1, limit: 20, total: 2, totalPages: 1 } });
    api.updateContactStatus.mockResolvedValue({ ...first, isActive: false, version: 3 });
    api.reorderContacts.mockResolvedValue([second, first]);
    renderPage();

    await screen.findByText(first.name);
    await userEvent.click(screen.getAllByRole('switch')[0]);
    await waitFor(() => expect(api.updateContactStatus).toHaveBeenCalledWith(first.id, false, first.version));
    await userEvent.click(screen.getAllByRole('button', { name: 'Đưa xuống' })[0]);
    await waitFor(() => expect(api.reorderContacts).toHaveBeenCalled());
    expect(api.reorderContacts.mock.calls[0][0]).toEqual([{ id: 'b', sortOrder: 0 }, { id: 'a', sortOrder: 1 }]);
  });

  it('deletes only once after modal confirmation', async () => {
    api.deleteContact.mockResolvedValue(undefined);
    renderPage();
    await screen.findByText('UBND xã Lộc Trung');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Xóa' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(api.deleteContact).toHaveBeenCalledTimes(1));
  });

  it('locks write actions for read-only roles', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderPage();
    await screen.findByText('UBND xã Lộc Trung');
    expect(screen.getByText('Bạn đang xem ở chế độ chỉ đọc')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Thêm liên hệ mới/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument();
  });
});
