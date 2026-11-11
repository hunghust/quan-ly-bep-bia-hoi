import os
import sqlite3
from pathlib import Path
from typing import Generator

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "kitchen.db"
INIT_SQL_PATH = BASE_DIR / "init_db.sql"


def get_connection() -> sqlite3.Connection:
    """Tạo kết nối tới SQLite database với WAL mode và Foreign Keys enabled."""
    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=10.0,
        check_same_thread=False
    )
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(force: bool = False):
    """Khởi tạo cấu trúc bảng và seed data từ init_db.sql nếu chưa có."""
    if not DB_PATH.exists() or force:
        print(f"[DB] Initializing database at {DB_PATH}...")
        if not INIT_SQL_PATH.exists():
            raise FileNotFoundError(f"SQL file not found at {INIT_SQL_PATH}")
        
        with open(INIT_SQL_PATH, "r", encoding="utf-8") as f:
            sql_script = f.read()

        conn = get_connection()
        try:
            conn.executescript(sql_script)
            conn.commit()
            print("[DB] Database initialized successfully with tables and seed data.")
        finally:
            conn.close()
    else:
        # Đảm bảo WAL mode được kích hoạt mỗi lần mở
        conn = get_connection()
        conn.close()
        print(f"[DB] Database already exists at {DB_PATH}.")


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI Dependency để inject db connection vào các endpoint."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

