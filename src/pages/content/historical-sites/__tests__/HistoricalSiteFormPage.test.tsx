import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as historicalSitesApi from '../../../../api/historical-sites';
import { ApiError } from '../../../../types/api';
import type { HistoricalSiteAdminItem } from '../../../../types/historical-site';
import { HistoricalSiteFormPage } from '../HistoricalSiteFormPage';

vi.mock('../../../../api/historical-sites');
vi.mock('../../about/ImageUploadField', () => ({
  ImageUploadField: () => <div data-testid="image-upload">Ảnh đã chọn</div>,
}));

const mockedApi = vi.mocked(historicalSitesApi);
const item: HistoricalSiteAdminItem = {
  id: 'dia-dao',
  version: 3,
  name: 'Địa đạo Truông Mít',
  rank: 'Cấp tỉnh',
  address: 'Ấp Thuận Bình',
  recognizedYear: 2014,
  summary: 'Tóm tắt di tích',
  history: ['Đoạn cũ'],
  highlights: ['Điểm cũ'],
  mediaId: 'media-1',
  imageUrl: 'https://cdn/site.jpg',
  imageAlt: 'Địa đạo',
  sortOrder: 0,
  isActive: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <MemoryRouter initialEntries={['/content/historical-sites/dia-dao']}>
          <Routes>
            <Route path="/content/historical-sites/:id" element={<HistoricalSiteFormPage />} />
            <Route path="/content/historical-sites" element={<div>Danh sách</div>} />
          </Routes>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

let user: ReturnType<typeof userEvent.setup>;
beforeEach(() => {
  user = userEvent.setup({ delay: null });
  mockedApi.fetchHistoricalSite.mockResolvedValue(item);
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => {
    message.destroy();
    Modal.destroyAll();
  });
  document.body.innerHTML = '';
});

describe('HistoricalSiteFormPage', () => {
  it('adds and reorders history/highlights without losing entered values', async () => {
    renderForm();
    await screen.findByDisplayValue(item.name);

    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const secondHistoryLabel = screen.getByText('Đoạn 2');
    const secondHistory = secondHistoryLabel.closest('.ant-form-item')?.querySelector('textarea');
    expect(secondHistory).not.toBeNull();
    fireEvent.change(secondHistory!, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);

    await user.click(screen.getByRole('button', { name: /Thêm điểm nổi bật/ }));
    const secondHighlightLabel = screen.getByText('Điểm 2');
    const secondHighlight = secondHighlightLabel.closest('.ant-form-item')?.querySelector('input');
    expect(secondHighlight).not.toBeNull();
    fireEvent.change(secondHighlight!, { target: { value: 'Điểm mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa điểm lên' })[1]);

    const historyInputs = document.querySelectorAll<HTMLTextAreaElement>('textarea[name^="historyItems"]');
    const highlightInputs = document.querySelectorAll<HTMLInputElement>('input[name^="highlightItems"]');
    expect(Array.from(historyInputs).map((input) => input.value)).toEqual(['Đoạn mới', 'Đoạn cũ']);
    expect(Array.from(highlightInputs).map((input) => input.value)).toEqual(['Điểm mới', 'Điểm cũ']);
    expect(mockedApi.updateHistoricalSite).not.toHaveBeenCalled();
  });

  it('preview uses current form data without calling another API', async () => {
    renderForm();
    const nameInput = await screen.findByDisplayValue(item.name);
    await user.clear(nameInput);
    await user.type(nameInput, 'Tên xem trước');
    fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));

    expect(await screen.findByText('Tên xem trước')).toBeInTheDocument();
    expect(mockedApi.fetchHistoricalSite).toHaveBeenCalledTimes(1);
    expect(mockedApi.updateHistoricalSite).not.toHaveBeenCalled();
  });

  it('keeps user input and locks save after a 409 conflict', async () => {
    mockedApi.updateHistoricalSite.mockRejectedValue(
      new ApiError(
        { code: 'HISTORICAL_SITE_VERSION_CONFLICT', message: 'Dữ liệu đã thay đổi' },
        undefined,
        409,
      ),
    );
    renderForm();
    const nameInput = await screen.findByDisplayValue(item.name);
    await user.clear(nameInput);
    await user.type(nameInput, 'Tên chưa được ghi đè');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));

    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tên chưa được ghi đè')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
