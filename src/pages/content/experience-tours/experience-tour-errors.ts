import { ApiError } from '../../../types/api';

export function describeExperienceTourError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (error.status === 404) return 'Tour trải nghiệm không tồn tại hoặc đã bị xóa';
    if (error.status === 400 || error.status === 422) return error.message || 'Dữ liệu chưa hợp lệ';
    if (error.status === 409) return error.message || 'Dữ liệu đã được người khác cập nhật';
    if (error.status && error.status >= 500) return 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    return error.message || 'Thao tác thất bại';
  }
  return 'Không thể kết nối máy chủ';
}
