# HỢP ĐỒNG API SPRINT 1 (API CONTRACT - NHÓM 13)

> Tài liệu này thống nhất cấu trúc **URL, Request JSON và Response JSON** giữa **Backend (Đạt & Hùng)** và **Frontend (`frontend/src/services/api.js`)** dựa trên Tài liệu Phân tích Thiết kế Phiên bản 6 và `Product_Backlog_1_1.xlsx`.
>
> **Quy ước chung:**
> - Giao tiếp REST/JSON qua prefix `/api`.
> - Xác thực: Frontend gửi header `Authorization: Bearer <token>` (lưu khi đăng nhập thành công).
> - Phân quyền (`R10`, `NFR-02`): Sai thông tin đăng nhập trả `401`; sai vai trò truy cập API trả `403`; dữ liệu/trạng thái không hợp lệ trả `400` hoặc `409` kèm `{ "detail": "Thông báo tiếng Việt rõ ràng" }`.

---

## 1. Các API Nền Tảng Đã Có Sẵn (`PB-01`–`PB-03`)

| Chức năng | Method & URL | Response mẫu |
| :--- | :--- | :--- |
| Kiểm tra hệ thống | `GET /api/health` | `{ "status": "healthy", "database": "connected", "journal_mode": "wal", "table_count": 12, "seed_users_count": 7 }` |
| Danh sách trạm | `GET /api/stations` | `[{ "id": "ST01", "name": "Trạm Nướng", "description": "..." }]` |
| Danh sách bàn (`A6`) | `GET /api/tables` | `[{ "table_no": "Bàn 01", "area": "Tầng 1 - Sảnh chính" }]` |
| Danh sách món (`PB-09`) | `GET /api/menu-items` | `[{ "id": 1, "name": "...", "default_station_id": "ST03", "station_name": "...", "price": 60000, "is_sold_out": false }]` |
| Danh sách user mẫu | `GET /api/users` | `[{ "id": 1, "username": "bep_truong", "full_name": "...", "role": "head_chef", "station_id": null, "station_name": null }]` |

---

## 2. Xác Thực & Phân Quyền (`PB-06`, `PB-08` — `AuthController`)

### `POST /api/auth/login` (`PB-06`)
- **Request**:
  ```json
  {
    "username": "waiter_01",
    "password": "123456"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "token": "jwt_or_session_token",
    "expires_in": 28800,
    "user": {
      "id": 6,
      "username": "waiter_01",
      "full_name": "Phạm Minh Tuấn (Phục Vụ)",
      "role": "waiter",
      "station_id": null,
      "station_name": null
    }
  }
  ```
- **Lỗi**:
  - Sai username hoặc password (`401`): `{ "detail": "Tên đăng nhập hoặc mật khẩu không chính xác." }` (không lộ user có tồn tại hay không).
  - Tài khoản `active = 0` (`403`): `{ "detail": "Tài khoản đã bị vô hiệu hóa." }`

### `POST /api/auth/logout` (`PB-08`)
- **Header**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `{ "message": "Đã đăng xuất thành công." }`

---

## 3. Thông Báo Gần Thời Gian Thực (`PB-04` — `NotificationService`)

Các loại `type` chuẩn: `order_new`, `order_updated`, `item_new`, `item_ready`, `item_overdue`, `item_cancel_rejected`, `low_stock`, `menu_changed`.

### `GET /api/notifications`
- **Query Params**: `?role=waiter&station_id=ST01&since_id=0&unread_only=false`
- **Response `200 OK`**:
  ```json
  [
    {
      "id": 12,
      "target_role": "waiter",
      "target_user_id": 6,
      "target_station_id": null,
      "type": "item_ready",
      "payload": "{\"order_id\": 3, \"table_no\": \"Bàn 02\", \"dish_name\": \"Chân gà nướng muối ớt\", \"quantity\": 2}",
      "created_at": "2026-11-27 18:10:05",
      "read_at": null
    }
  ]
  ```

### `PUT /api/notifications/{notification_id}/read`
- **Response `200 OK`**: `{ "id": 12, "read_at": "2026-11-27 18:10:20" }`

---

## 4. Tạo & Điều Phối Order (`PB-10`, `PB-12`, `PB-13` — `OrderController` & `StationRoutingService`)

### `POST /api/orders` (`PB-10` — chỉ `waiter`)
- **Request**:
  ```json
  {
    "table_no": "Bàn 03",
    "items": [
      { "menu_item_id": 1, "quantity": 2, "note": "Ít bọt" },
      { "menu_item_id": 7, "quantity": 1, "note": "Nướng kỹ" }
    ]
  }
  ```
- **Response `201 Created` / `200 OK`**:
  ```json
  {
    "id": 10,
    "order_code": "ORD-010",
    "table_no": "Bàn 03",
    "waiter_id": 6,
    "status": "awaiting_confirm",
    "created_at": "2026-11-27 18:15:00",
    "items": [
      {
        "id": 25,
        "order_id": 10,
        "menu_item_id": 1,
        "dish_name": "Bia hơi Hà Nội (Ca 2 Lít)",
        "quantity": 2,
        "note": "Ít bọt",
        "station_id": null,
        "status": "awaiting_confirm"
      }
    ]
  }
  ```
- **Lỗi món hết hàng (`400`, `R03`)**:
  `{ "detail": "Có món đã hết hàng: Mực ống xào sa tế cay", "sold_out_item_ids": [10] }`

### `GET /api/orders?status=awaiting_confirm` (`PB-12` — `head_chef`)
- **Response `200 OK`**: Mảng các đối tượng Order như mẫu trên kèm danh sách `items`, `waiter_name`, `created_at`.

### `PUT /api/orders/{order_id}/confirm` (`PB-13` — chỉ `head_chef`)
- **Response `200 OK`**:
  ```json
  {
    "id": 10,
    "table_no": "Bàn 03",
    "status": "confirmed",
    "already_confirmed": false,
    "items": [
      {
        "id": 25,
        "dish_name": "Bia hơi Hà Nội (Ca 2 Lít)",
        "quantity": 2,
        "station_id": "ST03",
        "status": "pending"
      }
    ]
  }
  ```
- *Lưu ý `R02`*: Nếu gọi xác nhận lặp lại khi đã `confirmed`, trả `200 OK` kèm `"already_confirmed": true` và **không tạo thêm dòng món trùng**.

---

## 5. Tiến Độ Chế Biến Tại Trạm & Bưng Món (`PB-15`–`PB-18` — `KitchenController`)

### `GET /api/stations/{station_id}/items` (`PB-15` — `line_cook`, `head_chef`)
- Trả về danh sách `OrderItem` (`pending`, `cooking`, `ready`) của trạm, **sắp xếp tăng dần theo `created_at` (`R09` - FIFO)**:
  ```json
  [
    {
      "id": 25,
      "order_id": 10,
      "table_no": "Bàn 03",
      "menu_item_id": 7,
      "dish_name": "Chân gà nướng muối ớt (Đĩa 6 chiếc)",
      "quantity": 1,
      "note": "Nướng kỹ",
      "station_id": "ST01",
      "status": "pending",
      "started_at": null,
      "ready_at": null,
      "overdue_alerted": false,
      "created_at": "2026-11-27 18:15:00"
    }
  ]
  ```

### `GET /api/order-items/ready` (`PB-18` — `waiter`)
- Trả về các món ở trạng thái `ready` thuộc các order của Waiter đang đăng nhập để hiển thị trong danh sách cần bưng (`MH-W2`).

### `PUT /api/order-items/{item_id}/status` (`PB-16`, `PB-17`, `PB-18` — `KitchenController` gọi `OrderItem` PB-14)
- **Request**:
  ```json
  { "status": "cooking" }
  ```
  *(Giá trị hợp lệ theo vai trò: Đầu bếp trạm gửi `"cooking"` hoặc `"ready"`; Waiter gửi `"completed"`).*
- **Response `200 OK`**: Đối tượng `OrderItem` sau khi cập nhật (`status`, `started_at`, `ready_at`, `completed_at`).
- **Lỗi chuyển sai trạng thái (`400` / `409`)**: `{ "detail": "OrderItem #25: không thể chuyển 'pending' -> 'completed' (...)" }`.
