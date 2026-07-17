import { apiClient, unwrap } from './client';
import type { MediaUploadResult } from '../types/media';

/**
 * Upload endpoint thực tế của LocalGo BE. Backend kiểm tra MIME thật và chuyển ảnh
 * sang WebP trước khi trả về `{ id, url }`.
 */
export function uploadMedia(file: File, onProgress?: (percent: number) => void): Promise<MediaUploadResult> {
  const formData = new FormData();
  formData.append('file', file);

  return unwrap(
    apiClient.post('/media/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    }),
  );
}
