# Backend contract: đăng ký và kiểm duyệt BUSINESS

Frontend Admin đã tích hợp các endpoint dưới đây. Backend LocalGo hiện chưa có model/API tương ứng.

## 1. Luồng nghiệp vụ

1. Người dùng chọn loại hồ sơ `INDIVIDUAL` (cá nhân) hoặc `ORGANIZATION` (doanh nghiệp).
2. Người dùng điền thông tin và tải giấy tờ lên, sau đó nộp hồ sơ.
3. Hồ sơ mới có trạng thái `PENDING`. Người nộp không thể sửa khi đang được xét duyệt.
4. Admin xem thông tin, tài liệu và chọn:
   - `APPROVED`: backend tạo tài khoản `BUSINESS`, liên kết `createdUserId` và ghi người duyệt.
   - `REJECTED`: bắt buộc có lý do; người nộp có thể chỉnh sửa rồi nộp lại.
5. Khóa người dùng phải thu hồi tất cả refresh session đang hoạt động.

## 2. Prisma đề xuất

```prisma
enum BusinessApplicantType {
  INDIVIDUAL
  ORGANIZATION
}

enum BusinessApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum BusinessDocumentType {
  IDENTITY_FRONT
  IDENTITY_BACK
  BUSINESS_LICENSE
  TAX_DOCUMENT
  OTHER
}

model BusinessApplication {
  id                  String                    @id @default(uuid())
  applicantType       BusinessApplicantType
  businessName        String
  businessCategory    String
  contactName         String
  contactPhone        String
  contactEmail        String
  address             String
  identityNumber      String?
  identityIssuedAt    DateTime?
  identityIssuedPlace String?
  legalName           String?
  taxCode             String?
  representativeName  String?
  representativeTitle String?
  website             String?
  description         String?
  status              BusinessApplicationStatus @default(PENDING)
  rejectionReason     String?
  submittedById       String?
  submittedBy         User?                     @relation("BusinessApplicationSubmitter", fields: [submittedById], references: [id])
  reviewedById        String?
  reviewedBy          User?                     @relation("BusinessApplicationReviewer", fields: [reviewedById], references: [id])
  reviewedAt          DateTime?
  createdUserId       String?                   @unique
  createdUser         User?                     @relation("BusinessApplicationAccount", fields: [createdUserId], references: [id])
  documents           BusinessApplicationDocument[]
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt

  @@index([status, createdAt])
  @@index([applicantType])
  @@index([contactEmail])
  @@index([taxCode])
}

model BusinessApplicationDocument {
  id            String                 @id @default(uuid())
  applicationId String
  application   BusinessApplication    @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  type          BusinessDocumentType
  name          String
  mediaId       String
  media         Media                  @relation(fields: [mediaId], references: [id], onDelete: Restrict)
  createdAt     DateTime               @default(now())

  @@index([applicationId])
}
```

Thêm ba relation ngược vào `User`. Không lưu URL công khai dài hạn cho CCCD/giấy phép; response trả signed URL có thời hạn ngắn.

## 3. API phía người dùng

### `POST /business-applications`

Bearer token của người dùng thường hoặc phiên đăng ký phù hợp. Body dùng camelCase đúng theo type `BusinessApplication` phía frontend. Validate theo loại:

- `INDIVIDUAL`: bắt buộc `identityNumber`, `identityIssuedAt`, `identityIssuedPlace`, tài liệu `IDENTITY_FRONT`, `IDENTITY_BACK`.
- `ORGANIZATION`: bắt buộc `legalName`, `taxCode`, `representativeName`, `representativeTitle`, tài liệu `BUSINESS_LICENSE`.
- Cả hai loại: bắt buộc tên Business, lĩnh vực, người liên hệ, điện thoại, email và địa chỉ.

### `GET /business-applications/me`

Trả hồ sơ mới nhất của người dùng hiện tại.

### `PATCH /business-applications/:id`

Chỉ chủ hồ sơ và chỉ khi trạng thái là `REJECTED` hoặc bản nháp. Khi gửi lại, chuyển về `PENDING`, xóa lý do và thông tin lần duyệt trước.

## 4. API Admin

Tất cả endpoint yêu cầu role `ADMIN` hoặc `MODERATOR` và trả envelope chuẩn `{ success, data, meta? }`.

### `GET /admin/users`

Query: `page`, `limit`, `role?`, `status?`, `search?`. Search theo `displayName`, `email`, `phone`.

### `PATCH /admin/users/:id/status`

Body: `{ "status": "ACTIVE" | "BLOCKED" }`. Khi block phải revoke toàn bộ `AuthSession` trong cùng transaction.

### `GET /admin/business-applications`

Query: `page`, `limit`, `status?`, `applicantType?`, `search?`. Include `documents` và tên người duyệt. Sort mặc định `createdAt desc`.

### `POST /admin/business-applications/:id/approve`

```json
{
  "displayName": "Cửa hàng LocalGo",
  "email": "business@example.com",
  "initialPassword": "temporary-password"
}
```

Trong một database transaction có khóa/conditional update:

1. Xác nhận hồ sơ vẫn là `PENDING`.
2. Xác nhận email chưa tồn tại.
3. Hash `initialPassword`, không ghi mật khẩu thô vào log.
4. Tạo `User` với `role=BUSINESS`, `status=ACTIVE`.
5. Chuyển hồ sơ sang `APPROVED`, gán `reviewedById`, `reviewedAt`, `createdUserId`.
6. Ghi audit log `BUSINESS_APPLICATION_APPROVED`.

Nếu hồ sơ không còn `PENDING`, trả `409 APPLICATION_ALREADY_REVIEWED`. Nếu email tồn tại, trả `409 EMAIL_ALREADY_EXISTS`.

### `POST /admin/business-applications/:id/reject`

Body: `{ "reason": "..." }`, tối thiểu 10 và tối đa 500 ký tự. Chỉ chấp nhận hồ sơ `PENDING`; ghi audit log.

## 5. Shape hồ sơ trả về Admin

Phải khớp `src/types/business-application.ts`, đặc biệt:

- các trường không áp dụng cho loại hồ sơ là `null`, không bỏ key;
- `documents` luôn là mảng;
- `reviewedByName`, `reviewedAt`, `createdUserId` có thể `null`;
- URL tài liệu là signed URL chỉ cho Admin và có thời hạn ngắn;
- response danh sách có `meta: { page, limit, total, totalPages }`.

## 6. Bảo mật bắt buộc

- Mã hóa dữ liệu định danh nhạy cảm ở tầng lưu trữ và che bớt khi không cần hiển thị đầy đủ.
- Chỉ role kiểm duyệt được đọc tài liệu; không dùng public bucket cho CCCD/giấy phép.
- Không trả `passwordHash`; không ghi `initialPassword` vào audit log hoặc application log.
- Rate limit endpoint nộp hồ sơ, kiểm tra MIME/checksum/size file và quét file độc hại.
- Dùng conditional update hoặc row lock để thao tác approve/reject có tính idempotent, chống duyệt hai lần.
