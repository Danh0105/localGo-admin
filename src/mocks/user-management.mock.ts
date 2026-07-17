import type { Paginated } from '../types/api';
import { ApiError } from '../types/api';
import type {
  ApproveBusinessApplicationInput,
  BusinessApplication,
  BusinessApplicationAdminQuery,
} from '../types/business-application';
import type { CurrentUser, UserAdminQuery, UserStatus } from '../types/user';

const MOCK_DELAY = 280;

const documentUrl = (content: string): string =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;

let mockUsers: CurrentUser[] = [
  {
    id: 'user-001',
    zaloId: 'zalo-10001',
    phone: '0901234567',
    email: 'minh.nguyen@example.com',
    displayName: 'Nguyễn Hoàng Minh',
    avatarUrl: null,
    role: 'USER',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-14T01:42:00.000Z',
    createdAt: '2026-03-12T08:20:00.000Z',
    updatedAt: '2026-07-14T01:42:00.000Z',
  },
  {
    id: 'user-002',
    zaloId: 'zalo-10002',
    phone: '0912456789',
    email: 'lan.pham@example.com',
    displayName: 'Phạm Ngọc Lan',
    avatarUrl: null,
    role: 'USER',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-13T13:15:00.000Z',
    createdAt: '2026-04-02T03:10:00.000Z',
    updatedAt: '2026-07-13T13:15:00.000Z',
  },
  {
    id: 'user-003',
    zaloId: null,
    phone: '0934567890',
    email: 'contact@tayninhfarm.vn',
    displayName: 'Nông sản Tây Ninh Farm',
    avatarUrl: null,
    role: 'BUSINESS',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-14T02:06:00.000Z',
    createdAt: '2026-05-18T09:30:00.000Z',
    updatedAt: '2026-07-14T02:06:00.000Z',
  },
  {
    id: 'user-004',
    zaloId: null,
    phone: '02763888999',
    email: 'hello@anphuctravel.vn',
    displayName: 'Du lịch An Phúc',
    avatarUrl: null,
    role: 'BUSINESS',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-12T08:40:00.000Z',
    createdAt: '2026-05-25T04:25:00.000Z',
    updatedAt: '2026-07-12T08:40:00.000Z',
  },
  {
    id: 'user-005',
    zaloId: 'zalo-10005',
    phone: '0987654321',
    email: 'thanh.vo@example.com',
    displayName: 'Võ Quốc Thành',
    avatarUrl: null,
    role: 'USER',
    status: 'BLOCKED',
    lastLoginAt: '2026-06-28T11:05:00.000Z',
    createdAt: '2026-02-08T06:30:00.000Z',
    updatedAt: '2026-06-29T02:00:00.000Z',
  },
  {
    id: 'user-006',
    zaloId: null,
    phone: '0909090909',
    email: 'moderator@localgo.vn',
    displayName: 'Trần Hải Yến',
    avatarUrl: null,
    role: 'MODERATOR',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-14T02:20:00.000Z',
    createdAt: '2026-01-10T02:00:00.000Z',
    updatedAt: '2026-07-14T02:20:00.000Z',
  },
  {
    id: 'user-007',
    zaloId: 'zalo-10007',
    phone: '0905678123',
    email: null,
    displayName: 'Lê Mai Anh',
    avatarUrl: null,
    role: 'USER',
    status: 'PENDING',
    lastLoginAt: null,
    createdAt: '2026-07-13T12:40:00.000Z',
    updatedAt: '2026-07-13T12:40:00.000Z',
  },
  {
    id: 'user-008',
    zaloId: null,
    phone: null,
    email: 'admin@localgo.vn',
    displayName: 'LocalGo Admin',
    avatarUrl: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-14T02:30:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-07-14T02:30:00.000Z',
  },
];

let mockApplications: BusinessApplication[] = [
  {
    id: 'application-001',
    applicantType: 'ORGANIZATION',
    businessName: 'Công ty TNHH Thực phẩm Xanh Tây Ninh',
    businessCategory: 'Nông sản & Thực phẩm',
    contactName: 'Nguyễn Văn Nam',
    contactPhone: '0908123456',
    contactEmail: 'nam@thucphamxanh.vn',
    address: '128 đường 30/4, Phường Tân Ninh, Tây Ninh',
    identityNumber: null,
    identityIssuedAt: null,
    identityIssuedPlace: null,
    legalName: 'CÔNG TY TNHH THỰC PHẨM XANH TÂY NINH',
    taxCode: '3901345678',
    representativeName: 'Nguyễn Văn Nam',
    representativeTitle: 'Giám đốc',
    website: 'https://thucphamxanh.vn',
    description: 'Cung cấp nông sản sạch và các sản phẩm đặc sản đạt chuẩn OCOP tại Tây Ninh.',
    documents: [
      {
        id: 'doc-001',
        name: 'giay-phep-kinh-doanh.pdf',
        type: 'BUSINESS_LICENSE',
        url: documentUrl('Mock: Giấy phép kinh doanh Thực phẩm Xanh Tây Ninh'),
        mimeType: 'application/pdf',
      },
      {
        id: 'doc-002',
        name: 'xac-nhan-ma-so-thue.pdf',
        type: 'TAX_DOCUMENT',
        url: documentUrl('Mock: Xác nhận mã số thuế 3901345678'),
        mimeType: 'application/pdf',
      },
    ],
    status: 'PENDING',
    rejectionReason: null,
    reviewedByName: null,
    reviewedAt: null,
    createdUserId: null,
    createdAt: '2026-07-14T01:15:00.000Z',
    updatedAt: '2026-07-14T01:15:00.000Z',
  },
  {
    id: 'application-002',
    applicantType: 'INDIVIDUAL',
    businessName: 'Bánh tráng cô Sáu',
    businessCategory: 'Ẩm thực địa phương',
    contactName: 'Trần Thị Sáu',
    contactPhone: '0977123456',
    contactEmail: 'cosaubanhtrang@example.com',
    address: 'Ấp Ninh Trung, xã Ninh Sơn, Tây Ninh',
    identityNumber: '072190012345',
    identityIssuedAt: '2021-09-16T00:00:00.000Z',
    identityIssuedPlace: 'Cục Cảnh sát QLHC về TTXH',
    legalName: null,
    taxCode: null,
    representativeName: null,
    representativeTitle: null,
    website: null,
    description: 'Hộ sản xuất bánh tráng thủ công, hoạt động hơn 12 năm tại địa phương.',
    documents: [
      {
        id: 'doc-003',
        name: 'cccd-mat-truoc.jpg',
        type: 'IDENTITY_FRONT',
        url: documentUrl('Mock: CCCD mặt trước - Trần Thị Sáu'),
        mimeType: 'image/jpeg',
      },
      {
        id: 'doc-004',
        name: 'cccd-mat-sau.jpg',
        type: 'IDENTITY_BACK',
        url: documentUrl('Mock: CCCD mặt sau - Trần Thị Sáu'),
        mimeType: 'image/jpeg',
      },
    ],
    status: 'PENDING',
    rejectionReason: null,
    reviewedByName: null,
    reviewedAt: null,
    createdUserId: null,
    createdAt: '2026-07-13T10:20:00.000Z',
    updatedAt: '2026-07-13T10:20:00.000Z',
  },
  {
    id: 'application-003',
    applicantType: 'ORGANIZATION',
    businessName: 'Homestay Núi Bà',
    businessCategory: 'Du lịch & Lưu trú',
    contactName: 'Phạm Hoài An',
    contactPhone: '0918345678',
    contactEmail: 'hello@homestaynuiba.vn',
    address: 'Đường Bời Lời, Phường Bình Minh, Tây Ninh',
    identityNumber: null,
    identityIssuedAt: null,
    identityIssuedPlace: null,
    legalName: 'CÔNG TY TNHH DU LỊCH NÚI BÀ',
    taxCode: '3901298765',
    representativeName: 'Phạm Hoài An',
    representativeTitle: 'Tổng giám đốc',
    website: 'https://homestaynuiba.vn',
    description: 'Dịch vụ lưu trú và trải nghiệm văn hóa bản địa gần Núi Bà Đen.',
    documents: [
      {
        id: 'doc-005',
        name: 'dang-ky-doanh-nghiep.pdf',
        type: 'BUSINESS_LICENSE',
        url: documentUrl('Mock: Đăng ký doanh nghiệp Homestay Núi Bà'),
        mimeType: 'application/pdf',
      },
    ],
    status: 'APPROVED',
    rejectionReason: null,
    reviewedByName: 'Trần Hải Yến',
    reviewedAt: '2026-07-12T04:30:00.000Z',
    createdUserId: 'user-009',
    createdAt: '2026-07-10T02:30:00.000Z',
    updatedAt: '2026-07-12T04:30:00.000Z',
  },
  {
    id: 'application-004',
    applicantType: 'INDIVIDUAL',
    businessName: 'Vườn trái cây Bảy Hùng',
    businessCategory: 'Nông nghiệp',
    contactName: 'Lê Văn Hùng',
    contactPhone: '0966234567',
    contactEmail: 'bayhung.farm@example.com',
    address: 'Xã Bàu Năng, huyện Dương Minh Châu, Tây Ninh',
    identityNumber: '072082009876',
    identityIssuedAt: '2022-02-21T00:00:00.000Z',
    identityIssuedPlace: 'Cục Cảnh sát QLHC về TTXH',
    legalName: null,
    taxCode: null,
    representativeName: null,
    representativeTitle: null,
    website: null,
    description: null,
    documents: [
      {
        id: 'doc-006',
        name: 'cccd-truoc.jpg',
        type: 'IDENTITY_FRONT',
        url: documentUrl('Mock: CCCD mặt trước - Lê Văn Hùng'),
        mimeType: 'image/jpeg',
      },
    ],
    status: 'REJECTED',
    rejectionReason: 'Vui lòng bổ sung ảnh CCCD mặt sau và giấy xác nhận địa điểm kinh doanh.',
    reviewedByName: 'Trần Hải Yến',
    reviewedAt: '2026-07-11T07:45:00.000Z',
    createdUserId: null,
    createdAt: '2026-07-09T08:12:00.000Z',
    updatedAt: '2026-07-11T07:45:00.000Z',
  },
  {
    id: 'application-005',
    applicantType: 'ORGANIZATION',
    businessName: 'Hợp tác xã Mãng cầu Tân Châu',
    businessCategory: 'Nông sản & Thực phẩm',
    contactName: 'Đặng Thu Hà',
    contactPhone: '0933123789',
    contactEmail: 'htx.mangcau@example.com',
    address: 'Thị trấn Tân Châu, huyện Tân Châu, Tây Ninh',
    identityNumber: null,
    identityIssuedAt: null,
    identityIssuedPlace: null,
    legalName: 'HỢP TÁC XÃ MÃNG CẦU TÂN CHÂU',
    taxCode: '3901277712',
    representativeName: 'Đặng Thu Hà',
    representativeTitle: 'Chủ tịch HĐQT',
    website: null,
    description: 'Kết nối nông hộ trồng mãng cầu và phân phối sản phẩm đạt chuẩn.',
    documents: [
      {
        id: 'doc-007',
        name: 'giay-chung-nhan-htx.pdf',
        type: 'BUSINESS_LICENSE',
        url: documentUrl('Mock: Giấy chứng nhận Hợp tác xã Mãng cầu Tân Châu'),
        mimeType: 'application/pdf',
      },
    ],
    status: 'PENDING',
    rejectionReason: null,
    reviewedByName: null,
    reviewedAt: null,
    createdUserId: null,
    createdAt: '2026-07-12T09:05:00.000Z',
    updatedAt: '2026-07-12T09:05:00.000Z',
  },
];

function normalize(value: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function paginate<T>(items: T[], page: number, limit: number): Paginated<T> {
  const total = items.length;
  return {
    data: structuredClone(items.slice((page - 1) * limit, page * limit)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function withDelay<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  return value;
}

export async function getMockUsers(query: UserAdminQuery): Promise<Paginated<CurrentUser>> {
  const keyword = normalize(query.search ?? '');
  const filtered = mockUsers.filter((user) =>
    (!query.role || user.role === query.role) &&
    (!query.status || user.status === query.status) &&
    (!keyword || [user.displayName, user.email, user.phone].some((value) => normalize(value).includes(keyword))),
  );
  return withDelay(paginate(filtered, query.page, query.limit));
}

export async function setMockUserStatus(id: string, status: UserStatus): Promise<CurrentUser> {
  const index = mockUsers.findIndex((user) => user.id === id);
  if (index < 0) {
    throw new ApiError({ code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
  }
  mockUsers[index] = { ...mockUsers[index], status, updatedAt: new Date().toISOString() };
  return withDelay(structuredClone(mockUsers[index]));
}

export async function getMockBusinessApplications(
  query: BusinessApplicationAdminQuery,
): Promise<Paginated<BusinessApplication>> {
  const keyword = normalize(query.search ?? '');
  const filtered = mockApplications.filter((application) =>
    (!query.status || application.status === query.status) &&
    (!query.applicantType || application.applicantType === query.applicantType) &&
    (!keyword || [
      application.businessName,
      application.contactName,
      application.contactEmail,
      application.contactPhone,
      application.taxCode,
    ].some((value) => normalize(value).includes(keyword))),
  );
  return withDelay(paginate(filtered, query.page, query.limit));
}

export async function approveMockBusinessApplication(
  id: string,
  input: ApproveBusinessApplicationInput,
): Promise<BusinessApplication> {
  const index = mockApplications.findIndex((application) => application.id === id);
  if (index < 0) {
    throw new ApiError({ code: 'APPLICATION_NOT_FOUND', message: 'Không tìm thấy hồ sơ' });
  }
  if (mockApplications[index].status !== 'PENDING') {
    throw new ApiError({ code: 'APPLICATION_ALREADY_REVIEWED', message: 'Hồ sơ đã được xử lý' });
  }
  if (mockUsers.some((user) => user.email?.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError({ code: 'EMAIL_ALREADY_EXISTS', message: 'Email đã được sử dụng' });
  }

  const now = new Date().toISOString();
  const createdUser: CurrentUser = {
    id: `mock-user-${Date.now()}`,
    zaloId: null,
    phone: mockApplications[index].contactPhone,
    email: input.email,
    displayName: input.displayName,
    avatarUrl: null,
    role: 'BUSINESS',
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };
  mockUsers = [createdUser, ...mockUsers];
  mockApplications[index] = {
    ...mockApplications[index],
    status: 'APPROVED',
    rejectionReason: null,
    reviewedByName: 'LocalGo Admin',
    reviewedAt: now,
    createdUserId: createdUser.id,
    updatedAt: now,
  };
  return withDelay(structuredClone(mockApplications[index]));
}

export async function rejectMockBusinessApplication(
  id: string,
  reason: string,
): Promise<BusinessApplication> {
  const index = mockApplications.findIndex((application) => application.id === id);
  if (index < 0) {
    throw new ApiError({ code: 'APPLICATION_NOT_FOUND', message: 'Không tìm thấy hồ sơ' });
  }
  if (mockApplications[index].status !== 'PENDING') {
    throw new ApiError({ code: 'APPLICATION_ALREADY_REVIEWED', message: 'Hồ sơ đã được xử lý' });
  }
  const now = new Date().toISOString();
  mockApplications[index] = {
    ...mockApplications[index],
    status: 'REJECTED',
    rejectionReason: reason,
    reviewedByName: 'LocalGo Admin',
    reviewedAt: now,
    updatedAt: now,
  };
  return withDelay(structuredClone(mockApplications[index]));
}
