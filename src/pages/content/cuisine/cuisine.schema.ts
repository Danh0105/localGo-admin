import { z } from 'zod';

/**
 * Schema của màn hình quản trị Ẩm thực.
 * Dữ liệu form dùng `suggestedPlaces` (object[]) để tương thích UI cũ;
 * request gửi lên backend luôn dùng `suggestedPlaceDetails` (object[]).
 */
export const CUISINE_CATEGORY_VALUES = [
  'Món nước',
  'Món nướng',
  'Món cuốn',
  'Ăn vặt',
  'Món chay',
] as const;

const PLACE_LIMIT = 20;
const MENU_LIMIT = 50;
const REVIEW_LIMIT = 100;
const GALLERY_LIMIT = 10;

export function slugifyCuisinePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

/** So khớp hostname CHÍNH XÁC; không suy đoán, không theo redirect. */
export function isValidCuisineMapsUrl(raw: string): boolean {
  if (!raw || raw.length > 2048 || raw.trim() !== raw) return false;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return false;
    // Không cho phép các cổng tùy biến. Cổng mặc định 443 được URL chuẩn hóa về rỗng.
    if (url.port) return false;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    switch (host) {
      case 'www.google.com':
      case 'google.com':
        return path.startsWith('/maps/');
      case 'maps.google.com':
        return true;
      case 'maps.app.goo.gl':
        return path.length > 1;
      case 'goo.gl':
        return path.startsWith('/maps/');
      default:
        return false;
    }
  } catch {
    return false;
  }
}

export function safeCuisineMapsUrl(value: string): string | undefined {
  return isValidCuisineMapsUrl(value) ? value : undefined;
}

const urlField = z.string().max(2048, 'Link tối đa 2.048 ký tự').refine(
  (value) => value === '' || isValidCuisineMapsUrl(value),
  'Link phải dùng HTTPS và thuộc Google Maps chính thức',
);

const placeSchema = z.object({
  id: z.string().trim().min(1, 'Bắt buộc nhập mã địa điểm').max(100),
  name: z.string().trim().min(1, 'Bắt buộc nhập tên địa điểm').max(200),
  address: z.string().max(255),
  googleMapsUrl: urlField,
});

const menuItemSchema = z.object({
  id: z.string().trim().min(1, 'Bắt buộc nhập mã món trong menu').max(100),
  name: z.string().trim().min(1, 'Bắt buộc nhập tên món').max(200),
  price: z.string().trim().min(1, 'Bắt buộc nhập giá').max(100),
  description: z.string().max(2000),
});

const reviewSchema = z.object({
  id: z.string().trim().min(1, 'Bắt buộc nhập mã đánh giá').max(100),
  reviewerName: z.string().trim().min(1, 'Bắt buộc nhập tên người đánh giá').max(200),
  rating: z.number().int().min(1, 'Tối thiểu 1 sao').max(5, 'Tối đa 5 sao'),
  feedback: z.string().max(5000),
  adminResponse: z.string().max(5000),
});

const galleryItemSchema = z.object({
  mediaId: z.string().trim().min(1, 'Cần tải ảnh lên trước khi lưu'),
  imageUrl: z.string(), // chỉ để render preview, không gửi API
});

function duplicateErrors(
  items: Array<{ id: string }>,
  prefix: 'suggestedPlaces' | 'menu' | 'reviews',
  ctx: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  items.forEach(({ id }, index) => {
    const key = id.trim();
    if (key && seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [prefix, index, 'id'],
        message: 'Mã ID bị trùng trong cùng danh sách',
      });
    }
    seen.add(key);
  });
}

export const cuisineFormSchema = z.object({
  name: z.string().trim().min(1, 'Bắt buộc nhập tên món').max(150),
  category: z.enum(CUISINE_CATEGORY_VALUES),
  googleMapsUrl: urlField, // Link Google Maps chính (trường đã có ở UI cũ)
  priceRange: z.string().trim().min(1, 'Bắt buộc nhập khoảng giá').max(100),
  bestTime: z.string().trim().min(1, 'Bắt buộc nhập thời điểm').max(100),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  summary: z.string().trim().min(1, 'Bắt buộc nhập mô tả ngắn').max(300),
  imageUrl: z.string().nullable(), // local display only
  mediaId: z.string().nullable(),
  imageAlt: z.string().max(150),
  suggestedPlaces: z.array(placeSchema).max(PLACE_LIMIT, `Tối đa ${PLACE_LIMIT} địa điểm`),
  descriptions: z.array(z.object({ text: z.string().trim().min(1, 'Nội dung không được rỗng').max(5000) }))
    .min(1, 'Cần tối thiểu một đoạn mô tả').max(20),
  highlights: z.array(z.object({ text: z.string().trim().min(1, 'Nội dung không được rỗng').max(200) })).max(20),
  tip: z.string().max(2000),
  contactPhone: z.string().max(30).refine(
    (value) => value === '' || /^\+?[0-9 ]+$/.test(value) && /\d/.test(value),
    'Chỉ nhập chữ số, khoảng trắng và tối đa một dấu + ở đầu',
  ),
  menu: z.array(menuItemSchema).max(MENU_LIMIT, `Tối đa ${MENU_LIMIT} món`),
  reviews: z.array(reviewSchema).max(REVIEW_LIMIT, `Tối đa ${REVIEW_LIMIT} đánh giá`),
  gallery: z.array(galleryItemSchema).max(GALLERY_LIMIT, `Tối đa ${GALLERY_LIMIT} ảnh phụ`),
}).superRefine((form, ctx) => {
  duplicateErrors(form.suggestedPlaces, 'suggestedPlaces', ctx);
  duplicateErrors(form.menu, 'menu', ctx);
  duplicateErrors(form.reviews, 'reviews', ctx);
  const mediaIds = new Set<string>();
  form.gallery.forEach((image, i) => {
    if (image.mediaId === form.mediaId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gallery', i, 'mediaId'], message: 'Ảnh phụ không được trùng ảnh chính' });
    }
    if (mediaIds.has(image.mediaId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['gallery', i, 'mediaId'], message: 'Ảnh phụ bị trùng' });
    }
    mediaIds.add(image.mediaId);
  });
  if (form.isActive) {
    form.suggestedPlaces.forEach((place, index) => {
      if (!place.address.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['suggestedPlaces', index, 'address'], message: 'Cần địa chỉ trước khi bật hiển thị' });
      }
      if (!isValidCuisineMapsUrl(place.googleMapsUrl)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['suggestedPlaces', index, 'googleMapsUrl'], message: 'Cần link Google Maps hợp lệ trước khi bật hiển thị' });
      }
    });
  }
});

export type CuisineFormValues = z.infer<typeof cuisineFormSchema>;
export type CuisineSuggestedPlaceFormValue = CuisineFormValues['suggestedPlaces'][number];
export type CuisineMenuFormValue = CuisineFormValues['menu'][number];
export type CuisineReviewFormValue = CuisineFormValues['reviews'][number];
export type CuisineGalleryFormValue = CuisineFormValues['gallery'][number];

export const EMPTY_CUISINE_FORM: CuisineFormValues = {
  name: '',
  category: 'Món nước',
  googleMapsUrl: '',
  priceRange: '',
  bestTime: '',
  sortOrder: 0,
  isActive: false,
  summary: '',
  imageUrl: null,
  mediaId: null,
  imageAlt: '',
  suggestedPlaces: [],
  descriptions: [{ text: '' }],
  highlights: [],
  tip: '',
  contactPhone: '',
  menu: [],
  reviews: [],
  gallery: [],
};

export function createEmptyCuisineSuggestedPlace(): CuisineSuggestedPlaceFormValue {
  return { id: '', name: '', address: '', googleMapsUrl: '' };
}
export function createEmptyCuisineMenuItem(): CuisineMenuFormValue {
  return { id: '', name: '', price: '', description: '' };
}
export function createEmptyCuisineReview(): CuisineReviewFormValue {
  return { id: '', reviewerName: '', rating: 5, feedback: '', adminResponse: '' };
}
export function createEmptyCuisineGalleryItem(): CuisineGalleryFormValue {
  return { mediaId: '', imageUrl: '' };
}

type UnknownRecord = Record<string, unknown>;
const obj = (value: unknown): UnknownRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
const asString = (value: unknown): string => typeof value === 'string' ? value : '';
const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function uniqueId(candidate: string, used: Set<string>, fallback: string): string {
  const base = (candidate || fallback).slice(0, 100);
  let result = base;
  let serial = 2;
  while (used.has(result)) result = `${base.slice(0, 90)}-${serial++}`;
  used.add(result);
  return result;
}

function normalizePlaces(item: UnknownRecord): CuisineSuggestedPlaceFormValue[] {
  // BE mới có `suggestedPlaceDetails`; BE cũ có `suggestedPlaces` mảng chuỗi.
  const input = Array.isArray(item.suggestedPlaceDetails)
    ? item.suggestedPlaceDetails
    : asArray(item.suggestedPlaces);
  const used = new Set<string>();
  return input.map((raw) => {
    const record = obj(raw);
    const name = typeof raw === 'string' ? raw : asString(record.name);
    const id = uniqueId(asString(record.id) || slugifyCuisinePart(name), used, 'dia-diem');
    return { id, name, address: asString(record.address), googleMapsUrl: asString(record.googleMapsUrl) };
  }).slice(0, PLACE_LIMIT);
}

function normalizeMenu(raw: unknown): CuisineMenuFormValue[] {
  const used = new Set<string>();
  return asArray(raw).map((value) => {
    const record = obj(value);
    const name = asString(record.name);
    return {
      id: uniqueId(asString(record.id) || `menu-${slugifyCuisinePart(name)}`, used, 'menu'),
      name,
      price: asString(record.price),
      description: asString(record.description),
    };
  }).slice(0, MENU_LIMIT);
}

function normalizeReviews(raw: unknown): CuisineReviewFormValue[] {
  const used = new Set<string>();
  return asArray(raw).map((value) => {
    const record = obj(value);
    const reviewerName = asString(record.reviewerName);
    return {
      id: uniqueId(asString(record.id) || `review-${slugifyCuisinePart(reviewerName)}`, used, 'review'),
      reviewerName,
      rating: asNumber(record.rating, 5),
      feedback: asString(record.feedback),
      adminResponse: asString(record.adminResponse),
    };
  }).slice(0, REVIEW_LIMIT);
}

function normalizeGallery(item: UnknownRecord): CuisineGalleryFormValue[] {
  const images = asArray(item.galleryImages).map(obj);
  const ids = asArray(item.galleryMediaIds).map(asString);
  const orderedIds = ids.length ? ids : images.map((image) => asString(image.mediaId));
  return orderedIds.filter(Boolean).slice(0, GALLERY_LIMIT).map((mediaId) => {
    const img = images.find((value) => asString(value.mediaId) === mediaId);
    return { mediaId, imageUrl: asString(img?.imageUrl) || asString(img?.thumbnailUrl) };
  });
}

/** Nhận unknown để có thể dùng với kiểu CuisineItem hiện tại mà không cần ép any. */
export function cuisineToForm(raw: unknown): CuisineFormValues {
  const item = obj(raw);
  const descriptions = asArray(item.description).map(asString).map((text) => ({ text }));
  const highlights = asArray(item.highlights).map(asString).map((text) => ({ text }));
  const category = asString(item.category);
  return {
    ...EMPTY_CUISINE_FORM,
    name: asString(item.name),
    category: CUISINE_CATEGORY_VALUES.find((value) => value === category) ?? 'Món nước',
    googleMapsUrl: asString(item.googleMapsUrl),
    priceRange: asString(item.priceRange),
    bestTime: asString(item.bestTime),
    sortOrder: asNumber(item.sortOrder),
    isActive: item.isActive === true,
    summary: asString(item.summary),
    imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : null,
    mediaId: typeof item.mediaId === 'string' ? item.mediaId : null,
    imageAlt: asString(item.imageAlt),
    suggestedPlaces: normalizePlaces(item),
    descriptions: descriptions.length ? descriptions : [{ text: '' }],
    highlights,
    tip: asString(item.tip),
    contactPhone: asString(item.contactPhone),
    menu: normalizeMenu(item.menu),
    reviews: normalizeReviews(item.reviews),
    gallery: normalizeGallery(item),
  };
}

/**
 * Tạo đúng request của /api/v1/admin/cuisine.
 * Không gửi averageRating, reviewCount, imageUrl hay galleryImages vì BE tự tính.
 */
export function formToCuisinePayload(form: CuisineFormValues) {
  const suggestedPlaceDetails = form.suggestedPlaces.map(({ id, name, address, googleMapsUrl }) => ({
    id, name, address, googleMapsUrl,
  }));
  return {
    name: form.name,
    category: form.category,
    googleMapsUrl: form.googleMapsUrl,
    priceRange: form.priceRange,
    bestTime: form.bestTime,
    sortOrder: form.sortOrder,
    isActive: form.isActive,
    summary: form.summary,
    description: form.descriptions.map((row) => row.text),
    highlights: form.highlights.map((row) => row.text),
    tip: form.tip,
    contactPhone: form.contactPhone,
    suggestedPlaceDetails,
    // Field cũ chỉ để client/type API cũ không lỗi; backend ưu tiên Details ở trên.
    suggestedPlaces: suggestedPlaceDetails.map((place) => place.name),
    menu: form.menu.map(({ id, name, price, description }) => ({ id, name, price, description })),
    reviews: form.reviews.map(({ id, reviewerName, rating, feedback, adminResponse }) => ({ id, reviewerName, rating, feedback, adminResponse })),
    mediaId: form.mediaId,
    galleryMediaIds: form.gallery.map((image) => image.mediaId),
    imageAlt: form.imageAlt,
  };
}
