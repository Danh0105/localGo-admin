import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../../types/api';
import {
  describeTempleError,
  getTempleErrorDetails,
  getTempleErrorRequestId,
} from '../temple-errors';

describe('temple error messages', () => {
  it('turns backend validation details into actionable Vietnamese messages', () => {
    const error = new ApiError(
      {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: [
          'events.0.id must be a UUID',
          'type must be one of the following values: Đình, Chùa, Miếu',
        ],
      },
      'req-temple-123',
      400,
    );

    expect(describeTempleError(error)).toBe('Dữ liệu không hợp lệ');
    expect(getTempleErrorDetails(error)).toEqual([
      'Sự kiện 1 - mã sự kiện: mã định danh không hợp lệ',
      'Loại địa điểm: giá trị không hợp lệ',
    ]);
    expect(getTempleErrorRequestId(error)).toBe('req-temple-123');
  });

  it('explains duplicate names and invalid media with a resolution', () => {
    expect(describeTempleError(new ApiError(
      { code: 'TEMPLE_SLUG_EXISTS', message: 'Slug đã tồn tại' },
      undefined,
      409,
    ))).toMatch(/Vui lòng đổi tên/);

    expect(describeTempleError(new ApiError(
      { code: 'INVALID_TEMPLE_MEDIA', message: 'Ảnh không hợp lệ' },
      undefined,
      400,
    ))).toMatch(/Vui lòng chọn ảnh khác/);
  });
});
