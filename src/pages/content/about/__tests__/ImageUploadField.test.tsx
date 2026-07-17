import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageUploadField } from '../ImageUploadField';
import { uploadMedia } from '../../../../api/media';

vi.mock('../../../../api/media');

const mockedUploadMedia = vi.mocked(uploadMedia);

function selectFile(input: HTMLElement, file: File): void {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ImageUploadField', () => {
  it('uploads a file and reports the result', async () => {
    mockedUploadMedia.mockResolvedValueOnce({ id: 'media-1', url: 'https://cdn/img.jpg' });
    const onUploaded = vi.fn();
    render(<ImageUploadField label="ảnh hero" alt="" onUploaded={onUploaded} onRemove={vi.fn()} />);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const input = screen.getByLabelText('Chọn tệp ảnh hero', { exact: false }) as HTMLInputElement;
    selectFile(input, file);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith({ mediaId: 'media-1', imageUrl: 'https://cdn/img.jpg' }));
  });

  it('shows an error and a retry action when upload fails, then succeeds on retry', async () => {
    mockedUploadMedia.mockRejectedValueOnce(new Error('network down'));
    mockedUploadMedia.mockResolvedValueOnce({ id: 'media-2', url: 'https://cdn/retry.jpg' });
    const onUploaded = vi.fn();
    render(<ImageUploadField label="ảnh hero" alt="" onUploaded={onUploaded} onRemove={vi.fn()} />);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const input = screen.getByLabelText('Chọn tệp ảnh hero', { exact: false }) as HTMLInputElement;
    selectFile(input, file);
    input.dispatchEvent(new Event('change', { bubbles: true }));

    await waitFor(() => expect(screen.getByText('Tải ảnh lên thất bại, vui lòng thử lại')).toBeInTheDocument());
    expect(onUploaded).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Thử lại/ }));

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith({ mediaId: 'media-2', imageUrl: 'https://cdn/retry.jpg' }));
    expect(mockedUploadMedia).toHaveBeenCalledTimes(2);
  });

  it('calls onRemove when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    render(
      <ImageUploadField label="ảnh hero" alt="alt text" imageUrl="https://cdn/existing.jpg" onUploaded={vi.fn()} onRemove={onRemove} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Xóa ảnh hero' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
