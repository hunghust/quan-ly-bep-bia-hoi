from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import List, Dict, Any

from database import init_db, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi động: Kiểm tra & tạo CSDL nếu chưa có
    init_db()
    yield
    # Tắt ứng dụng: cleanup nếu cần


app = FastAPI(
    title="Kitchen Management System API (Bếp Bia Hơi - Nhóm 13)",
    description="Backend API cho Hệ thống Quản lý Bếp ở Nhà hàng Bia hơi (FastAPI + SQLite WAL)",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS để Frontend (React/Vite) gọi API không bị chặn
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "project": "Hệ thống Quản lý Bếp Nhà hàng Bia hơi",
        "team": "Nhóm 13 - Quản trị dự án CNTT",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check(db: sqlite3.Connection = Depends(get_db)):
    """Kiểm tra sức khỏe hệ thống và kết nối CSDL SQLite."""
    try:
        cur = db.cursor()
        
        # Kiểm tra chế độ WAL
        cur.execute("PRAGMA journal_mode;")
        journal_mode = cur.fetchone()[0]
        
        # Đếm số lượng bảng
        cur.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        table_count = cur.fetchone()[0]

        # Đếm số users mẫu
        cur.execute("SELECT count(*) FROM \"User\";")
        user_count = cur.fetchone()[0]

        return {
            "status": "healthy",
            "database": "connected",
            "journal_mode": journal_mode,
            "table_count": table_count,
            "seed_users_count": user_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database check failed: {str(e)}")


@app.get("/api/stations")
def get_stations(db: sqlite3.Connection = Depends(get_db)):
    """Lấy danh sách các trạm bếp (PB-03)."""
    cur = db.cursor()
    cur.execute("SELECT id, name, description FROM Station ORDER BY id;")
    rows = cur.fetchall()
    return [{"id": r["id"], "name": r["name"], "description": r["description"]} for r in rows]


@app.get("/api/menu-items")
def get_menu_items(db: sqlite3.Connection = Depends(get_db)):
    """Lấy danh sách món ăn mẫu (PB-03)."""
    cur = db.cursor()
    cur.execute("""
        SELECT m.id, m.name, m.default_station_id, s.name as station_name, m.price, m.is_sold_out
        FROM MenuItem m
        LEFT JOIN Station s ON m.default_station_id = s.id
        WHERE m.active = 1
        ORDER BY m.default_station_id, m.id;
    """)
    rows = cur.fetchall()
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "default_station_id": r["default_station_id"],
            "station_name": r["station_name"],
            "price": r["price"],
            "is_sold_out": bool(r["is_sold_out"])
        }
        for r in rows
    ]


@app.get("/api/users")
def get_users(db: sqlite3.Connection = Depends(get_db)):
    """Lấy danh sách người dùng mẫu (không trả về mật khẩu)."""
    cur = db.cursor()
    cur.execute("""
        SELECT u.id, u.username, u.full_name, u.role, u.station_id, s.name as station_name
        FROM "User" u
        LEFT JOIN Station s ON u.station_id = s.id
        WHERE u.active = 1
        ORDER BY u.role, u.id;
    """)
    rows = cur.fetchall()
    return [
        {
            "id": r["id"],
            "username": r["username"],
            "full_name": r["full_name"],
            "role": r["role"],
            "station_id": r["station_id"],
            "station_name": r["station_name"]
        }
        for r in rows
    ]


@app.get("/api/notifications")
def get_notifications(
    role: str = None,
    station_id: str = None,
    db: sqlite3.Connection = Depends(get_db)
):
    """Lấy danh sách thông báo theo role hoặc trạm (PB-04)."""
    cur = db.cursor()
    query = "SELECT id, target_role, target_user_id, target_station_id, type, payload, created_at, read_at FROM Notification WHERE 1=1"
    params = []
    
    if role:
        query += " AND (target_role = ? OR target_role IS NULL)"
        params.append(role)
    if station_id:
        query += " AND (target_station_id = ? OR target_station_id IS NULL)"
        params.append(station_id)
        
    query += " ORDER BY created_at DESC LIMIT 20;"
    cur.execute(query, params)
    rows = cur.fetchall()
    return [
        {
            "id": r["id"],
            "target_role": r["target_role"],
            "target_station_id": r["target_station_id"],
            "type": r["type"],
            "payload": r["payload"],
            "created_at": r["created_at"],
            "read_at": r["read_at"]
        }
        for r in rows
    ]

