# LocalGo Admin

Trang quản trị desktop (web app riêng biệt, không phải Zalo Mini App) để kiểm duyệt tin giao thương và đánh giá cho backend **LocalGo** (`F:\LocalGo-BE`).

## Công nghệ

React 19 + TypeScript + Vite, Ant Design v6 (UI), `@tanstack/react-query` v5 (server-state cache), `zustand` (auth store), `axios` (HTTP + interceptor tự refresh token), `react-hook-form` + `zod` (form/validate), `react-router-dom` v7 (routing).

## Cài đặt & chạy

```bash
npm install
cp .env.example .env   # API mặc định: https://api.localgo.skilltripx.com.vn/api/v1
npm run dev
```

Frontend gọi backend tại `VITE_API_BASE_URL` (mặc định `https://api.localgo.skilltripx.com.vn/api/v1`). Backend phải cấu hình `CORS_ORIGINS` bao gồm origin của trang admin; khi chạy frontend local, origin mặc định là `http://localhost:5173`.

Đăng nhập bằng tài khoản seed moderator/admin của backend (xem `F:\LocalGo-BE\README.md` mục 15) — trang admin **không hỗ trợ đăng nhập Zalo**, chỉ email/mật khẩu (`POST /auth/login`), vì đây là công cụ nội bộ cho nhân viên kiểm duyệt.

## Cấu trúc

```
src/
  api/         # axios instance + hàm gọi từng nhóm endpoint (auth, trade-posts, reviews, categories)
  store/       # zustand: phiên đăng nhập (accessToken trong bộ nhớ, refreshToken persist localStorage)
  routes/      # ProtectedRoute (guard RBAC ở FE) + hook bootstrap phiên khi tải lại trang
  components/layout/  # Sidebar + header dùng chung
  pages/       # login, trade-posts, reviews, categories
  types/       # type khớp 1:1 với response DTO của backend
```

## Phạm vi (Phase 1 — khớp với backend hiện có)

- Tin giao thương: danh sách + lọc (trạng thái/danh mục/tìm kiếm) + duyệt/từ chối/lưu trữ/nổi bật.
- Đánh giá: danh sách + lọc trạng thái + duyệt/ẩn.
- Danh mục: CRUD theo domain (hạ tầng cho các module nội dung sẽ xây ở phase sau — hiện `Category` chưa được module nào thực sự sử dụng, xem `docs/assumptions.md` của backend).

Chưa có (vì backend chưa có API): dashboard thống kê, quản lý user, audit log, feedback, favorites, search.

## Đã xác minh / chưa xác minh

**Đã chạy và xác nhận thật**: `npm run build` (exit 0), `npx tsc -b` (exit 0, không lỗi type), `npm run lint` (oxlint, exit 0), `npm run dev` khởi động thành công và phục vụ HTML/module qua HTTP 200 (kiểm tra bằng `curl`).

**Chưa xác minh được**: luồng UI thật trên trình duyệt (đăng nhập, thao tác bảng, mutation) — môi trường thực hiện việc này không có công cụ điều khiển trình duyệt. Backend cũng chưa chạy migration/seed thật (thiếu quyền PostgreSQL ở máy phát triển — xem `F:\LocalGo-BE\README.md` mục 22), nên **chưa thể test end-to-end với dữ liệu thật**. Cần người dùng tự mở `npm run dev`, đăng nhập, và thao tác thử trên trình duyệt sau khi backend có dữ liệu thật.
