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

| Thành phần         | Công nghệ lựa chọn                            | Mục đích sử dụng                                                                                                                             |
| :------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend**   | **React 19 + Tailwind CSS + Vite**          | Giao diện hiện đại, tốc độ phản hồi cực nhanh, dễ chia layout theo 3 vai trò (Phục vụ, Bếp trưởng, Đầu bếp line).             |
| **Backend**    | **Python FastAPI + Uvicorn**                | Hiệu năng cao, async I/O native, tích hợp sẵn Swagger/OpenAPI docs tại `/docs`.                                                           |
| **Database**   | **SQLite 3 (Bật WAL Mode & Foreign Keys)** | Nhẹ, không cần cài server rời, chế độ WAL (Write-Ahead Logging) cho phép nhiều màn hình đọc/ghi đồng thời không gây lock CSDL. |
| **Giao thức** | REST API + Polling định kỳ (2-3s)              | Đồng bộ trạng thái món và thông báo thời gian thực giữa các màn hình.                                                              |

---

## 🌳 3. Quy Ước & Hướng Dẫn Làm Việc Với Git (Dành Cho Cả Nhóm)

Để 3 thành viên làm việc song song không bị đè code hay xung đột (conflict), cả nhóm tuân thủ chặt chẽ quy trình chuẩn dưới đây.

### 3.1. Hiểu nhanh cấu trúc 3 loại nhánh Git

- **`main`**: Nhánh sản phẩm ổn định nhất, dùng để báo cáo tiến độ và nghiệm thu với Giảng viên. **Tuyệt đối không commit trực tiếp lên main**.
- **`develop`**: Nhánh làm việc chung của cả nhóm. Toàn bộ tính năng sau khi code và test xong sẽ được gộp về đây.
- **`feature/<mã-việc>-<tên-ngắn>`**: Nhánh làm việc riêng của từng bạn cho từng đầu việc cụ thể (ví dụ: `feature/pb-04-notification`, `feature/pb-05-layout`). Mỗi người code trên một nhánh riêng nên không bao giờ sợ làm hỏng code của nhau.

---

### 3.2. Quy trình 7 bước từ A đến Z cho thành viên khi nhận việc

#### 👉 Bước 1: Tải (Clone) dự án về máy (Chỉ cần làm 1 lần đầu tiên)

Mở terminal trên máy bạn (PowerShell, Command Prompt hoặc Git Bash) và chạy:

```bash
# 1. Tải toàn bộ mã nguồn về máy
git clone https://github.com/hunghust/quan-ly-bep-bia-hoi.git

# 2. Đi vào thư mục dự án
cd quan-ly-bep-bia-hoi

# 3. Chuyển sang nhánh làm việc chính develop
git checkout develop
```

#### 👉 Bước 2: Cập nhật code mới nhất từ nhánh `develop` (Khi bắt đầu một đầu việc MỚI)

Khi bạn chuẩn bị nhận một đầu việc mới, hãy kéo code mới nhất từ nhánh `develop` về trước khi tách nhánh:

```bash
# 1. Chuyển sang nhánh develop
git checkout develop

# 2. Kéo code mới nhất mà nhóm đã gộp về máy
git pull origin develop
```

#### 👉 Bước 3: Tách một nhánh riêng cho phần việc mới của mình

Giả sử bạn được giao làm **PB-04 (Hệ thống thông báo)**, hãy tạo nhánh riêng:

```bash
git checkout -b feature/pb-04-notification
```

*(Nếu bạn làm PB-05 thì đặt tên là: `feature/pb-05-layout`)*  
*💡 Ý nghĩa: Lệnh này tạo ra một bản sao độc lập từ `develop` để bạn tha hồ code trên máy mình mà không sợ ảnh hưởng đến ai.*

> 💡 **LƯU Ý QUAN TRỌNG: Nếu bạn chỉ đang làm tiếp công việc dở dang của hôm trước**:  
> Bạn **KHÔNG CẦN** làm Bước 2 và Bước 3 (không gõ lệnh `checkout -b` tạo nhánh mới nữa). Thay vào đó, bạn chỉ cần:  
> 1. Quay lại nhánh cũ đang làm dở (nếu trước đó lỡ nhảy sang nhánh khác):  
>    `git checkout feature/pb-04-notification` *(Lưu ý: KHÔNG có chữ `-b`)*  
> 2. *(Tùy chọn)* Kéo code mới nhất từ `develop` gộp vào nhánh của bạn nếu nhóm vừa có cập nhật mới:  
>    `git pull origin develop`  
> 3. Cứ thế mở VS Code lên code tiếp cho đến khi hoàn thành!

#### 👉 Bước 4: Tiến hành viết code và chạy thử

- **Nếu bạn làm Backend (PB-04,...)**:

  - Viết các đường dẫn API trong thư mục `backend/` (chủ yếu là viết trong file `backend/main.py` hoặc tách ra thành các file trong thư mục con nếu cần).
  - Khi cần đọc/ghi dữ liệu, sử dụng kết nối CSDL SQLite đã cấu hình sẵn trong `database.py`.
- **Nếu bạn làm Frontend (PB-05,...)**:

  - Bạn phụ trách Frontend sẽ tạo và viết các file `.jsx` chứa giao diện các thành phần màn hình trong thư mục `frontend/src/components/`, rồi gọi hiển thị trong `App.jsx` để ghép các thành phần đó lại.
  - Trong React, giao diện không viết dồn vào một file mà được chia nhỏ thành các "khối Lego" gọi là **Components** (mỗi file `.jsx` là một thành phần màn hình độc lập).
- Khởi động server chạy thử trực quan trên máy theo hướng dẫn ở **Mục 4**.

#### 👉 Bước 5: Lưu lại các thay đổi (Commit)

Khi hoàn thành một phần việc hoặc cuối ngày làm việc:

```bash
# 1. Xem lại những file mình đã sửa (hiện màu đỏ)
git status

# 2. Gom tất cả các file đã sửa
git add .

# 3. Đóng gói và ghi chú nội dung công việc theo chuẩn "PB-xx: Mô tả"
git commit -m "PB-04: Xay dung API polling danh sach thong bao cho bep"
```

#### 👉 Bước 6: Đẩy nhánh của mình lên GitHub

```bash
git push -u origin feature/pb-04-notification
```

*💡 Lưu ý: Lệnh này chỉ đẩy nhánh riêng của bạn lên GitHub, không hề ảnh hưởng đến nhánh chính của dự án.*

#### 👉 Bước 7: Tạo Pull Request (Yêu cầu gộp code) trên GitHub

1. Mở trình duyệt vào repo GitHub của nhóm: **[https://github.com/hunghust/quan-ly-bep-bia-hoi](https://github.com/hunghust/quan-ly-bep-bia-hoi)**.
2. Ngay ở đầu trang, bạn sẽ thấy một **thanh màu vàng nổi bật** báo nhánh của bạn vừa được push, bấm vào nút:👉 **`Compare & pull request`**
3. Kiểm tra xem dòng trên cùng có đúng là:`base: develop` $\leftarrow$ `compare: feature/pb-04-notification`
4. Bấm nút màu xanh **`Create pull request`** là xong! Nhắn tin lên nhóm báo Trưởng nhóm vào kiểm tra và duyệt gộp.

---

### 3.3. Dành cho Trưởng nhóm (Leader): Kiểm tra và duyệt code

Khi một thành viên tạo Pull Request (PR), Trưởng nhóm thực hiện:

1. **(Tùy chọn) Kéo nhánh của bạn đó về máy mình chạy thử trước khi duyệt**:
   ```bash
   git fetch origin
   git checkout feature/pb-04-notification
   # Chạy backend / frontend test trực quan trên trình duyệt
   # Test xong thì quay về develop:
   git checkout develop
   ```
2. **Duyệt và Gộp code trên GitHub**:
   - Vào tab **Pull requests** trên GitHub $\rightarrow$ Chọn PR của bạn đó.
   - Bấm xem tab **Files changed** để kiểm tra các dòng code mới.
   - Bấm nút xanh to: **`Merge pull request`** $\rightarrow$ bấm **`Confirm merge`**.
     👉 Toàn bộ code tính năng mới sẽ tự động được gộp hoàn hảo vào nhánh `develop`!

---

## 🚀 4. Hướng Dẫn Cài Đặt & Chạy Trên Máy Cá Nhân (Local)

### Yêu cầu môi trường:

- **Python**: Phiên bản 3.10 trở lên.
- **Node.js**: Phiên bản 18 trở lên (khuyên dùng Node 20/22).
- **Git**: Đã cài đặt trên máy.

---

### Bước 1: Clone Repository (Chỉ làm 1 lần đầu)

```bash
git clone https://github.com/hunghust/quan-ly-bep-bia-hoi.git
cd quan-ly-bep-bia-hoi
git checkout develop
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

- API Docs (Swagger UI trực quan): **`http://localhost:8000/docs`**
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

## 👥 5. Tài Khoản Đăng Nhập Thử Nghiệm (Seed Data PB-03)

Hệ thống đã nạp sẵn dữ liệu mẫu trong `backend/init_db.sql`:

> **Mật khẩu mặc định cho toàn bộ tài khoản:** `123456`

| Tên đăng nhập        | Vai trò (`role`)                | Trạm phụ trách                        | Họ và tên        |
| :----------------------- | :--------------------------------- | :--------------------------------------- | :------------------ |
| **`bep_truong`** | `head_chef` (Bếp trưởng)      | Toàn hệ thống                         | Nguyễn Văn Hùng  |
| **`bep_nuong`**  | `line_cook` (Đầu bếp trạm)   | **ST01** - Trạm Nướng           | Trần Đình Trọng |
| **`bep_xao`**    | `line_cook` (Đầu bếp trạm)   | **ST02** - Trạm Xào & Chảo      | Lê Văn Nam        |
| **`bep_bia`**    | `line_cook` (Nhân viên quầy)  | **ST03** - Quầy Bia & Món Lạnh  | Hoàng Minh Đức   |
| **`bep_chien`**  | `line_cook` (Đầu bếp trạm)   | **ST04** - Trạm Chiên & Khai Vị | Vũ Quốc Anh       |
| **`waiter_01`**  | `waiter` (Nhân viên phục vụ) | Khu vực sảnh bàn                      | Phạm Minh Tuấn    |
| **`waiter_02`**  | `waiter` (Nhân viên phục vụ) | Khu vực tầng 2 / VIP                   | Đỗ Thúy Hằng    |

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
        ├── main.jsx        # Điểm gắn ứng dụng React
        └── components/     # Thư mục chứa các thành phần giao diện (PB-05)
```
