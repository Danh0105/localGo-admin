import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Modal, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ocopApi from '../../../../api/ocop';
import { useAuthStore } from '../../../../store/auth-store';
import { ApiError } from '../../../../types/api';
import type { OcopAdminProduct } from '../../../../types/ocop';
import { OcopFormPage } from '../OcopFormPage';

vi.mock('../../../../api/ocop');
vi.mock('../../about/ImageUploadField', () => ({ ImageUploadField: () => <div data-testid="image-upload">Ảnh đã chọn</div> }));
const api = vi.mocked(ocopApi);
const admin = { id:'admin', zaloId:null, phone:null, email:null, displayName:'Admin', avatarUrl:null, role:'ADMIN' as const, status:'ACTIVE' as const, lastLoginAt:null, createdAt:'', updatedAt:'' };
const ocopItem: OcopAdminProduct = { id:'coffee', version:2, name:'Cà phê OCOP', category:'Đồ uống', rating:4, producer:'Hợp tác xã LocalGo', address:'Lâm Đồng', priceRange:'100.000đ - 200.000đ', contactPhone:'0900 123 456', summary:'Cà phê rang xay', description:['Đoạn giới thiệu'], highlights:['Canh tác bền vững'], contactNote:'Liên hệ hợp tác xã', mediaId:'media-1', imageUrl:'https://cdn/coffee.webp', imageAlt:'Hạt cà phê', sortOrder:0, isActive:true, updatedAt:'2026-07-15T00:00:00.000Z', updatedBy:null };

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><ConfigProvider locale={viVN}><MemoryRouter initialEntries={['/content/ocop/coffee']}><Routes><Route path="/content/ocop/:id" element={<OcopFormPage />} /><Route path="/content/ocop" element={<div>Danh sách</div>} /></Routes></MemoryRouter></ConfigProvider></QueryClientProvider>);
}

beforeEach(() => { useAuthStore.setState({ user: admin }); api.fetchOcopProduct.mockResolvedValue(ocopItem); });
afterEach(() => { vi.clearAllMocks(); useAuthStore.setState({ user: null }); act(() => { message.destroy(); Modal.destroyAll(); }); });

describe('OcopFormPage', () => {
  it('updates with trimmed data and the current version', async () => {
    api.updateOcopProduct.mockResolvedValue({ ...ocopItem, name: 'Tên mới', version: 3 });
    renderForm(); const user = userEvent.setup({ delay: null });
    const name = await screen.findByDisplayValue(ocopItem.name); await user.clear(name); await user.type(name, '  Tên mới  ');
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    await waitFor(() => expect(api.updateOcopProduct).toHaveBeenCalled());
    expect(api.updateOcopProduct.mock.calls[0][1]).toEqual(expect.objectContaining({ name: 'Tên mới', rating: 4, contactPhone: ocopItem.contactPhone, version: 2, mediaId: 'media-1' }));
  });

  it('adds and reorders descriptions and highlights', async () => {
    renderForm(); const user = userEvent.setup({ delay: null }); await screen.findByDisplayValue(ocopItem.name);
    await user.click(screen.getByRole('button', { name: /Thêm đoạn/ }));
    const paragraph = screen.getByText('Đoạn 2').closest('.ant-form-item')?.querySelector('textarea');
    if (!paragraph) throw new Error('Không tìm thấy đoạn mới'); fireEvent.change(paragraph, { target: { value: 'Đoạn mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa đoạn lên' })[1]);
    await user.click(screen.getByRole('button', { name: /Thêm điểm nổi bật/ }));
    const highlight = screen.getByText('Điểm 2').closest('.ant-form-item')?.querySelector('input');
    if (!highlight) throw new Error('Không tìm thấy điểm mới'); fireEvent.change(highlight, { target: { value: 'Điểm mới' } });
    await user.click(screen.getAllByRole('button', { name: 'Đưa điểm nổi bật lên' })[1]);
    expect(screen.getAllByDisplayValue('Đoạn mới')).toHaveLength(1); expect(screen.getAllByDisplayValue('Điểm mới')).toHaveLength(1);
  });

  it('previews current form values without calling a public API', async () => {
    renderForm(); const user = userEvent.setup({ delay: null }); const name = await screen.findByDisplayValue(ocopItem.name);
    await user.clear(name); await user.type(name, 'Tên xem trước'); fireEvent.click(screen.getByRole('button', { name: /Xem trước/ }));
    expect(await screen.findByRole('heading', { name: 'Tên xem trước' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ocopItem.contactPhone })).toHaveAttribute('href', 'tel:0900123456');
    expect(api.fetchOcopProduct).toHaveBeenCalledTimes(1); expect(api.updateOcopProduct).not.toHaveBeenCalled();
  });

  it('shows the required phone error and keeps a backend field error on the form', async () => {
    const user = userEvent.setup({ delay: null });
    renderForm();
    const phone = await screen.findByDisplayValue(ocopItem.contactPhone);
    await user.clear(phone);
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    const phoneItem = phone.closest<HTMLElement>('.ant-form-item');
    if (!phoneItem) throw new Error('Không tìm thấy trường số điện thoại');
    expect(await within(phoneItem).findByText('Bắt buộc')).toBeInTheDocument();
    expect(api.updateOcopProduct).not.toHaveBeenCalled();

    await user.type(phone, '0909 111 222');
    api.updateOcopProduct.mockRejectedValue(new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu chưa hợp lệ',
      details: [{ field: 'contactPhone', message: 'Số điện thoại liên hệ không hợp lệ' }],
    }, undefined, 422));
    fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    expect(await within(phoneItem).findByText('Số điện thoại liên hệ không hợp lệ')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0909 111 222')).toBeInTheDocument();
  });

  it('disables the contact phone in read-only mode', async () => {
    useAuthStore.setState({ user: { ...admin, role: 'MODERATOR' } });
    renderForm();
    expect(await screen.findByDisplayValue(ocopItem.contactPhone)).toBeDisabled();
  });

  it('keeps input and locks save after a version conflict', async () => {
    api.updateOcopProduct.mockRejectedValue(new ApiError({ code:'OCOP_PRODUCT_VERSION_CONFLICT', message:'Dữ liệu đã thay đổi' }, undefined, 409));
    renderForm(); const user = userEvent.setup({ delay: null }); const phone = await screen.findByDisplayValue(ocopItem.contactPhone);
    await user.clear(phone); await user.type(phone, '0909 999 888'); fireEvent.click(screen.getByRole('button', { name: /Lưu/ }));
    expect(await screen.findByText('Dữ liệu đã được người khác cập nhật')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0909 999 888')).toBeInTheDocument(); expect(screen.getByRole('button', { name: /Lưu/ })).toBeDisabled();
  });
});
