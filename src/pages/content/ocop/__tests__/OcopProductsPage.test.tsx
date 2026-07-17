import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ocopApi from '../../../../api/ocop';
import { useAuthStore } from '../../../../store/auth-store';
import type { OcopAdminProduct } from '../../../../types/ocop';
import { OcopProductsPage } from '../OcopProductsPage';

vi.mock('../../../../api/ocop');
const api = vi.mocked(ocopApi);
const admin = { id:'admin', zaloId:null, phone:null, email:null, displayName:'Admin', avatarUrl:null, role:'ADMIN' as const, status:'ACTIVE' as const, lastLoginAt:null, createdAt:'', updatedAt:'' };
function item(overrides: Partial<OcopAdminProduct> = {}): OcopAdminProduct { return { id:'coffee', version:2, name:'Cà phê OCOP', category:'Đồ uống', rating:4, producer:'Hợp tác xã LocalGo', address:'Lâm Đồng', priceRange:'100.000đ', contactPhone:'0900 123 456', summary:'Cà phê rang xay', description:['Giới thiệu'], highlights:[], contactNote:'', mediaId:'media-1', imageUrl:'https://cdn/coffee.webp', imageAlt:'Hạt cà phê', sortOrder:0, isActive:true, updatedAt:'2026-07-15T00:00:00.000Z', updatedBy:null, ...overrides }; }
function renderPage() { const client = new QueryClient({ defaultOptions:{ queries:{ retry:false }, mutations:{ retry:false } } }); return render(<QueryClientProvider client={client}><ConfigProvider locale={viVN}><MemoryRouter><OcopProductsPage /></MemoryRouter></ConfigProvider></QueryClientProvider>); }

beforeEach(() => { useAuthStore.setState({ user: admin }); api.fetchOcopProducts.mockResolvedValue({ data:[item()], meta:{ page:1, limit:20, total:1, totalPages:1 } }); });
afterEach(() => { vi.clearAllMocks(); useAuthStore.setState({ user:null }); act(() => { message.destroy(); Modal.destroyAll(); }); });

describe('OcopProductsPage', () => {
  it('renders products and sends category, rating and search filters', async () => {
    renderPage(); const user = userEvent.setup({ delay:null, pointerEventsCheck:0 });
    expect(await screen.findByText('Cà phê OCOP')).toBeInTheDocument(); expect(screen.getByText('Tổng cộng 1 sản phẩm, bao gồm cả đang ẩn.')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Tất cả danh mục')); fireEvent.click(await screen.findByTitle('Thực phẩm'));
    await waitFor(() => expect(api.fetchOcopProducts).toHaveBeenLastCalledWith(expect.objectContaining({ category:'Thực phẩm' }), expect.anything()));
    fireEvent.mouseDown(screen.getByText('Tất cả hạng sao')); fireEvent.click(await screen.findByTitle('5 sao'));
    await waitFor(() => expect(api.fetchOcopProducts).toHaveBeenLastCalledWith(expect.objectContaining({ category:'Thực phẩm', rating:5 }), expect.anything()));
    await user.type(screen.getByPlaceholderText('Tìm tên hoặc nhà sản xuất'), 'LocalGo{Enter}');
    await waitFor(() => expect(api.fetchOcopProducts).toHaveBeenLastCalledWith(expect.objectContaining({ search:'LocalGo', page:1 }), expect.anything()));
  });

  it('toggles visibility using the current version and refreshes from server', async () => {
    const row = item(); api.updateOcopStatus.mockResolvedValue({ ...row, isActive:false, version:3 }); renderPage(); const user = userEvent.setup({ delay:null });
    await screen.findByText(row.name); await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(api.updateOcopStatus).toHaveBeenCalledWith(row.id, false, row.version));
    await waitFor(() => expect(api.fetchOcopProducts).toHaveBeenCalledTimes(2));
  });

  it('normalizes reorder positions before sending', async () => {
    const first=item({ id:'a', name:'Sản phẩm A', sortOrder:8 }); const second=item({ id:'b', name:'Sản phẩm B', sortOrder:10 });
    api.fetchOcopProducts.mockResolvedValue({ data:[first,second], meta:{ page:1, limit:20, total:2, totalPages:1 } }); api.reorderOcopProducts.mockResolvedValue([second,first]);
    renderPage(); const user=userEvent.setup({ delay:null }); await screen.findByText(first.name); await user.click(screen.getAllByRole('button',{ name:'Đưa xuống' })[0]);
    await waitFor(() => expect(api.reorderOcopProducts).toHaveBeenCalled()); expect(api.reorderOcopProducts.mock.calls[0][0]).toEqual([{ id:'b', sortOrder:0 },{ id:'a', sortOrder:1 }]);
  });

  it('deletes once after modal confirmation', async () => {
    api.deleteOcopProduct.mockResolvedValue(undefined); renderPage(); const user=userEvent.setup({ delay:null, pointerEventsCheck:0 }); await screen.findByText('Cà phê OCOP');
    await user.click(screen.getByRole('button',{ name:'Xóa' })); const dialog=await screen.findByRole('dialog'); const confirm=within(dialog).getByRole('button',{ name:'Xóa' });
    fireEvent.click(confirm); fireEvent.click(confirm); await waitFor(() => expect(api.deleteOcopProduct).toHaveBeenCalledTimes(1));
  });

  it('makes all write actions unavailable for a moderator', async () => {
    useAuthStore.setState({ user:{ ...admin, role:'MODERATOR' } }); renderPage(); await screen.findByText('Cà phê OCOP');
    expect(screen.getByText('Bạn đang xem ở chế độ chỉ đọc')).toBeInTheDocument(); expect(screen.queryByRole('button',{ name:/Thêm sản phẩm mới/ })).not.toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeDisabled(); expect(within(screen.getByRole('table')).queryByRole('button',{ name:'Xóa' })).not.toBeInTheDocument();
  });
});
