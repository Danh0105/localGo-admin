# Prompt triển khai Backend theo LocalGo Admin FE

Bạn đang làm việc trong backend NestJS + Prisma tại `F:\LocalGo-BE`.

Hãy triển khai backend thật để tương thích hoàn toàn với frontend Admin tại `F:\LocalGo-Admin`. Không chỉnh frontend, không dùng mock data ở backend và không đổi tên endpoint/payload đã được frontend sử dụng.

## Mục tiêu

Triển khai ba nhóm chức năng:

1. Quản trị người dùng: danh sách, tìm kiếm, lọc, khóa/mở khóa.
2. Đăng ký BUSINESS: hồ sơ cá nhân hoặc doanh nghiệp, admin duyệt/từ chối và tạo tài khoản `BUSINESS`.
3. Trả thông tin người đăng trong API kiểm duyệt tin giao thương.

Trước khi sửa, hãy đọc conventions hiện có của dự án, đặc biệt các module `auth`, `users`, `trade`, `admin`, `audit-log`, response interceptor, exception filter, RBAC guard và Prisma repository. Tái sử dụng đúng kiến trúc controller/service/repository/DTO/entity đang có.

## 1. Chuẩn response bắt buộc

Giữ envelope hiện tại:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error phải theo chuẩn hiện tại:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Thông báo tiếng Việt"
  },
  "requestId": "..."
}
```

Query và response dùng `camelCase`. Ngày giờ trả ISO-8601 UTC.

## 2. Quản trị người dùng

### `GET /api/v1/admin/users`

Chỉ `ADMIN` và `MODERATOR` được truy cập.

Query:

- `page`: integer, mặc định 1.
- `limit`: integer, mặc định 20, tối đa 100.
- `role?`: `USER | BUSINESS | MODERATOR | ADMIN`.
- `status?`: `ACTIVE | BLOCKED | PENDING`.
- `search?`: tìm không phân biệt hoa thường theo `displayName`, `email`, `phone`.

Sort mặc định `createdAt desc`. Response item phải khớp:

```json
{
  "id": "uuid",
  "zaloId": null,
  "phone": "0901234567",
  "email": "user@example.com",
  "displayName": "Nguyễn Văn A",
  "avatarUrl": null,
  "role": "USER",
  "status": "ACTIVE",
  "lastLoginAt": null,
  "createdAt": "2026-07-14T00:00:00.000Z",
  "updatedAt": "2026-07-14T00:00:00.000Z"
}
```

Không trả `passwordHash`, session hoặc dữ liệu nhạy cảm.

### `PATCH /api/v1/admin/users/:id/status`

Body:

```json
{ "status": "ACTIVE" }
```

Chỉ cho phép `ACTIVE` hoặc `BLOCKED`.

Yêu cầu nghiệp vụ:

- Không cho admin tự khóa chính mình.
- `MODERATOR` không được khóa/mở khóa tài khoản `ADMIN`.
- Khi chuyển sang `BLOCKED`, revoke toàn bộ refresh session còn hiệu lực của user trong cùng transaction với cập nhật trạng thái.
- Ghi audit log gồm actor, user đích, trạng thái cũ/mới; không ghi dữ liệu nhạy cảm.
- Trả user sau cập nhật theo shape phía trên.

Error code tối thiểu:

- `USER_NOT_FOUND`: 404.
- `CANNOT_UPDATE_SELF_STATUS`: 400.
- `INSUFFICIENT_PERMISSION`: 403.
- `INVALID_USER_STATUS`: 400.

## 3. Hồ sơ đăng ký BUSINESS

### Prisma schema

Thêm enum và model phù hợp với contract dưới đây. Tạo migration thật, không chỉ chạy `db push`.

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
  reviewedById        String?
  reviewedAt          DateTime?
  createdUserId       String?                    @unique
  createdAt           DateTime                   @default(now())
  updatedAt           DateTime                   @updatedAt

  submittedBy User? @relation("BusinessApplicationSubmitter", fields: [submittedById], references: [id])
  reviewedBy  User? @relation("BusinessApplicationReviewer", fields: [reviewedById], references: [id])
  createdUser User? @relation("BusinessApplicationAccount", fields: [createdUserId], references: [id])
  documents   BusinessApplicationDocument[]

  @@index([status, createdAt])
  @@index([applicantType])
  @@index([contactEmail])
  @@index([taxCode])
}

model BusinessApplicationDocument {
  id            String                      @id @default(uuid())
  applicationId String
  type          BusinessDocumentType
  name          String
  mediaId       String
  createdAt     DateTime                    @default(now())

  application BusinessApplication @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  media       Media               @relation(fields: [mediaId], references: [id], onDelete: Restrict)

  @@index([applicationId])
}
```

Thêm relation ngược cần thiết vào `User` và `Media`. Nếu tên relation cần điều chỉnh để phù hợp schema hiện tại, có thể điều chỉnh nhưng không thay đổi response API.

### API phía người dùng

#### `POST /api/v1/business-applications`

Người dùng đăng nhập nộp hồ sơ. Body:

```json
{
  "applicantType": "INDIVIDUAL",
  "businessName": "Bánh tráng cô Sáu",
  "businessCategory": "Ẩm thực địa phương",
  "contactName": "Trần Thị Sáu",
  "contactPhone": "0977123456",
  "contactEmail": "cosau@example.com",
  "address": "Tây Ninh",
  "identityNumber": "072190012345",
  "identityIssuedAt": "2021-09-16",
  "identityIssuedPlace": "Cục Cảnh sát QLHC về TTXH",
  "legalName": null,
  "taxCode": null,
  "representativeName": null,
  "representativeTitle": null,
  "website": null,
  "description": "Mô tả",
  "documents": [
    { "mediaId": "uuid", "type": "IDENTITY_FRONT", "name": "cccd-truoc.jpg" },
    { "mediaId": "uuid", "type": "IDENTITY_BACK", "name": "cccd-sau.jpg" }
  ]
}
```

Validation theo loại hồ sơ:

- `INDIVIDUAL`: bắt buộc `identityNumber`, `identityIssuedAt`, `identityIssuedPlace`, một tài liệu `IDENTITY_FRONT` và một tài liệu `IDENTITY_BACK`.
- `ORGANIZATION`: bắt buộc `legalName`, `taxCode`, `representativeName`, `representativeTitle`, ít nhất một tài liệu `BUSINESS_LICENSE`.
- Cả hai: bắt buộc `businessName`, `businessCategory`, `contactName`, số điện thoại Việt Nam hợp lệ, email hợp lệ và `address`.
- Media phải thuộc người nộp, chưa bị xóa và có resource type phù hợp.
- Một user không được có nhiều hồ sơ `PENDING` cùng lúc.

#### `GET /api/v1/business-applications/me`

Trả hồ sơ mới nhất của user hiện tại, bao gồm documents.

#### `PATCH /api/v1/business-applications/:id`

Chỉ chủ hồ sơ được sửa và chỉ khi hồ sơ là `REJECTED`. Khi gửi lại:

- validate lại toàn bộ;
- chuyển trạng thái thành `PENDING`;
- xóa `rejectionReason`, `reviewedById`, `reviewedAt`;
- ghi audit log hoặc lịch sử thay đổi phù hợp.

### API Admin

#### `GET /api/v1/admin/business-applications`

Chỉ `ADMIN` và `MODERATOR`.

Query:

- `page`, `limit`.
- `status?`: `PENDING | APPROVED | REJECTED`.
- `applicantType?`: `INDIVIDUAL | ORGANIZATION`.
- `search?`: tìm theo `businessName`, `contactName`, `contactEmail`, `contactPhone`, `taxCode`.

Sort `createdAt desc`. Response item phải có đủ key, các trường không áp dụng trả `null`, `documents` luôn là mảng:

```json
{
  "id": "uuid",
  "applicantType": "ORGANIZATION",
  "businessName": "Công ty ABC",
  "businessCategory": "Du lịch",
  "contactName": "Nguyễn Văn A",
  "contactPhone": "0901234567",
  "contactEmail": "contact@abc.vn",
  "address": "Tây Ninh",
  "identityNumber": null,
  "identityIssuedAt": null,
  "identityIssuedPlace": null,
  "legalName": "CÔNG TY TNHH ABC",
  "taxCode": "3901234567",
  "representativeName": "Nguyễn Văn A",
  "representativeTitle": "Giám đốc",
  "website": "https://abc.vn",
  "description": null,
  "documents": [
    {
      "id": "uuid",
      "name": "giay-phep.pdf",
      "type": "BUSINESS_LICENSE",
      "url": "signed-url",
      "mimeType": "application/pdf"
    }
  ],
  "status": "PENDING",
  "rejectionReason": null,
  "reviewedByName": null,
  "reviewedAt": null,
  "createdUserId": null,
  "createdAt": "2026-07-14T00:00:00.000Z",
  "updatedAt": "2026-07-14T00:00:00.000Z"
}
```

`documents[].url` phải là signed URL thời hạn ngắn, chỉ admin được lấy. Không dùng public URL cho CCCD hoặc giấy phép.

#### `POST /api/v1/admin/business-applications/:id/approve`

Body FE đang gửi chính xác:

```json
{
  "displayName": "Công ty ABC",
  "email": "business@abc.vn",
  "initialPassword": "temporary-password"
}
```

Thực hiện trong một database transaction:

1. Lock hoặc conditional update để xác nhận hồ sơ vẫn `PENDING`.
2. Kiểm tra email chưa tồn tại, normalize email về lowercase.
3. Hash `initialPassword` bằng cùng cơ chế auth hiện có; tuyệt đối không log mật khẩu thô.
4. Tạo `User`: `role=BUSINESS`, `status=ACTIVE`, lấy phone từ hồ sơ nếu chưa trùng.
5. Chuyển hồ sơ sang `APPROVED`; gán `reviewedById`, `reviewedAt`, `createdUserId`.
6. Ghi audit log `BUSINESS_APPLICATION_APPROVED`.
7. Trả hồ sơ đã cập nhật theo shape danh sách Admin.

Error:

- `APPLICATION_NOT_FOUND`: 404.
- `APPLICATION_ALREADY_REVIEWED`: 409.
- `EMAIL_ALREADY_EXISTS`: 409.
- `PHONE_ALREADY_EXISTS`: 409 nếu phone bắt buộc unique và đã tồn tại.

#### `POST /api/v1/admin/business-applications/:id/reject`

Body:

```json
{ "reason": "Vui lòng bổ sung giấy phép kinh doanh hợp lệ." }
```

`reason` từ 10 đến 500 ký tự. Chỉ xử lý hồ sơ `PENDING`. Gán `REJECTED`, `rejectionReason`, `reviewedById`, `reviewedAt` và ghi audit log `BUSINESS_APPLICATION_REJECTED`.

## 4. Thông tin người đăng tin giao thương

Frontend cần phân biệt:

- `owner`: tài khoản sở hữu bài đăng.
- `contactName`, `contactPhone`, `contactZalo`: thông tin liên hệ do chủ tin nhập.

Cập nhật hai endpoint Admin hiện có:

- `GET /api/v1/admin/trade-posts`.
- `GET /api/v1/admin/trade-posts/:id`.

Ngoài các trường hiện tại, trả thêm `owner`:

```json
{
  "ownerId": "uuid",
  "owner": {
    "id": "uuid",
    "displayName": "Nông sản Tây Ninh Farm",
    "email": "contact@example.com",
    "phone": "0901234567",
    "avatarUrl": null,
    "role": "BUSINESS",
    "status": "ACTIVE"
  }
}
```

Yêu cầu:

- Chỉ mở rộng endpoint Admin, không bắt buộc thay đổi API public.
- Query bằng Prisma relation/include/select hoặc batch join; không N+1 theo từng bài đăng.
- Không trả `passwordHash`, session hoặc dữ liệu định danh trong hồ sơ BUSINESS.
- Bổ sung Swagger DTO/type đầy đủ.

## 5. Bảo mật hồ sơ

- Dữ liệu CCCD và tài liệu pháp lý là dữ liệu nhạy cảm; mã hóa ở tầng lưu trữ nếu hạ tầng hiện tại hỗ trợ.
- Không public media chứa CCCD/giấy phép.
- Signed URL có thời gian sống ngắn và chỉ sinh sau khi xác thực quyền Admin/Moderator.
- Validate MIME, extension, kích thước, checksum; chặn executable/script và file không thuộc người nộp.
- Rate limit API nộp/cập nhật hồ sơ.
- Che bớt identity number trong log, audit và error.
- Không ghi `initialPassword` hoặc `passwordHash` vào log/audit/response.

## 6. Tests bắt buộc

Viết unit test và e2e test tối thiểu cho:

1. Admin list users với pagination/filter/search.
2. Moderator không thể khóa Admin.
3. Block user cập nhật status và revoke sessions.
4. Validate hồ sơ `INDIVIDUAL` thiếu CCCD.
5. Validate hồ sơ `ORGANIZATION` thiếu giấy phép/mã số thuế.
6. User không sửa được hồ sơ của người khác.
7. Approve tạo đúng một user `BUSINESS` và liên kết `createdUserId`.
8. Hai request approve đồng thời chỉ một request thành công, không tạo hai user.
9. Reject bắt buộc reason hợp lệ.
10. API Admin trade posts trả `owner` nhưng không lộ dữ liệu nhạy cảm.

## 7. Hoàn tất và bàn giao

Sau khi triển khai:

1. Chạy Prisma format/generate và migration theo script của dự án.
2. Chạy lint, typecheck/build, unit test và e2e test liên quan.
3. Cập nhật Swagger/OpenAPI và README endpoint.
4. Báo cáo danh sách file đã sửa, migration đã tạo, command kiểm tra và kết quả.
5. Nếu gặp điểm chưa rõ, ưu tiên khớp type frontend tại:
   - `F:\LocalGo-Admin\src\types\user.ts`
   - `F:\LocalGo-Admin\src\types\business-application.ts`
   - `F:\LocalGo-Admin\src\types\trade-post.ts`
   - `F:\LocalGo-Admin\src\api\users.ts`
   - `F:\LocalGo-Admin\src\api\trade-posts.ts`

Không kết thúc ở bước phân tích. Hãy triển khai migration, code, test và xác minh đầy đủ trong backend.
