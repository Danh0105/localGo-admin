import { z } from 'zod';

/** Chỉ chấp nhận HTTPS URL dẫn tới Google Maps. Để trống khi chưa có link. */
export function isGoogleMapsUrl(value: string): boolean {
    if (!value) return true;
    try {
        const url = new URL(value);
        if (url.protocol !== 'https:') return false;
        const host = url.hostname.toLowerCase();
        return (
            host === 'maps.app.goo.gl' ||
            (host === 'goo.gl' && url.pathname.startsWith('/maps/')) ||
            host === 'maps.google.com' ||
            (['google.com', 'www.google.com'].includes(host) &&
                (url.pathname === '/maps' || url.pathname.startsWith('/maps/')))
        );
    } catch {
        return false;
    }
}

export const buyPlaceSchema = z.object({
    id: z.string().trim().min(1, 'Vui lòng nhập ID địa điểm')
        .max(150, 'ID tối đa 150 ký tự')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ID chỉ gồm chữ thường, số và dấu gạch ngang'),
    name: z.string().trim().min(1, 'Vui lòng nhập tên địa điểm').max(200, 'Tối đa 200 ký tự'),
    address: z.string().trim().min(1, 'Vui lòng nhập địa chỉ').max(500, 'Tối đa 500 ký tự'),
    googleMapsUrl: z.string().trim().max(2048, 'Liên kết tối đa 2048 ký tự')
        .refine(isGoogleMapsUrl, 'Liên kết phải là URL HTTPS Google Maps hợp lệ'),
    phone: z.string().trim().max(30, 'Tối đa 30 ký tự')
        .refine((value) => !value || /^[+()\d\s.-]+$/.test(value), 'Số điện thoại không hợp lệ'),
    email: z.string().trim().max(254, 'Tối đa 254 ký tự')
        .refine((value) => !value || z.string().email().safeParse(value).success, 'Email không hợp lệ'),
});

export type BuyPlace = z.infer<typeof buyPlaceSchema>;

/** Mỗi đặc sản tối đa 20 địa điểm; ID phải duy nhất. */
export const buyPlacesSchema = z.array(buyPlaceSchema)
    .max(20, 'Tối đa 20 địa điểm')
    .superRefine((places, ctx) => {
        const ids = new Set<string>();
        places.forEach((place, index) => {
            if (place.id && ids.has(place.id)) {
                ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'ID đã được một địa điểm khác sử dụng' });
            }
            ids.add(place.id);
        });
    });

function slugify(value: string): string {
    return value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, (letter) => (letter === 'đ' ? 'd' : 'D'))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function str(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

/**
 * Hỗ trợ dữ liệu cũ: ["Chợ Truông Mít"] hoặc [{ text: "Chợ Truông Mít" }].
 * Các thông tin không có trong dữ liệu cũ được để trống, không tự bịa.
 */
export function normalizeBuyPlaces(input: unknown): BuyPlace[] {
    if (!Array.isArray(input)) return [];
    const used = new Set<string>();

    return input.map((item, index): BuyPlace => {
        const record: Record<string, unknown> = item && typeof item === 'object' && !Array.isArray(item)
            ? (item as Record<string, unknown>) : {};
        const name = (typeof item === 'string' ? item : str(record.name) || str(record.text)).trim();
        const rawId = str(record.id).trim();
        const baseId = slugify(rawId || name) || `dia-diem-${index + 1}`;
        let id = baseId;
        let counter = 2;
        while (used.has(id)) id = `${baseId}-${counter++}`;
        used.add(id);

        return {
            id,
            name,
            address: str(record.address),
            googleMapsUrl: str(record.googleMapsUrl),
            phone: str(record.phone),
            email: str(record.email),
        };
    });
}

export function buyPlacesToPayload(places: BuyPlace[]): BuyPlace[] {
    return places.map(({ id, name, address, googleMapsUrl, phone, email }) => ({
        id: id.trim(),
        name: name.trim(),
        address: address.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        phone: phone.trim(),
        email: email.trim(),
    }));
}
