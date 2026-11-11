# 🍻 Hệ Thống Quản Lý Bếp Ở Nhà Hàng Bia Hơi

> **Môn học**: Quản trị dự án Công nghệ Thông tin  
> **Nhóm thực hiện**: Nhóm 13  
> **Đề tài**: Xây dựng hệ thống quản lý bếp ở nhà hàng bia hơi  
> **Thời gian thực hiện**: 3 Sprints (6 tuần)

---

## 📌 1. Giới Thiệu Dự Án

Hệ thống hỗ trợ nhà hàng bia hơi vận hành khu vực bếp theo thời gian thực (Real-time Kitchen Display System), giải quyết triệt để bài toán:
- Tự động tiếp nhận và điều phối đơn gọi món từ nhân viên phục vụ (Waiter) xuống đúng từng trạm bếp chuyên biệt (Nướng, Xào/Chảo, Bia/Đồ nguội, Chiên/Khai vị).
- Bếp trưởng (Head Chef) kiểm soát tải toàn bếp, duyệt đơn và điều chuyển linh hoạt khi trạm bị quá tải.
- Đầu bếp từng trạm (Line Cook) xem vé món theo thứ tự FIFO, cập nhật trạng thái làm món và cảnh báo trễ giờ nấu (> 10 phút).
- Tự động trừ kho nguyên liệu theo định lượng món ăn (BOM) ngay khi món hoàn thành ("ready") và cảnh báo kịp thời khi nguyên liệu chạm ngưỡng an toàn.

---

## 🛠️ 2. Ngăn Xếp Công Nghệ (Tech Stack)

| Thành phần | Công nghệ lựa chọn | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Frontend** | **React 19 + Tailwind CSS + Vite** | Giao diện hiện đại, tốc độ phản hồi cực nhanh, dễ chia layout theo 3 vai trò (Phục vụ, Bếp trưởng, Đầu bếp line). |
| **Backend** | **Python FastAPI + Uvicorn** | Hiệu năng cao, async I/O native, tích hợp sẵn Swagger/OpenAPI docs tại `/docs`. |
| **Database** | **SQLite 3 (Bật WAL Mode & Foreign Keys)** | Nhẹ, không cần cài server rời, chế độ WAL (Write-Ahead Logging) cho phép nhiều màn hình đọc/ghi đồng thời không gây lock CSDL. |
| **Giao thức** | REST API + Polling định kỳ (2-3s) | Đồng bộ trạng thái món và thông báo thời gian thực giữa các màn hình. |

---

## 🌳 3. Quy Ước Làm Việc Với Git (Git Flow Nhóm 13)

Để các thành viên nhóm làm việc song song không bị xung đột mã nguồn (merge conflict), nhóm tuân thủ quy tắc sau:

### 3.1. Các nhánh chính
- **`main`**: Nhánh mã nguồn ổn định nhất, dùng để báo cáo tiến độ và demo nghiệm thu với Giảng viên hướng dẫn. **Không commit trực tiếp lên main**.
- **`develop`**: Nhánh tích hợp chính của cả nhóm. Mọi tính năng sau khi code và test xong sẽ được gộp vào đây.
- **`feature/<mã-đầu-việc>-<tên-ngắn>`**: Nhánh nhánh tính năng của từng bạn (ví dụ: `feature/pb-04-polling-notification`, `feature/pb-05-role-layouts`).

### 3.2. Quy trình làm việc hàng ngày của mỗi thành viên
1. Lấy mã nguồn mới nhất từ nhánh `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Tạo nhánh tính năng mới để làm phần việc được giao:
   ```bash
   git checkout -b feature/pb-04-notification
   ```
3. Code và commit theo đúng cú pháp:
   ```bash
   git commit -m "PB-04: Xay dung API polling danh sach thong bao cho bep"
   ```
4. Đẩy nhánh lên GitHub và tạo Pull Request (PR) vào nhánh `develop`:
   ```bash
   git push -u origin feature/pb-04-notification
   ```
5. Trưởng nhóm / thành viên review và gộp (merge) vào `develop`.

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Trên Máy Cá Nhân (Local)

### Yêu cầu môi trường:
- **Python**: Phiên bản 3.10 trở lên.
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20/22).
- **Git**: Đã cài đặt trên máy.

---

### Bước 1: Clone Repository
```bash
git clone https://github.com/hunghust/quan-ly-bep-bia-hoi.git
cd quan-ly-bep-bia-hoi
```

---

### Bước 2: Cài Đặt & Chạy Backend (FastAPI)

Mở cửa sổ **Terminal 1**:
```bash
cd backend

# 1. Tạo môi trường ảo Python (chỉ chạy lần đầu)
python -m venv venv

# 2. Kích hoạt môi trường ảo:
# Trên Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Hoặc trên Command Prompt (cmd):
# .\venv\Scripts\activate.bat
# Trên macOS / Linux:
# source venv/bin/activate

# 3. Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# 4. Khởi chạy FastAPI Server (tự động nạp CSDL SQLite WAL và dữ liệu mẫu)
uvicorn main:app --reload --port 8000
```
- API Docs (Swagger UI): **`http://localhost:8000/docs`**
- API Health Check: **`http://localhost:8000/api/health`**

---

### Bước 3: Cài Đặt & Chạy Frontend (React + Vite)

Mở cửa sổ **Terminal 2**:
```bash
cd frontend

# 1. Cài đặt thư viện npm (chỉ chạy lần đầu)
npm install

# 2. Khởi chạy server phát triển
npm run dev
```
- Truy cập giao diện ứng dụng tại: **`http://localhost:5173`**

---

## 👥 5. Tài Khoản Đăng Nhập Thử Nghiệm (Seed Data)

Hệ thống đã nạp sẵn dữ liệu mẫu trong `backend/init_db.sql`:

> **Mật khẩu mặc định cho toàn bộ tài khoản:** `123456`

| Tên đăng nhập | Vai trò (`role`) | Trạm phụ trách | Họ và tên |
| :--- | :--- | :--- | :--- |
| **`bep_truong`** | `head_chef` (Bếp trưởng) | Toàn hệ thống | Nguyễn Văn Hùng |
| **`bep_nuong`** | `line_cook` (Đầu bếp trạm) | **ST01** - Trạm Nướng | Trần Đình Trọng |
| **`bep_xao`** | `line_cook` (Đầu bếp trạm) | **ST02** - Trạm Xào & Chảo | Lê Văn Nam |
| **`bep_bia`** | `line_cook` (Nhân viên quầy) | **ST03** - Quầy Bia & Món Lạnh | Hoàng Minh Đức |
| **`bep_chien`** | `line_cook` (Đầu bếp trạm) | **ST04** - Trạm Chiên & Khai Vị | Vũ Quốc Anh |
| **`waiter_01`** | `waiter` (Nhân viên phục vụ) | Khu vực sảnh bàn | Phạm Minh Tuấn |
| **`waiter_02`** | `waiter` (Nhân viên phục vụ) | Khu vực tầng 2 / VIP | Đỗ Thúy Hằng |

---

## 📂 6. Cấu Trúc Thư Mục Dự Án

```
quan-ly-bep-bia-hoi/
├── .gitignore              # Bỏ qua node_modules, venv, file CSDL .db, cache...
├── README.md               # Tài liệu hướng dẫn & quy chuẩn nhóm
├── backend/
│   ├── database.py         # Kết nối SQLite, cấu hình WAL Mode, hàm init_db()
│   ├── init_db.sql         # Kịch bản DDL 12 bảng & nạp dữ liệu mẫu ban đầu
│   ├── main.py             # FastAPI App, CORS, Health Check & REST endpoints
│   ├── requirements.txt    # Danh sách thư viện Python (FastAPI, Uvicorn, Pydantic...)
│   └── kitchen.db          # File SQLite sinh tự động (được gitignore loại trừ)
└── frontend/
    ├── index.html          # HTML entry point với tiêu đề tiếng Việt
    ├── package.json        # Danh sách thư viện React 19, Tailwind CSS, Vite
    ├── vite.config.js      # Cấu hình Vite, Tailwind CSS plugin và reverse proxy /api
    └── src/
        ├── App.jsx         # Giao diện tổng quan Sprint 1, kiểm tra kết nối API
        ├── index.css       # Tailwind CSS import
        └── main.jsx        # Điểm gắn ứng dụng React
```

---

## 🎯 7. Kế Hoạch Sprint 1 (Tuần 1 - Tuần 2)

- [x] **PB-01**: Khởi tạo khung dự án Backend/Frontend, quy ước Git, README hướng dẫn chạy local. *(Hoàn thành)*
- [x] **PB-02**: Thiết kế cấu trúc CSDL SQLite với chế độ WAL cho phép đa màn hình đọc/ghi đồng thời. *(Hoàn thành)*
- [x] **PB-03**: Nạp dữ liệu khởi tạo (Seed data) cho tài khoản 3 vai trò, trạm bếp, menu nhậu và định lượng BOM. *(Hoàn thành)*
- [ ] **PB-04**: Cơ chế thông báo sự kiện theo vai trò và theo trạm (Polling định kỳ 2-3s). *(Đang triển khai)*
- [ ] **PB-05**: Khung layout giao diện, thanh điều hướng và màn hình chính riêng cho Waiter, Bếp trưởng, Đầu bếp line. *(Đang triển khai)*
