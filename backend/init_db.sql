-- ==============================================================================
-- CƠ SỞ DỮ LIỆU: HỆ THỐNG QUẢN LÝ BẾP Ở NHÀ HÀNG BIA HƠI (SQLite)
-- Đề tài: Quản trị dự án CNTT - Nhóm 13
-- Đáp ứng yêu cầu kỹ thuật PB-01, PB-02, PB-03 (Bật WAL Mode, Foreign Keys)
-- ==============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- 1. BẢNG TÀI KHOẢN VÀ PHÂN QUYỀN (User) - R10
CREATE TABLE IF NOT EXISTS "User" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('waiter', 'head_chef', 'line_cook')),
    station_id TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES Station(id) ON DELETE SET NULL
);

-- 2. BẢNG TRẠM BẾP (Station)
CREATE TABLE IF NOT EXISTS Station (
    id TEXT PRIMARY KEY,            -- ST01, ST02, ST03, ST04
    name TEXT NOT NULL,
    description TEXT
);

-- 3. BẢNG MÓN ĂN / ĐỒ UỐNG (MenuItem)
CREATE TABLE IF NOT EXISTS MenuItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    default_station_id TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    is_sold_out INTEGER DEFAULT 0,  -- 0: còn hàng, 1: hết hàng (R03)
    active INTEGER DEFAULT 1,
    FOREIGN KEY (default_station_id) REFERENCES Station(id)
);

-- 4. BẢNG ĐƠN GỌI MÓN (Order) - R02
CREATE TABLE IF NOT EXISTS "Order" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT UNIQUE,
    table_no TEXT NOT NULL,         -- Bàn 01, Bàn 02...
    waiter_id INTEGER,
    status TEXT DEFAULT 'awaiting_confirm' CHECK(status IN ('awaiting_confirm', 'confirmed', 'completed', 'cancelled')),
    confirmed_snapshot TEXT,        -- Snapshot JSON khi bếp trưởng xác nhận (R02)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (waiter_id) REFERENCES "User"(id)
);

-- 5. BẢNG CHI TIẾT MÓN TRONG ĐƠN (OrderItem) - Q3, R01, R04, R07
CREATE TABLE IF NOT EXISTS OrderItem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    note TEXT,
    station_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'cooking', 'ready', 'completed', 'cancelled')),
    started_at DATETIME,
    ready_at DATETIME,
    completed_at DATETIME,
    overdue_alerted INTEGER DEFAULT 0, -- 1 nếu đã gửi cảnh báo > 10 phút (R07)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES "Order"(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES MenuItem(id),
    FOREIGN KEY (station_id) REFERENCES Station(id)
);

-- 6. BẢNG NHẬT KÝ CHUYỂN TRẠNG THÁI MÓN (ItemStatusLog)
CREATE TABLE IF NOT EXISTS ItemStatusLog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_item_id INTEGER NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    by_user_id INTEGER,
    at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_item_id) REFERENCES OrderItem(id) ON DELETE CASCADE,
    FOREIGN KEY (by_user_id) REFERENCES "User"(id)
);

-- 7. BẢNG THÔNG BÁO THỜI GIAN THỰC (Notification) - PB-04, R06, R07, R11
CREATE TABLE IF NOT EXISTS Notification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_role TEXT,              -- 'waiter', 'head_chef', 'line_cook'
    target_user_id INTEGER,
    target_station_id TEXT,        -- 'ST01', 'ST02'...
    type TEXT NOT NULL,            -- 'order_new', 'item_ready', 'item_overdue', 'stock_low', 'item_sold_out'
    payload TEXT NOT NULL,         -- Nội dung / JSON chi tiết
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    FOREIGN KEY (target_user_id) REFERENCES "User"(id),
    FOREIGN KEY (target_station_id) REFERENCES Station(id)
);

-- 8. BẢNG NGUYÊN LIỆU KHO (Ingredient) - R06
CREATE TABLE IF NOT EXISTS Ingredient (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,            -- Lít, Kg, Bìa, Gói
    stock_qty REAL NOT NULL DEFAULT 0,
    min_threshold REAL NOT NULL DEFAULT 0,
    low_alerted INTEGER DEFAULT 0  -- 1 nếu đã cảnh báo để tránh lặp (R06)
);

-- 9. BẢNG ĐỊNH LƯỢNG MÓN (BomLine) - R05
CREATE TABLE IF NOT EXISTS BomLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_item_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    qty_per_serving REAL NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES MenuItem(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredient(id) ON DELETE CASCADE
);

-- 10. BẢNG BIẾN ĐỘNG KHO (StockMovement) - R05, R08
CREATE TABLE IF NOT EXISTS StockMovement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('import', 'consume', 'adjust', 'stocktake')),
    qty_delta REAL NOT NULL,       -- Dương nếu nhập, âm nếu tiêu hao/giảm
    order_item_id INTEGER,
    by_user_id INTEGER,
    note TEXT,
    at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredient(id),
    FOREIGN KEY (order_item_id) REFERENCES OrderItem(id),
    FOREIGN KEY (by_user_id) REFERENCES "User"(id)
);

-- 11. BẢNG PHIÊN KIỂM KÊ (Stocktake)
CREATE TABLE IF NOT EXISTS Stocktake (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    by_user_id INTEGER,
    synced INTEGER DEFAULT 0,      -- 1 nếu đã đồng bộ chênh lệch vào tồn kho
    FOREIGN KEY (by_user_id) REFERENCES "User"(id)
);

-- 12. BẢNG CHI TIẾT KIỂM KÊ (StocktakeLine)
CREATE TABLE IF NOT EXISTS StocktakeLine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stocktake_id INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    system_qty REAL NOT NULL,
    counted_qty REAL NOT NULL,
    diff REAL NOT NULL,
    FOREIGN KEY (stocktake_id) REFERENCES Stocktake(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredient(id)
);

-- ==============================================================================
-- TIỆN ÍCH VIEW: Hỗ trợ cú pháp chữ thường snake_case
-- ==============================================================================
CREATE VIEW IF NOT EXISTS users AS SELECT * FROM "User";
CREATE VIEW IF NOT EXISTS stations AS SELECT * FROM Station;
CREATE VIEW IF NOT EXISTS menu_items AS SELECT * FROM MenuItem;
CREATE VIEW IF NOT EXISTS orders AS SELECT * FROM "Order";
CREATE VIEW IF NOT EXISTS order_items AS SELECT * FROM OrderItem;
CREATE VIEW IF NOT EXISTS item_status_logs AS SELECT * FROM ItemStatusLog;
CREATE VIEW IF NOT EXISTS notifications AS SELECT * FROM Notification;
CREATE VIEW IF NOT EXISTS ingredients AS SELECT * FROM Ingredient;
CREATE VIEW IF NOT EXISTS bom_lines AS SELECT * FROM BomLine;
CREATE VIEW IF NOT EXISTS stock_movements AS SELECT * FROM StockMovement;
CREATE VIEW IF NOT EXISTS stocktakes AS SELECT * FROM Stocktake;
CREATE VIEW IF NOT EXISTS stocktake_lines AS SELECT * FROM StocktakeLine;

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO MẪU (SEED DATA - PB-03)
-- ==============================================================================

-- 1. Trạm bếp
INSERT OR IGNORE INTO Station (id, name, description) VALUES
('ST01', 'Trạm Nướng', 'Chân gà nướng muối ớt, dải lợn nướng than hoa, cá chỉ vàng nướng'),
('ST02', 'Trạm Xào & Chảo', 'Bò xào cần tỏi, mực xào sa tế, dạ dày xào dưa chua, rau muống xào tỏi'),
('ST03', 'Quầy Bia & Món Lạnh', 'Bia hơi Hà Nội keg, lạc luộc gia truyền, nem chua Thanh Hóa, dưa chuột chẻ'),
('ST04', 'Trạm Chiên & Khai Vị', 'Đậu phụ lướt ván giòn, khoai tây chiên bơ tỏi, ngô chiên bơ cay');

-- 2. Tài khoản nhân sự mẫu (Mật khẩu mặc định: 123456)
-- password_hash là bcrypt hash của "123456" ($2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S)
INSERT OR IGNORE INTO "User" (username, password_hash, full_name, role, station_id, active) VALUES
('bep_truong', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Nguyễn Văn Hùng (Bếp Trưởng)', 'head_chef', NULL, 1),
('bep_nuong', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Trần Đình Trọng (Đầu Bếp Nướng)', 'line_cook', 'ST01', 1),
('bep_xao', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Lê Văn Nam (Đầu Bếp Xào)', 'line_cook', 'ST02', 1),
('bep_bia', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Hoàng Minh Đức (Quầy Bia)', 'line_cook', 'ST03', 1),
('bep_chien', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Vũ Quốc Anh (Đầu Bếp Chiên)', 'line_cook', 'ST04', 1),
('waiter_01', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Phạm Minh Tuấn (Phục Vụ)', 'waiter', NULL, 1),
('waiter_02', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L5.vIqf.S', 'Đỗ Thúy Hằng (Phục Vụ)', 'waiter', NULL, 1);

-- 3. Danh mục món ăn
INSERT OR IGNORE INTO MenuItem (id, name, default_station_id, price, is_sold_out, active) VALUES
(1, 'Bia hơi Hà Nội (Ca 2 Lít)', 'ST03', 60000, 0, 1),
(2, 'Bia hơi Hà Nội (Cốc 330ml)', 'ST03', 13000, 0, 1),
(3, 'Lạc luộc gia truyền', 'ST03', 25000, 0, 1),
(4, 'Nem chua Thanh Hóa (Đĩa 5 chiếc)', 'ST03', 45000, 0, 1),
(5, 'Đậu phụ lướt ván giòn chấm mắm tôm', 'ST04', 35000, 0, 1),
(6, 'Khoai tây chiên bơ tỏi', 'ST04', 40000, 0, 1),
(7, 'Chân gà nướng muối ớt (Đĩa 6 chiếc)', 'ST01', 75000, 0, 1),
(8, 'Dải lợn nướng than hoa', 'ST01', 110000, 0, 1),
(9, 'Bò xào cần tỏi', 'ST02', 120000, 0, 1),
(10, 'Mực ống xào sa tế cay', 'ST02', 150000, 0, 1),
(11, 'Rau muống xào tỏi giòn', 'ST02', 45000, 0, 1);

-- 4. Danh mục nguyên liệu kho
INSERT OR IGNORE INTO Ingredient (id, name, unit, stock_qty, min_threshold, low_alerted) VALUES
(1, 'Bia hơi Hà Nội keg 50L', 'Lít', 250.0, 50.0, 0),
(2, 'Thịt bò bắp tươi', 'Kg', 15.0, 3.0, 0),
(3, 'Đậu phụ Mơ trắng', 'Bìa', 80.0, 15.0, 0),
(4, 'Chân gà tươi sống', 'Kg', 12.0, 3.0, 0),
(5, 'Mực ống tươi', 'Kg', 6.0, 2.0, 0),
(6, 'Lạc củ tươi', 'Kg', 30.0, 5.0, 0),
(7, 'Khoai tây củ', 'Kg', 20.0, 4.0, 0),
(8, 'Nem chua cây', 'Chiếc', 50.0, 10.0, 0);

-- 5. Định mức nguyên liệu (BOM)
INSERT OR IGNORE INTO BomLine (menu_item_id, ingredient_id, qty_per_serving) VALUES
(1, 1, 2.0),    -- Ca 2L bia tiêu hao 2 lít
(2, 1, 0.33),   -- Cốc 330ml tiêu hao 0.33 lít
(3, 6, 0.3),    -- Đĩa lạc tiêu hao 0.3 kg lạc
(4, 8, 5.0),    -- Đĩa nem chua tiêu hao 5 chiếc
(5, 3, 3.0),    -- Đĩa đậu lướt ván tiêu hao 3 bìa đậu
(6, 7, 0.4),    -- Đĩa khoai chiên tiêu hao 0.4 kg khoai
(7, 4, 0.5),    -- Đĩa chân gà nướng tiêu hao 0.5 kg chân gà
(9, 2, 0.25),   -- Đĩa bò xào tiêu hao 0.25 kg bò
(10, 5, 0.3);   -- Đĩa mực xào tiêu hao 0.3 kg mực

