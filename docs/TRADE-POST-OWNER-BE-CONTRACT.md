# Backend contract: thông tin người đăng trong tin giao thương

Admin cần phân biệt tài khoản sở hữu bài đăng (`owner`) với thông tin liên hệ do người đăng nhập trong nội dung (`contactName`, `contactPhone`, `contactZalo`).

Backend hiện chỉ trả `ownerId`. Cập nhật các response `GET /admin/trade-posts` và `GET /admin/trade-posts/:id` để trả thêm:

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

- Chỉ include dữ liệu này trong endpoint Admin, không mở rộng response public nếu không cần thiết.
- Không trả `passwordHash`, session hoặc dữ liệu định danh hồ sơ BUSINESS.
- Query bằng relation/include hoặc join theo danh sách; không gọi N+1 cho từng bài đăng.
- `owner` có thể vắng mặt tạm thời để frontend fallback về `ownerId`, nhưng dữ liệu chuẩn nên luôn có với bản ghi chưa bị xóa.
