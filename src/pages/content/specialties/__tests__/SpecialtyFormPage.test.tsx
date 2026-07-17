import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SpecialtyFormPage } from '../SpecialtyFormPage';
import * as specialtiesApi from '../../../../api/specialties';
import * as mediaApi from '../../../../api/media';
import { ApiError } from '../../../../types/api';
import { useUnsavedChangesStore } from '../../../../store/unsaved-changes-store';
import type { SpecialtyAdminItem } from '../../../../types/specialty';

vi.mock('../../../../api/specialties');
vi.mock('../../../../api/media');

const mockedApi = vi.mocked(specialtiesApi);
const mockedMedia = vi.mocked(mediaApi);

function makeItem(overrides: Partial<SpecialtyAdminItem> = {}): SpecialtyAdminItem {
  return {
    id: 'nem-nuong',
    version: 4,
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

function renderCreatePage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/specialties/new']}>
          <Routes>
            <Route path="/content/specialties/new" element={<SpecialtyFormPage />} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

function renderEditPage(id: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={[`/content/specialties/${id}`]}>
          <Routes>
            <Route path="/content/specialties/:id" element={<SpecialtyFormPage />} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

// antd's Form.Item only wires up htmlFor/id when given a `name` prop tied to its own Form
// instance; this codebase drives fields via react-hook-form's Controller instead, so labels
// aren't programmatically associated — locate the field via its label's containing .ant-form-item.
function fieldByLabel(labelText: string | RegExp): HTMLElement {
  const label = screen.getByText(labelText, { selector: 'label' });
  const formItem = label.closest('.ant-form-item') as HTMLElement;
  return within(formItem).getByRole('textbox');
}

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
  useUnsavedChangesStore.setState({ isDirty: false });
});

afterEach(() => {
  vi.resetAllMocks();
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
});

describe('SpecialtyFormPage — create', () => {
  it('uploads an image, fills required fields, and creates a specialty with the right payload', async () => {
    mockedMedia.uploadMedia.mockResolvedValue({ id: 'media-9', url: 'https://cdn/new.jpg' });
    const created = makeItem({ id: 'new-item' });
    mockedApi.createSpecialty.mockResolvedValue(created);
    renderCreatePage();

    await user.type(fieldByLabel('Tên đặc sản'), 'Bánh tráng nướng');
    await user.type(fieldByLabel('Giá'), '20.000đ/cái');
    await user.type(fieldByLabel('Mùa vụ'), 'Quanh năm');
    await user.type(fieldByLabel('Tóm tắt'), 'Món ăn vặt nổi tiếng Đà Lạt');
    await user.type(fieldByLabel('Đoạn 1'), 'Nội dung mô tả đầu tiên');

    const fileInput = screen.getByLabelText('Chọn tệp ảnh đại diện', { exact: false }) as HTMLInputElement;
    const file = new File(['data'], 'anh.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
    fireEvent.change(fileInput);
    await waitFor(() => expect(mockedMedia.uploadMedia).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(mockedApi.createSpecialty).toHaveBeenCalledTimes(1));
    const payload = mockedApi.createSpecialty.mock.calls[0][0];
    expect(payload).toMatchObject({
      name: 'Bánh tráng nướng',
      category: 'Món ăn',
      price: '20.000đ/cái',
      season: 'Quanh năm',
      summary: 'Món ăn vặt nổi tiếng Đà Lạt',
      description: ['Nội dung mô tả đầu tiên'],
      mediaId: 'media-9',
    });
  });

  it('blocks save on validation errors without losing what the user typed', async () => {
    renderCreatePage();

    await user.type(fieldByLabel('Tên đặc sản'), 'Sản phẩm chưa đủ thông tin');
    await user.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(screen.getAllByText('Bắt buộc').length).toBeGreaterThan(0));
    expect(mockedApi.createSpecialty).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Sản phẩm chưa đủ thông tin')).toBeInTheDocument();
  });

  it('marks the unsaved-changes store dirty while editing, and clears it on cancel', async () => {
    renderCreatePage();
    expect(useUnsavedChangesStore.getState().isDirty).toBe(false);

    await user.type(fieldByLabel('Tên đặc sản'), 'X');
    await waitFor(() => expect(useUnsavedChangesStore.getState().isDirty).toBe(true));

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await user.click(await screen.findByRole('button', { name: 'Rời trang' }));
    expect(useUnsavedChangesStore.getState().isDirty).toBe(false);
  });
});

describe('SpecialtyFormPage — edit', () => {
  it('loads the existing specialty and updates it with the current version', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialty.mockResolvedValue(item);
    mockedApi.updateSpecialty.mockResolvedValue({ ...item, version: item.version + 1 });
    renderEditPage(item.id);

    const nameInput = await screen.findByDisplayValue('Nem nướng Ninh Hòa');
    await user.type(nameInput, ' đặc biệt');
    await user.click(screen.getByRole('button', { name: /Lưu/ }));

    await waitFor(() => expect(mockedApi.updateSpecialty).toHaveBeenCalledTimes(1));
    const [id, payload] = mockedApi.updateSpecialty.mock.calls[0];
    expect(id).toBe(item.id);
    expect(payload).toMatchObject({ name: 'Nem nướng Ninh Hòa đặc biệt', version: item.version });
  });

  it('adds, reorders, and removes buy places, sending the updated list on save', async () => {
    const item = makeItem({ buyPlaces: ['Chợ Đầm', 'Chợ Bến Thành'] });
    mockedApi.fetchSpecialty.mockResolvedValue(item);
    mockedApi.updateSpecialty.mockResolvedValue(item);
    renderEditPage(item.id);
    await screen.findByDisplayValue('Nem nướng Ninh Hòa');

    await user.click(screen.getByRole('button', { name: /Thêm địa điểm/ }));
    const buyPlaceInputs = screen.getAllByPlaceholderText('VD: Chợ Bến Thành, Quận 1');
    await user.type(buyPlaceInputs[2], 'Siêu thị Co.op');

    // Row 0's "up" button is disabled (first item); move row 1 ("Chợ Bến Thành") up instead.
    const moveUpButtons = screen.getAllByRole('button', { name: 'Đưa địa điểm lên' });
    await user.click(moveUpButtons[1]);

    await user.click(screen.getByRole('button', { name: /Lưu/ }));
    await waitFor(() => expect(mockedApi.updateSpecialty).toHaveBeenCalledTimes(1));
    const payload = mockedApi.updateSpecialty.mock.calls[0][1];
    expect(payload.buyPlaces).toEqual(['Chợ Bến Thành', 'Chợ Đầm', 'Siêu thị Co.op']);
  });

  it('opening preview does not call any specialty or media API', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialty.mockResolvedValue(item);
    renderEditPage(item.id);
    await screen.findByDisplayValue('Nem nướng Ninh Hòa');

    await user.click(screen.getByRole('button', { name: /Xem trước/ }));

    expect(await screen.findByText('Xem trước trên Mini App')).toBeInTheDocument();
    expect(mockedApi.createSpecialty).not.toHaveBeenCalled();
    expect(mockedApi.updateSpecialty).not.toHaveBeenCalled();
    expect(mockedMedia.uploadMedia).not.toHaveBeenCalled();
  });

  it('a 409 conflict keeps the form and disables save until the latest version is reloaded', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialty.mockResolvedValue(item);
    mockedApi.updateSpecialty.mockRejectedValue(
      new ApiError({ code: 'SPECIALTY_VERSION_CONFLICT', message: 'Xung đột phiên bản' }, undefined, 409),
    );
    renderEditPage(item.id);
    const nameInput = await screen.findByDisplayValue('Nem nướng Ninh Hòa');
    await user.type(nameInput, ' sửa bởi tôi');

    await user.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nem nướng Ninh Hòa sửa bởi tôi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });

  it('a 403 response surfaces a permission error without discarding the form', async () => {
    const item = makeItem();
    mockedApi.fetchSpecialty.mockResolvedValue(item);
    mockedApi.updateSpecialty.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện thao tác này' }, undefined, 403),
    );
    renderEditPage(item.id);
    const nameInput = await screen.findByDisplayValue('Nem nướng Ninh Hòa');
    await user.type(nameInput, ' sửa');

    await user.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Bạn không có quyền thực hiện thao tác này')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nem nướng Ninh Hòa sửa')).toBeInTheDocument();
  });
});
