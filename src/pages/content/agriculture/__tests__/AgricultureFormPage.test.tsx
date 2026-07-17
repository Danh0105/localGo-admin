import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as agricultureApi from '../../../../api/agriculture';
import type { AgricultureAdminItem } from '../../../../types/agriculture';
import { ApiError } from '../../../../types/api';
import { AgricultureFormPage } from '../AgricultureFormPage';

vi.mock('../../../../api/agriculture');
vi.mock('../../about/ImageUploadField', () => ({ ImageUploadField: () => <div data-testid="image-upload">Ảnh đã chọn</div> }));
const mockedApi = vi.mocked(agricultureApi);

const item: AgricultureAdminItem = {
  id: 'lua', version: 3, name: 'Lúa hữu cơ', category: 'Cây trồng chủ lực', location: 'Xã Lộc Trung',
  season: 'Đông Xuân', scale: '50 ha', summary: 'Vùng lúa hữu cơ', description: ['Đoạn cũ'],
  highlights: ['Điểm cũ'], support: 'Liên hệ hợp tác xã', mediaId: 'media-1',
  imageUrl: 'https://cdn/rice.jpg', imageAlt: 'Cánh đồng lúa', sortOrder: 0, isActive: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}><ConfigProvider locale={viVN}>
      <MemoryRouter initialEntries={['/content/agriculture/lua']}>
        <Routes>
          <Route path="/content/agriculture/:id" element={<AgricultureFormPage />} />
          <Route path="/content/agriculture" element={<div>Danh sách</div>} />
        </Routes>
      </MemoryRouter>
    </ConfigProvider></QueryClientProvider>,
  );
}

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup({ delay: null });
  mockedApi.fetchAgricultureItem.mockResolvedValue(item);
});
afterEach(() => {
  vi.clearAllMocks();
  act(() => { message.destroy(); Modal.destroyAll(); });
  document.body.innerHTML = '';
});

describe('AgricultureFormPage', () => {
  it('updates with a trimmed payload and current server version', async () => {
    mockedApi.updateAgricultureItem.mockResolvedValue({ ...item, name: 'Tên đã sửa', version: 4 });
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, '  Tên đã sửa  ');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    await waitFor(() => expect(mockedApi.updateAgricultureItem).toHaveBeenCalled());
    expect(mockedApi.updateAgricultureItem.mock.calls[0][0]).toBe(item.id);
    expect(mockedApi.updateAgricultureItem.mock.calls[0][1]).toEqual(expect.objectContaining({
      name: 'Tên đã sửa', version: item.version, mediaId: item.mediaId,
      description: item.description, highlights: item.highlights,
    }));
  });

  it('adds and reorders descriptions and highlights without losing values', async () => {
    renderForm();
    await screen.findByDisplayValue(item.name);
    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const description = screen.getByText('Đoạn 2').closest('.ant-form-item')?.querySelector('textarea');
    if (!description) throw new Error('Không tìm thấy textarea đoạn mô tả');
    fireEvent.change(description, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);
    await user.click(screen.getByRole('button', { name: /Thêm điểm nổi bật/ }));
    const highlight = screen.getByText('Điểm 2').closest('.ant-form-item')?.querySelector('input');
    if (!highlight) throw new Error('Không tìm thấy input điểm nổi bật');
    fireEvent.change(highlight, { target: { value: 'Điểm mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa điểm lên' })[1]);
    expect(Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea[name^="descriptionItems"]')).map((input) => input.value)).toEqual(['Đoạn mới', 'Đoạn cũ']);
    expect(Array.from(document.querySelectorAll<HTMLInputElement>('input[name^="highlightItems"]')).map((input) => input.value)).toEqual(['Điểm mới', 'Điểm cũ']);
  });

  it('previews current values without calling a public API', async () => {
    renderForm();
    const name = await screen.findByDisplayValue(item.name);
    await user.clear(name);
    await user.type(name, 'Tên xem trước');
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    expect(await screen.findByText('Tên xem trước')).toBeInTheDocument();
    expect(mockedApi.fetchAgricultureItem).toHaveBeenCalledTimes(1);
    expect(mockedApi.updateAgricultureItem).not.toHaveBeenCalled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    mockedApi.updateAgricultureItem.mockRejectedValue(new ApiError(
      { code: 'AGRICULTURE_ITEM_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' }, undefined, 409,
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
