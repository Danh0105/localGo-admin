import { ApiError } from '../../../types/api';

export interface CuisineSuggestedPlaceApiFieldError {
  index: number;
  field: 'id' | 'name' | 'address' | 'googleMapsUrl';
  message: string;
}

type ApiFieldDetail = {
  field?: unknown;
  path?: unknown;
  property?: unknown;
  message?: unknown;
};

function normalizePath(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.map(String).join('.');
  if (typeof value !== 'string') return undefined;
  return value.replace(/\[(\d+)]/g, '.$1');
}

export function getCuisineSuggestedPlaceApiFieldErrors(error: unknown): CuisineSuggestedPlaceApiFieldError[] {
  if (!(error instanceof ApiError) || (error.status !== 400 && error.status !== 422)) return [];
  const fieldErrors: CuisineSuggestedPlaceApiFieldError[] = [];

  for (const detail of error.details ?? []) {
    const objectDetail = detail && typeof detail === 'object' ? detail as ApiFieldDetail : undefined;
    const path = typeof detail === 'string'
      ? normalizePath(detail)
      : [objectDetail?.field, objectDetail?.path, objectDetail?.property]
          .map(normalizePath)
          .find((value) => value?.includes('suggestedPlaceDetails'));
    if (!path) continue;

    const match = path.match(/suggestedPlaceDetails\.(\d+)\.(id|name|address|googleMapsUrl)\b/);
    if (!match) continue;

    fieldErrors.push({
      index: Number(match[1]),
      field: match[2] as CuisineSuggestedPlaceApiFieldError['field'],
      message: typeof objectDetail?.message === 'string' && objectDetail.message.trim()
        ? objectDetail.message
        : 'Thông tin địa điểm chưa hợp lệ',
    });
  }

  return fieldErrors;
}

export function describeCuisineError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (error.status === 404) return 'Món ăn không tồn tại hoặc đã bị xóa';
    if (error.status === 400 || error.status === 422) return error.message || 'Dữ liệu chưa hợp lệ';
    if (error.status === 409) return error.message || 'Dữ liệu đã được người khác cập nhật';
    if (error.status && error.status >= 500) return 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    return error.message || 'Thao tác thất bại';
  }
  return 'Không thể kết nối máy chủ';
}
