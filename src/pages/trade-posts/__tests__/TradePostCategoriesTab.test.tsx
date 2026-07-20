import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../../api/trade-post-categories';
import { ApiError } from '../../../types/api';
import type { TradePostCategoryAdminItem } from '../../../types/trade-post-category';
import { TradePostCategoriesTab } from '../TradePostCategoriesTab';

vi.mock('../../../api/trade-post-categories');

const api = vi.mocked(apiModule);

function category(overrides: Partial<TradePostCategoryAdminItem> = {}): TradePostCategoryAdminItem {
  return {
    id: 'category-1',
    code: 'PRODUCT',
    name: 'Sản phẩm',
    description: 'Đặc sản và sản phẩm địa phương',
    sortOrder: 0,
    requiresPromotionDetails: false,
    isActive: true,
    version: 1,
    postCount: 12,
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ConfigProvider locale={viVN}>
        <TradePostCategoriesTab />
      </ConfigProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.fetchAdminTradePostCategories.mockResolvedValue({
    data: [category()],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  act(() => message.destroy());
  Modal.destroyAll();
  document.body.innerHTML = '';
});

describe('TradePostCategoriesTab', () => {
  it('renders category fields returned by the dedicated admin endpoint', async () => {
    renderTab();

    expect(await screen.findByText('Sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('PRODUCT')).toBeInTheDocument();
    expect(screen.getByText('Đặc sản và sản phẩm địa phương')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Không yêu cầu')).toBeInTheDocument();
    expect(screen.getByText('Tổng cộng 1 danh mục, bao gồm cả đang ngừng hoạt động.')).toBeInTheDocument();
    expect(api.fetchAdminTradePostCategories).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      expect.anything(),
    );
  });

  it('maps the status filter to a boolean and searches by code or name', async () => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderTab();
    await screen.findByText('Sản phẩm');

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByTitle('Ngừng hoạt động'));
    await waitFor(() => expect(api.fetchAdminTradePostCategories).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, isActive: false }),
      expect.anything(),
    ));

    await user.type(screen.getByPlaceholderText('Tìm theo mã hoặc tên danh mục'), 'product{Enter}');
    await waitFor(() => expect(api.fetchAdminTradePostCategories).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, isActive: false, search: 'product' }),
      expect.anything(),
    ));
  });

  it('shows a retry action when loading fails', async () => {
    api.fetchAdminTradePostCategories.mockRejectedValueOnce(new Error('network'));
    renderTab();

    expect(await screen.findByText('Không tải được danh mục tin giao thương')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Thử lại/ }));
    expect(await screen.findByText('Sản phẩm')).toBeInTheDocument();
    expect(api.fetchAdminTradePostCategories).toHaveBeenCalledTimes(2);
  });

  it('creates a category with the dedicated backend payload', async () => {
    api.createTradePostCategory.mockResolvedValue(category({
      id: 'category-2',
      code: 'cay-an-trai',
      name: 'Cây ăn trái',
      description: 'Tin mua bán cây ăn trái',
      requiresPromotionDetails: true,
    }));
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderTab();
    await screen.findByText('Sản phẩm');

    await user.click(screen.getByRole('button', { name: /Tạo danh mục/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText('cay-an-trai'), 'CAY_AN_TRAI');
    expect(within(dialog).getByPlaceholderText('cay-an-trai')).toHaveValue('cay-an-trai');
    await user.type(within(dialog).getByPlaceholderText('Cây ăn trái'), 'Cây ăn trái');
    await user.type(
      within(dialog).getByPlaceholderText('Mô tả ngắn về loại tin thuộc danh mục'),
      'Tin mua bán cây ăn trái',
    );
    await user.click(within(dialog).getAllByRole('switch')[0]);
    await user.click(within(dialog).getByRole('button', { name: 'Tạo danh mục' }));

    await waitFor(() => expect(api.createTradePostCategory).toHaveBeenCalledWith(
      {
        code: 'cay-an-trai',
        name: 'Cây ăn trái',
        description: 'Tin mua bán cây ăn trái',
        sortOrder: 0,
        requiresPromotionDetails: true,
        isActive: true,
      },
      expect.anything(),
    ));
    await waitFor(() => expect(api.fetchAdminTradePostCategories).toHaveBeenCalledTimes(2));
  });

  it('shows backend validation details without closing the form', async () => {
    api.createTradePostCategory.mockRejectedValue(new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      details: [{ field: 'code', message: 'Mã danh mục đã tồn tại' }],
    }, undefined, 400));
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 });
    renderTab();
    await screen.findByText('Sản phẩm');

    await user.click(screen.getByRole('button', { name: /Tạo danh mục/ }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByPlaceholderText('cay-an-trai'), 'product');
    await user.type(within(dialog).getByPlaceholderText('Cây ăn trái'), 'Sản phẩm mới');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo danh mục' }));

    expect(await within(dialog).findAllByText('Mã danh mục đã tồn tại')).toHaveLength(2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
