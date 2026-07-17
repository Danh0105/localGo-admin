import { ApiError } from '../../../types/api';

const NEWS_FIELD_LABELS: Record<string, string> = {
  title: 'Tiêu đề',
  category: 'Danh mục',
  publishedAt: 'Ngày đăng',
  author: 'Tác giả / đơn vị đăng',
  summary: 'Mô tả ngắn',
  content: 'Nội dung',
  tags: 'Từ khóa',
  relatedLinks: 'Liên quan',
  mediaId: 'Ảnh đại diện',
  imageAlt: 'Mô tả ảnh',
  isActive: 'Trạng thái hiển thị',
  version: 'Phiên bản dữ liệu',
};

function fieldLabel(field: string): string {
  return NEWS_FIELD_LABELS[field] ?? field;
}

function translateValidationDetail(detail: string): string {
  const value = detail.trim();
  let match = /^property (\w+) should not exist$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: trường dữ liệu không được hỗ trợ`;

  match = /^(\w+) should not be empty$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: không được để trống`;

  match = /^(\w+) must be a valid ISO 8601 date string$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: ngày giờ không hợp lệ`;

  match = /^(\w+) must be shorter than or equal to (\d+) characters$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: tối đa ${match[2]} ký tự`;

  match = /^each value in (\w+) must be shorter than or equal to (\d+) characters$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: mỗi mục tối đa ${match[2]} ký tự`;

  match = /^(\w+) must contain no more than (\d+) elements$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: tối đa ${match[2]} mục`;

  match = /^(\w+) must contain at least (\d+) elements$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: cần ít nhất ${match[2]} mục`;

  match = /^(\w+) must be one of the following values: (.+)$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: giá trị không hợp lệ`;

  match = /^(\w+) must be (?:a UUID|an? string|an? array|an? boolean|an integer number)$/i.exec(value);
  if (match) return `${fieldLabel(match[1])}: sai định dạng`;

  return value;
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return translateValidationDetail(detail);
  if (!detail || typeof detail !== 'object') return null;

  const record = detail as Record<string, unknown>;
  if (typeof record.message !== 'string') return null;

  const message = translateValidationDetail(record.message);
  const field = typeof record.field === 'string'
    ? record.field
    : typeof record.path === 'string'
      ? record.path
      : null;
  return field ? `${fieldLabel(field)}: ${message}` : message;
}

export function describeNewsError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NEWS_ARTICLE_SLUG_EXISTS') {
      return 'Đã có bài viết dùng đường dẫn được tạo từ tiêu đề này. Vui lòng đổi tiêu đề rồi thử lại';
    }
    if (error.code === 'INVALID_NEWS_ARTICLE_MEDIA') {
      return 'Ảnh đại diện không hợp lệ, đã bị xóa hoặc không được phép sử dụng. Vui lòng chọn ảnh khác';
    }
    if (error.code === 'NEWS_ARTICLE_VERSION_CONFLICT') {
      return 'Bài viết đã được người khác cập nhật. Nội dung bạn đang nhập chưa bị mất';
    }
    if (error.status === 401) return 'Phiên đăng nhập đã hết hạn';
    if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này';
    if (error.status === 404) return 'Bài viết không tồn tại hoặc đã bị xóa';
    if (error.status === 400 || error.status === 422) return error.message || 'Dữ liệu chưa hợp lệ';
    if (error.status === 409) return error.message || 'Dữ liệu đã được người khác cập nhật';
    if (error.status && error.status >= 500) return 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    return error.message || 'Thao tác thất bại';
  }
  return 'Không thể kết nối máy chủ';
}

export function getNewsErrorDetails(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.details) return [];

  const summary = describeNewsError(error);
  return [...new Set(error.details
    .map(detailMessage)
    .filter((detail): detail is string => Boolean(detail) && detail !== summary))];
}

export function getNewsErrorRequestId(error: unknown): string | undefined {
  return error instanceof ApiError ? error.requestId : undefined;
}
