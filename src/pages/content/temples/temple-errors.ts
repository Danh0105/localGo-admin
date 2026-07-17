import { ApiError } from '../../../types/api';

const TEMPLE_FIELD_LABELS: Record<string, string> = {
  name: 'Tên địa điểm',
  type: 'Loại địa điểm',
  address: 'Địa chỉ',
  openHours: 'Giờ mở cửa',
  summary: 'Mô tả ngắn',
  description: 'Mô tả chi tiết',
  events: 'Lễ hội - Sự kiện',
  mediaId: 'Ảnh đại diện',
  imageAlt: 'Mô tả ảnh',
  sortOrder: 'Thứ tự',
  isActive: 'Trạng thái hiển thị',
  version: 'Phiên bản dữ liệu',
};

function fieldLabel(path: string): string {
  const eventMatch = /^events\.(\d+)\.(id|time|name)$/.exec(path);
  if (eventMatch) {
    const field = eventMatch[2] === 'time'
      ? 'thời gian'
      : eventMatch[2] === 'name'
        ? 'tên sự kiện'
        : 'mã sự kiện';
    return `Sự kiện ${Number(eventMatch[1]) + 1} - ${field}`;
  }
  return TEMPLE_FIELD_LABELS[path] ?? path;
}

function translateValidationDetail(detail: string): string {
  const value = detail.trim();
  let match = /^([\w.]+) must be a UUID$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: mã định danh không hợp lệ`;

  match = /^([\w.]+) must be one of the following values: (.+)$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: giá trị không hợp lệ`;

  match = /^([\w.]+) should not be empty$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: không được để trống`;

  match = /^([\w.]+) must be shorter than or equal to (\d+) characters$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: tối đa ${match[2]} ký tự`;

  match = /^each value in ([\w.]+) must be shorter than or equal to (\d+) characters$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: mỗi mục tối đa ${match[2]} ký tự`;

  return value;
}

export function describeTempleError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'TEMPLE_SLUG_EXISTS') {
      return 'Đã có địa điểm dùng đường dẫn được tạo từ tên này. Vui lòng đổi tên rồi thử lại';
    }
    if (error.code === 'INVALID_TEMPLE_MEDIA') {
      return 'Ảnh đại diện không hợp lệ, đã bị xóa hoặc không được phép sử dụng. Vui lòng chọn ảnh khác';
    }
    if (error.code === 'TEMPLE_VERSION_CONFLICT') {
      return 'Địa điểm đã được người khác cập nhật. Nội dung bạn đang nhập chưa bị mất';
    }
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (error.status === 404) return 'Điểm du lịch không tồn tại hoặc đã bị xóa';
    if (error.status === 400 || error.status === 422) return error.message || 'Dữ liệu chưa hợp lệ';
    if (error.status === 409) return error.message || 'Dữ liệu đã được người khác cập nhật';
    if (error.status && error.status >= 500) return 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    return error.message || 'Thao tác thất bại';
  }
  return 'Không thể kết nối máy chủ';
}

export function getTempleErrorDetails(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.details) return [];
  return [...new Set(error.details
    .filter((detail): detail is string => typeof detail === 'string')
    .map(translateValidationDetail))];
}

export function getTempleErrorRequestId(error: unknown): string | undefined {
  return error instanceof ApiError ? error.requestId : undefined;
}
