# Prompt triển khai API Backend quản lý Người dùng và Business

Bạn là Senior Backend Engineer, làm việc trực tiếp trong repository `F:\LocalGo-BE` của hệ thống LocalGo.

Hãy rà soát, hoàn thiện và kiểm thử các API phục vụ màn hình **Quản lý người dùng** và **Quản lý hồ sơ Business** của LocalGo Admin. Backend hiện đã có module `users` và `business-applications`; phải ưu tiên sửa và hoàn thiện kiến trúc hiện tại, không tạo module/controller/service song song và không thay đổi contract frontend nếu không thật sự cần thiết.

## 1. Nguồn sự thật cần đọc trước khi sửa

Backend:

- `src/modules/users/**`
- `src/modules/business-applications/**`
- `src/common/interceptors/response.interceptor.ts`
- `src/common/constants/error-codes.constant.ts`
- Prisma schema, migration và các model liên quan đến User, AuthSession, BusinessApplication, BusinessApplicationDocument, AuditLog.

Admin frontend để đối chiếu contract:

- `F:\LocalGo-Admin\src/api/users.ts`
- `F:\LocalGo-Admin\src/types/user.ts`
- `F:\LocalGo-Admin\src/types/business-application.ts`
- `F:\LocalGo-Admin\src/pages/users/UsersPage.tsx`

Không suy đoán tên field hoặc trạng thái. Nếu code backend hiện tại khác frontend, hãy xác định rõ nguyên nhân và ưu tiên giữ tương thích với contract đang được Admin sử dụng.

## 2. Phạm vi chức năng

### 2.1. Quản lý người dùng

Hoàn thiện các API:

```http
GET /api/v1/admin/users
PATCH /api/v1/admin/users/:id/status
```

#### Danh sách người dùng

`GET /api/v1/admin/users` nhận query:

```ts
{
  page: number;       // >= 1
  limit: number;      // giới hạn hợp lý theo chuẩn dự án
  role?: 'USER' | 'BUSINESS' | 'MODERATOR' | 'ADMIN';
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  search?: string;
}
```

Yêu cầu:

- Tìm kiếm không phân biệt hoa thường theo `displayName`, `email`, `phone`.
- Trim `search`; chuỗi rỗng phải được xem như không có bộ lọc.
- Cho phép kết hợp đồng thời `search`, `role`, `status` và phân trang.
- Sắp xếp ổn định, ưu tiên bản ghi mới nhất trước; thêm khóa phụ theo `id` nếu cần để tránh trùng hoặc thiếu dòng giữa các trang.
- Không trả về `passwordHash`, refresh token, session token hoặc dữ liệu bảo mật nội bộ.
- Mỗi phần tử phải đúng contract `CurrentUser`:

```ts
{
  id: string;
  zaloId: string | null;
  phone: string | null;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  role: 'USER' | 'BUSINESS' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Khóa hoặc mở khóa tài khoản

`PATCH /api/v1/admin/users/:id/status`

Body:

```json
{
  "status": "BLOCKED"
}
```

Chỉ chấp nhận `ACTIVE` hoặc `BLOCKED` cho thao tác quản trị này. Dùng enum validation ngay tại DTO, không chỉ kiểm tra thủ công trong service.

Quy tắc nghiệp vụ:

- Không cho phép quản trị viên tự khóa/mở khóa chính tài khoản đang đăng nhập.
- `MODERATOR` không được thay đổi trạng thái tài khoản `ADMIN`.
- Khi chuyển sang `BLOCKED`, phải thu hồi toàn bộ phiên đăng nhập/refresh token còn hiệu lực trong cùng transaction.
- Khi mở khóa, không phục hồi phiên cũ; người dùng phải đăng nhập lại.
- Ghi audit log gồm người thao tác, người bị tác động, trạng thái cũ, trạng thái mới và thời điểm.
- Trả về đối tượng người dùng sau khi cập nhật, đúng contract ở trên.

### 2.2. Quản lý hồ sơ đăng ký Business

Hoàn thiện các API:

```http
GET  /api/v1/admin/business-applications
POST /api/v1/admin/business-applications/:id/approve
POST /api/v1/admin/business-applications/:id/reject
```

#### Danh sách hồ sơ

`GET /api/v1/admin/business-applications` nhận query:

```ts
{
  page: number;
  limit: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  applicantType?: 'INDIVIDUAL' | 'ORGANIZATION';
  search?: string;
}
```

Yêu cầu:

- Tìm kiếm không phân biệt hoa thường theo `businessName`, `contactName`, `contactEmail`, `contactPhone`, `taxCode` nếu có.
- Hỗ trợ kết hợp đầy đủ bộ lọc và phân trang.
- Trả hồ sơ mới nhất trước với thứ tự ổn định.
- Response mỗi hồ sơ phải có đầy đủ dữ liệu để Admin mở drawer chi tiết mà không cần gọi thêm API:

```ts
{
  id: string;
  applicantType: 'INDIVIDUAL' | 'ORGANIZATION';
  businessName: string;
  businessCategory: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  identityNumber: string | null;
  identityIssuedAt: string | null;
  identityIssuedPlace: string | null;
  legalName: string | null;
  taxCode: string | null;
  representativeName: string | null;
  representativeTitle: string | null;
  website: string | null;
  description: string | null;
  documents: Array<{
    id: string;
    name: string;
    type: 'IDENTITY_FRONT' | 'IDENTITY_BACK' | 'BUSINESS_LICENSE' | 'TAX_DOCUMENT' | 'OTHER';
    url: string;
    mimeType: string;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

URL tài liệu phải là URL ký có thời hạn ngắn hoặc cơ chế truy cập bảo vệ tương đương. Không trả đường dẫn file vật lý, storage key nội bộ hoặc URL công khai vĩnh viễn. Kiểm tra MIME type và tên file an toàn khi tải xuống.

#### Duyệt hồ sơ và tạo tài khoản Business

`POST /api/v1/admin/business-applications/:id/approve`

Body:

```ts
{
  displayName: string;      // trim, không rỗng
  email: string;            // email hợp lệ, normalize lowercase
  initialPassword: string;  // từ 8 đến 128 ký tự
}
```

Toàn bộ thao tác duyệt phải nguyên tử trong một transaction:

1. Khóa/claim hồ sơ theo điều kiện `status = PENDING` để chống hai admin duyệt đồng thời.
2. Kiểm tra email và số điện thoại không trùng tài khoản hiện có.
3. Hash `initialPassword` bằng Argon2 theo cấu hình của dự án; tuyệt đối không lưu, log hoặc trả lại mật khẩu thô.
4. Tạo tài khoản có `role = BUSINESS`, `status = ACTIVE`.
5. Dùng số điện thoại từ hồ sơ đăng ký cho tài khoản Business theo contract hiện tại.
6. Cập nhật hồ sơ thành `APPROVED`, lưu `reviewedBy`, `reviewedAt`, `createdUserId` và xóa `rejectionReason` nếu schema cho phép.
7. Ghi audit log đủ dữ liệu truy vết.

Nếu bất kỳ bước nào thất bại, phải rollback toàn bộ: không được tạo tài khoản mồ côi hoặc để hồ sơ đã duyệt nhưng chưa có tài khoản.

Khi có hai request duyệt cùng lúc, chỉ một request được thành công; request còn lại trả conflict nghiệp vụ rõ ràng. Không dựa duy nhất vào thao tác `find` rồi `update` không điều kiện.

Response trả hồ sơ đã cập nhật theo contract `BusinessApplication`, không trả password hash hoặc mật khẩu ban đầu.

#### Từ chối hồ sơ

`POST /api/v1/admin/business-applications/:id/reject`

Body:

```ts
{
  reason: string; // trim, từ 10 đến 500 ký tự
}
```

Quy tắc:

- Chỉ hồ sơ `PENDING` mới được từ chối.
- Cập nhật nguyên tử thành `REJECTED`, lưu lý do, người duyệt và thời điểm duyệt.
- Không tạo tài khoản Business.
- Ghi audit log.
- Trả hồ sơ sau cập nhật.

## 3. Phân quyền và bảo mật

- Tất cả endpoint `/admin/users` và `/admin/business-applications` yêu cầu JWT hợp lệ.
- Chỉ `ADMIN` và `MODERATOR` được truy cập.
- Giữ quy tắc `MODERATOR` không được tác động tới tài khoản `ADMIN`.
- Không tin `reviewedBy`, `createdUserId`, role hoặc status do client tự gửi; lấy người thao tác từ JWT và gán các giá trị hệ thống ở backend.
- Không ghi PII nhạy cảm, token, password hoặc nội dung giấy tờ tùy thân vào application log.
- Áp dụng validation pipe, DTO và Swagger decorators nhất quán với dự án.

## 4. Chuẩn response và lỗi để Admin hiển thị rõ ràng

Giữ envelope hiện tại:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 36,
    "totalPages": 2
  }
}
```

`meta` chỉ có ở response phân trang. Ngày giờ trả theo ISO 8601.

Mọi lỗi phải đi qua exception filter chuẩn của dự án và có cấu trúc nhất quán, tối thiểu gồm `success: false`, `error.code`, `error.message`; lỗi validation nên có thêm chi tiết theo field để frontend gắn lỗi đúng ô nhập.

Sử dụng đúng HTTP status và error code:

| Trường hợp | HTTP | Error code |
|---|---:|---|
| DTO/query/body không hợp lệ | 400 | `VALIDATION_ERROR` |
| Chưa đăng nhập hoặc token hết hạn | 401 | `UNAUTHORIZED` |
| Không đủ quyền | 403 | `FORBIDDEN` hoặc `INSUFFICIENT_PERMISSION` theo chuẩn hiện tại |
| Không tìm thấy người dùng | 404 | `USER_NOT_FOUND` |
| Không tìm thấy hồ sơ | 404 | `APPLICATION_NOT_FOUND` |
| Tự đổi trạng thái chính mình | 409 | `CANNOT_UPDATE_SELF_STATUS` |
| Trạng thái người dùng không hợp lệ | 400 | `INVALID_USER_STATUS` |
| Hồ sơ đã được duyệt/từ chối | 409 | `APPLICATION_ALREADY_REVIEWED` |
| Email đã tồn tại | 409 | `EMAIL_ALREADY_EXISTS` |
| Số điện thoại đã tồn tại | 409 | `PHONE_ALREADY_EXISTS` |
| Lỗi ngoài dự kiến | 500 | `INTERNAL_ERROR` |

Thông báo lỗi phải bằng tiếng Việt, rõ hành động admin cần thực hiện, không trả stack trace hoặc thông tin database. Ví dụ:

- `EMAIL_ALREADY_EXISTS`: “Email này đã được sử dụng. Vui lòng nhập email khác.”
- `APPLICATION_ALREADY_REVIEWED`: “Hồ sơ đã được xử lý bởi quản trị viên khác. Vui lòng tải lại danh sách.”
- `CANNOT_UPDATE_SELF_STATUS`: “Bạn không thể thay đổi trạng thái tài khoản đang đăng nhập.”
- `PHONE_ALREADY_EXISTS`: “Số điện thoại trong hồ sơ đã thuộc về một tài khoản khác.”

Không biến lỗi xác thực, phân quyền hoặc conflict thành `400 Bad Request` chung chung.

## 5. Database và tính nhất quán

- Tận dụng model/index/unique constraint hiện có; chỉ tạo migration nếu schema thật sự thiếu.
- Các cột dùng để lọc, sắp xếp và kiểm tra unique cần có index phù hợp.
- Không dùng migration để xóa hoặc làm mất dữ liệu hiện có.
- Transaction duyệt hồ sơ phải an toàn trước concurrent request và unique constraint race.
- Mapping Prisma entity sang response DTO phải loại bỏ trường nội bộ và giữ giá trị `null` đúng contract, không đổi tùy tiện thành chuỗi rỗng.

## 6. Kiểm thử bắt buộc

Bổ sung hoặc cập nhật unit/integration/e2e test cho tối thiểu các trường hợp:

1. Danh sách user phân trang và kết hợp search/role/status.
2. Danh sách hồ sơ Business phân trang và kết hợp search/status/applicantType.
3. `ADMIN` khóa/mở khóa user thành công.
4. Khóa user thu hồi phiên đăng nhập còn hiệu lực.
5. Không thể tự khóa tài khoản hiện tại.
6. `MODERATOR` không thể khóa `ADMIN`.
7. Duyệt hồ sơ thành công và tạo đúng một tài khoản `BUSINESS`.
8. Email hoặc phone trùng phải rollback toàn bộ transaction.
9. Hai request duyệt đồng thời chỉ tạo một user.
10. Không thể duyệt lại hoặc từ chối hồ sơ đã xử lý.
11. Lý do từ chối ngắn hơn 10 hoặc dài hơn 500 ký tự trả validation error theo field.
12. URL tài liệu hết hạn/chữ ký sai bị từ chối.
13. Response không rò rỉ password hash, token, storage key hoặc đường dẫn file vật lý.
14. Các endpoint trả đúng `401`, `403`, `404`, `409` và error code tương ứng.

## 7. Tiêu chí hoàn thành

- Không còn phụ thuộc mock data khi `VITE_USE_MOCK_DATA=false`.
- Năm endpoint Admin ở trên hoạt động đúng contract frontend.
- Không tạo API hoặc module trùng với code đã có.
- Swagger mô tả đủ query, body, response thành công và response lỗi.
- Các thao tác khóa/mở khóa, duyệt và từ chối đều có audit log.
- Duyệt hồ sơ an toàn transaction/concurrency.
- Admin nhận được thông báo lỗi cụ thể để hiển thị cho từng trường hợp.
- Code qua lint, unit test, e2e liên quan và build.

Chạy tối thiểu:

```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run test:e2e -- --runInBand
npm.cmd run build
```

## 8. Cách bàn giao

Sau khi hoàn tất, hãy báo cáo ngắn gọn:

1. File đã sửa hoặc tạo.
2. Contract endpoint cuối cùng.
3. Migration đã thêm, nếu có, và lý do.
4. Cách xử lý transaction/concurrency khi duyệt hồ sơ.
5. Danh sách error code/status đã chuẩn hóa.
6. Kết quả lint, test và build; nếu có lỗi tồn tại từ trước phải nêu rõ bằng chứng và tách khỏi thay đổi lần này.

