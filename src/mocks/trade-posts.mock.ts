import type { Paginated } from '../types/api';
import { ApiError } from '../types/api';
import type { TradePost, TradePostAdminQuery, TradePostOwnerView } from '../types/trade-post';

const MOCK_DELAY = 250;

const mockOwners: Record<string, TradePostOwnerView> = {
  businessFarm: {
    id: 'user-003', displayName: 'Nông sản Tây Ninh Farm', email: 'contact@tayninhfarm.vn',
    phone: '0934567890', avatarUrl: null, role: 'BUSINESS', status: 'ACTIVE',
  },
  businessTravel: {
    id: 'user-004', displayName: 'Du lịch An Phúc', email: 'hello@anphuctravel.vn',
    phone: '02763888999', avatarUrl: null, role: 'BUSINESS', status: 'ACTIVE',
  },
  individual: {
    id: 'user-001', displayName: 'Nguyễn Hoàng Minh', email: 'minh.nguyen@example.com',
    phone: '0901234567', avatarUrl: null, role: 'USER', status: 'ACTIVE',
  },
};

function mockImage(label: string, start: string, end: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs><rect width="900" height="560" fill="url(#g)"/><circle cx="735" cy="100" r="150" fill="white" opacity=".1"/><text x="50%" y="50%" fill="white" font-family="Arial" font-size="44" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makePost(
  input: Pick<TradePost, 'id' | 'slug' | 'category' | 'title' | 'summary' | 'description' | 'status' | 'createdAt'> &
    Partial<TradePost>,
): TradePost {
  const image = input.thumbnailUrl ?? mockImage('LocalGo', '#5b35d5', '#9b72ff');
  return {
    ownerId: mockOwners.businessFarm.id,
    owner: mockOwners.businessFarm,
    priceType: 'CONTACT',
    price: null,
    priceLabel: 'Liên hệ báo giá',
    address: 'Tây Ninh',
    lat: null,
    lng: null,
    contactName: 'Nguyễn Hoàng Nam',
    contactPhone: '0908123456',
    contactZalo: '0908123456',
    thumbnailUrl: image,
    featured: false,
    promotionPercent: null,
    promotionStartAt: null,
    promotionEndAt: null,
    expiresAt: null,
    viewCount: 0,
    averageRating: '0.0',
    reviewCount: 0,
    publishedAt: null,
    rejectedReason: null,
    approvedById: null,
    approvedAt: null,
    updatedAt: input.createdAt,
    images: [{ id: `image-${input.id}`, url: image, thumbnailUrl: image, sortOrder: 0 }],
    ...input,
  };
}

let mockTradePosts: TradePost[] = [
  makePost({
    id: 'trade-001', slug: 'mang-cau-ba-den-loai-1', category: 'PRODUCT', status: 'PENDING',
    title: 'Mãng cầu Bà Đen loại 1 – giao tận nơi',
    summary: 'Mãng cầu dai tuyển chọn tại vườn, trái đều, ngọt thanh và thu hoạch trong ngày.',
    description: 'Mãng cầu được chăm sóc theo quy trình an toàn tại vùng núi Bà Đen. Sản phẩm đóng thùng 5kg hoặc 10kg, phù hợp làm quà biếu và phân phối cho cửa hàng. Nhận giao hàng trong nội thành Tây Ninh.',
    priceType: 'FIXED', price: '65000', priceLabel: '65.000đ/kg', address: 'Phường Ninh Sơn, Tây Ninh',
    thumbnailUrl: mockImage('Mãng cầu Tây Ninh', '#2e7d32', '#8bc34a'),
    createdAt: '2026-07-14T01:20:00.000Z',
  }),
  makePost({
    id: 'trade-002', slug: 'tour-nui-ba-den-cuoi-tuan', category: 'SERVICE', status: 'PENDING',
    title: 'Tour khám phá Núi Bà Đen cuối tuần',
    summary: 'Tour trong ngày, có hướng dẫn viên địa phương và xe đưa đón tại trung tâm.',
    description: 'Lịch trình bao gồm tham quan quần thể Núi Bà Đen, trải nghiệm ẩm thực địa phương và check-in các điểm nổi tiếng. Giá đã bao gồm xe đưa đón, hướng dẫn viên và bữa trưa.',
    priceType: 'FIXED', price: '790000', priceLabel: '790.000đ/người', address: 'Phường Ninh Sơn, Tây Ninh',
    ownerId: mockOwners.businessTravel.id, owner: mockOwners.businessTravel,
    contactName: 'Phạm Hoài An', contactPhone: '0918345678', contactZalo: '0918345678',
    thumbnailUrl: mockImage('Tour Núi Bà Đen', '#4527a0', '#7e57c2'),
    createdAt: '2026-07-13T09:15:00.000Z',
  }),
  makePost({
    id: 'trade-003', slug: 'banh-trang-phoi-suong-trang-bang', category: 'PRODUCT', status: 'PUBLISHED',
    title: 'Bánh tráng phơi sương Trảng Bàng chính gốc',
    summary: 'Bánh mềm dẻo, làm thủ công mỗi ngày, đóng gói đảm bảo vệ sinh.',
    description: 'Bánh tráng phơi sương thủ công từ làng nghề Trảng Bàng. Đơn hàng sỉ từ 20 bịch có chính sách giá riêng.',
    priceType: 'FIXED', price: '45000', priceLabel: '45.000đ/bịch', address: 'Trảng Bàng, Tây Ninh',
    contactName: 'Trần Thị Sáu', contactPhone: '0977123456', featured: true, viewCount: 428,
    averageRating: '4.8', reviewCount: 32, publishedAt: '2026-07-10T03:00:00.000Z',
    approvedById: 'user-006', approvedAt: '2026-07-10T03:00:00.000Z',
    thumbnailUrl: mockImage('Bánh tráng phơi sương', '#b45309', '#f59e0b'),
    createdAt: '2026-07-09T11:00:00.000Z',
  }),
  makePost({
    id: 'trade-004', slug: 'can-thue-thiet-ke-bo-nhan-dien', category: 'BUY_REQUEST', status: 'PENDING',
    title: 'Cần thuê thiết kế bộ nhận diện cửa hàng',
    summary: 'Tìm đơn vị thiết kế logo, bảng hiệu và menu cho cửa hàng đặc sản.',
    description: 'Cần đơn vị có kinh nghiệm thiết kế ngành F&B tại Tây Ninh. Vui lòng gửi portfolio và báo giá chi tiết qua Zalo.',
    priceType: 'NEGOTIABLE', priceLabel: 'Thỏa thuận', address: 'Phường 3, Tây Ninh',
    ownerId: mockOwners.individual.id, owner: mockOwners.individual,
    thumbnailUrl: mockImage('Thiết kế nhận diện', '#1d4ed8', '#60a5fa'),
    createdAt: '2026-07-12T06:40:00.000Z',
  }),
  makePost({
    id: 'trade-005', slug: 'ca-phe-rang-moc-giam-15', category: 'PROMOTION', status: 'REJECTED',
    title: 'Cà phê rang mộc giảm 15% trong tháng 7',
    summary: 'Ưu đãi cho toàn bộ dòng cà phê Robusta rang mộc nguyên chất.',
    description: 'Áp dụng tại cửa hàng và đơn giao nội thành. Không áp dụng đồng thời với chương trình khác.',
    priceType: 'FIXED', price: '180000', priceLabel: 'Từ 180.000đ/kg', address: 'Hòa Thành, Tây Ninh',
    ownerId: mockOwners.businessTravel.id, owner: mockOwners.businessTravel,
    promotionPercent: 15, promotionStartAt: '2026-07-01T00:00:00.000Z', promotionEndAt: '2026-07-31T23:59:59.000Z',
    rejectedReason: 'Vui lòng bổ sung điều kiện áp dụng khuyến mãi và ảnh sản phẩm thực tế.',
    thumbnailUrl: mockImage('Cà phê rang mộc', '#4e342e', '#a1887f'),
    createdAt: '2026-07-08T04:30:00.000Z',
  }),
  makePost({
    id: 'trade-006', slug: 'van-chuyen-hang-noi-tinh', category: 'SERVICE', status: 'ARCHIVED',
    title: 'Nhận vận chuyển hàng hóa nội tỉnh trong ngày',
    summary: 'Xe tải nhẹ nhận giao hàng tại các huyện, có xuất hóa đơn theo yêu cầu.',
    description: 'Nhận hàng từ 7h đến 18h hàng ngày. Giá tùy quãng đường và khối lượng hàng hóa.',
    address: 'Hòa Thành, Tây Ninh', contactName: 'Trương Quốc Huy', contactPhone: '0903456123',
    ownerId: mockOwners.businessTravel.id, owner: mockOwners.businessTravel,
    thumbnailUrl: mockImage('Vận chuyển nội tỉnh', '#0f766e', '#2dd4bf'),
    createdAt: '2026-06-01T03:00:00.000Z',
  }),
];

async function delay<T>(value: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
  return value;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findPost(id: string): { post: TradePost; index: number } {
  const index = mockTradePosts.findIndex((post) => post.id === id);
  if (index < 0) throw new ApiError({ code: 'TRADE_POST_NOT_FOUND', message: 'Không tìm thấy tin giao thương' });
  return { post: mockTradePosts[index], index };
}

export async function getMockTradePosts(query: TradePostAdminQuery): Promise<Paginated<TradePost>> {
  const keyword = normalize(query.search ?? '');
  const filtered = mockTradePosts
    .filter((post) =>
      (!query.status || post.status === query.status) &&
      (!query.category || post.category === query.category) &&
      (!keyword || normalize(`${post.title} ${post.summary} ${post.address}`).includes(keyword)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const total = filtered.length;
  return delay({
    data: structuredClone(filtered.slice((page - 1) * limit, page * limit)),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function getMockTradePostDetail(id: string): Promise<TradePost> {
  return delay(structuredClone(findPost(id).post));
}

export async function approveMockTradePost(id: string): Promise<TradePost> {
  const { post, index } = findPost(id);
  if (post.status !== 'PENDING') throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Tin không còn ở trạng thái chờ duyệt' });
  const now = new Date().toISOString();
  mockTradePosts[index] = { ...post, status: 'PUBLISHED', publishedAt: now, approvedAt: now, approvedById: 'user-008', updatedAt: now };
  return delay(structuredClone(mockTradePosts[index]));
}

export async function rejectMockTradePost(id: string, reason: string): Promise<TradePost> {
  const { post, index } = findPost(id);
  if (post.status !== 'PENDING') throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Tin không còn ở trạng thái chờ duyệt' });
  mockTradePosts[index] = { ...post, status: 'REJECTED', rejectedReason: reason, updatedAt: new Date().toISOString() };
  return delay(structuredClone(mockTradePosts[index]));
}

export async function archiveMockTradePost(id: string): Promise<TradePost> {
  const { post, index } = findPost(id);
  if (post.status !== 'PUBLISHED') throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Chỉ có thể lưu trữ tin đã xuất bản' });
  mockTradePosts[index] = { ...post, status: 'ARCHIVED', updatedAt: new Date().toISOString() };
  return delay(structuredClone(mockTradePosts[index]));
}

export async function hideMockTradePost(id: string): Promise<TradePost> {
  const { post, index } = findPost(id);
  if (post.status !== 'PUBLISHED') throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Chỉ có thể ẩn tin đã xuất bản' });
  mockTradePosts[index] = { ...post, status: 'HIDDEN', featured: false, updatedAt: new Date().toISOString() };
  return delay(structuredClone(mockTradePosts[index]));
}

export async function unhideMockTradePost(id: string): Promise<TradePost> {
  const { post, index } = findPost(id);
  if (post.status !== 'HIDDEN') throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Chỉ có thể hiển thị lại tin đang bị ẩn' });
  mockTradePosts[index] = { ...post, status: 'PUBLISHED', updatedAt: new Date().toISOString() };
  return delay(structuredClone(mockTradePosts[index]));
}

export async function deleteMockTradePost(id: string): Promise<void> {
  const { post, index } = findPost(id);
  if (post.status !== 'PUBLISHED' && post.status !== 'HIDDEN') {
    throw new ApiError({ code: 'INVALID_STATUS_TRANSITION', message: 'Chỉ có thể xóa tin đã xuất bản hoặc đang bị ẩn' });
  }
  mockTradePosts.splice(index, 1);
  await delay(undefined);
}

export async function featureMockTradePost(id: string, featured: boolean): Promise<TradePost> {
  const { post, index } = findPost(id);
  mockTradePosts[index] = { ...post, featured, updatedAt: new Date().toISOString() };
  return delay(structuredClone(mockTradePosts[index]));
}
