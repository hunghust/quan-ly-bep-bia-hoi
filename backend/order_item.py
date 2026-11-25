"""Mô-đun thực thể OrderItem và máy trạng thái trung tâm (PB-14).

Đáp ứng:
- Tài liệu Phân tích Thiết kế Phiên bản 6 (Phần V mục 1, 2; Phần VI mục 2).
- Quy tắc nghiệp vụ R01, R04, NFR-05, NFR-06: mọi thay đổi trạng thái của món
  đều đi qua một nơi duy nhất và tự động ghi nhật ký vào bảng ItemStatusLog.
"""

import sqlite3
from dataclasses import dataclass
from typing import Dict, List, Optional, Set


VALID_STATUSES: Set[str] = {
    "awaiting_confirm",
    "pending",
    "cooking",
    "ready",
    "completed",
    "cancelled",
}

# Bảng chuyển trạng thái hợp lệ (Phần V, mục 2 & tab Quy_Tac)
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    "awaiting_confirm": {"pending"},
    "pending": {"cooking", "cancelled", "pending"},
    "cooking": {"ready", "pending"},
    "ready": {"completed", "pending"},
    "completed": {"pending"},
    "cancelled": set(),
}

STATUS_TIMESTAMPS: Dict[str, str] = {
    "cooking": "started_at",
    "ready": "ready_at",
    "completed": "completed_at",
}


class OrderItemNotFoundError(LookupError):
    """Ném ra khi không tìm thấy dòng món OrderItem theo ID."""


class InvalidStateTransitionError(ValueError):
    """Ném ra khi chuyển trạng thái hoặc điều chuyển trạm vi phạm quy tắc nghiệp vụ."""

    def __init__(self, item_id: int, from_status: str, to_status: str, reason: str):
        self.item_id = item_id
        self.from_status = from_status
        self.to_status = to_status
        self.reason = reason
        super().__init__(
            f"OrderItem #{item_id}: không thể chuyển '{from_status}' -> '{to_status}' ({reason})."
        )


@dataclass
class OrderItem:
    """Thực thể dòng món trong đơn hàng, đóng gói toàn bộ hành vi chuyển trạng thái."""

    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    note: Optional[str]
    station_id: Optional[str]
    status: str
    started_at: Optional[str] = None
    ready_at: Optional[str] = None
    completed_at: Optional[str] = None
    overdue_alerted: int = 0
    created_at: Optional[str] = None

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "OrderItem":
        """Khởi tạo đối tượng OrderItem từ một bản ghi sqlite3.Row."""
        return cls(
            id=row["id"],
            order_id=row["order_id"],
            menu_item_id=row["menu_item_id"],
            quantity=row["quantity"],
            note=row["note"],
            station_id=row["station_id"],
            status=row["status"],
            started_at=row["started_at"],
            ready_at=row["ready_at"],
            completed_at=row["completed_at"],
            overdue_alerted=row["overdue_alerted"],
            created_at=row["created_at"],
        )

    @classmethod
    def get_by_id(cls, conn: sqlite3.Connection, item_id: int) -> "OrderItem":
        """Tải OrderItem từ CSDL theo id; ném OrderItemNotFoundError nếu không tồn tại."""
        row = conn.execute(
            "SELECT * FROM OrderItem WHERE id = ?;",
            (item_id,),
        ).fetchone()
        if row is None:
            raise OrderItemNotFoundError(f"Không tìm thấy OrderItem #{item_id}.")
        return cls.from_row(row)

    @classmethod
    def create(
        cls,
        conn: sqlite3.Connection,
        order_id: int,
        menu_item_id: int,
        quantity: int = 1,
        note: Optional[str] = None,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Tạo mới OrderItem ở trạng thái 'awaiting_confirm' (chưa gán trạm) và ghi log khởi tạo."""
        cur = conn.execute(
            """
            INSERT INTO OrderItem (order_id, menu_item_id, quantity, note, station_id, status)
            VALUES (?, ?, ?, ?, NULL, 'awaiting_confirm');
            """,
            (order_id, menu_item_id, quantity, note),
        )
        item_id = cur.lastrowid
        conn.execute(
            """
            INSERT INTO ItemStatusLog (order_item_id, from_status, to_status, by_user_id)
            VALUES (?, NULL, 'awaiting_confirm', ?);
            """,
            (item_id, by_user_id),
        )
        if commit:
            conn.commit()
        return cls.get_by_id(conn, item_id)

    def to_dict(self) -> dict:
        """Chuyển đổi thực thể thành dict phục vụ trả JSON qua API."""
        return {
            "id": self.id,
            "order_id": self.order_id,
            "menu_item_id": self.menu_item_id,
            "quantity": self.quantity,
            "note": self.note,
            "station_id": self.station_id,
            "status": self.status,
            "started_at": self.started_at,
            "ready_at": self.ready_at,
            "completed_at": self.completed_at,
            "overdue_alerted": bool(self.overdue_alerted),
            "created_at": self.created_at,
        }

    def get_logs(self, conn: sqlite3.Connection) -> List[dict]:
        """Lấy lịch sử chuyển trạng thái của dòng món theo thứ tự thời gian."""
        rows = conn.execute(
            """
            SELECT id, order_item_id, from_status, to_status, by_user_id, at
            FROM ItemStatusLog
            WHERE order_item_id = ?
            ORDER BY id ASC;
            """,
            (self.id,),
        ).fetchall()
        return [dict(r) for r in rows]

    def _reload(self, conn: sqlite3.Connection) -> "OrderItem":
        fresh = self.get_by_id(conn, self.id)
        self.__dict__.update(fresh.__dict__)
        return self

    def _transition(
        self,
        conn: sqlite3.Connection,
        to_status: str,
        by_user_id: Optional[int] = None,
        *,
        station_id: Optional[str] = None,
        update_station: bool = False,
        new_note: Optional[str] = None,
        update_note: bool = False,
        reset_progress: bool = False,
        commit: bool = True,
    ) -> "OrderItem":
        """Hàm trung tâm kiểm tra hợp lệ, cập nhật trạng thái và ghi ItemStatusLog."""
        if to_status not in VALID_STATUSES:
            raise InvalidStateTransitionError(
                self.id, self.status, to_status, "trạng thái đích không hợp lệ"
            )

        allowed = ALLOWED_TRANSITIONS.get(self.status, set())
        if to_status not in allowed:
            reason = (
                "chỉ món 'pending' mới được huỷ (R01)"
                if to_status == "cancelled"
                else "không đúng đường chuyển trạng thái cho phép"
            )
            raise InvalidStateTransitionError(self.id, self.status, to_status, reason)

        from_status = self.status
        set_clauses = ["status = ?"]
        params: list = [to_status]

        if update_station:
            set_clauses.append("station_id = ?")
            params.append(station_id)

        if update_note:
            set_clauses.append("note = ?")
            params.append(new_note)

        if reset_progress:
            # Làm lại / sửa ghi chú theo R04: xóa các mốc thời gian chế biến trước đó
            set_clauses.extend([
                "started_at = NULL",
                "ready_at = NULL",
                "completed_at = NULL",
                "overdue_alerted = 0",
            ])
        elif to_status in STATUS_TIMESTAMPS:
            ts_col = STATUS_TIMESTAMPS[to_status]
            set_clauses.append(f"{ts_col} = CURRENT_TIMESTAMP")

        params.append(self.id)
        conn.execute(
            f"UPDATE OrderItem SET {', '.join(set_clauses)} WHERE id = ?;",
            params,
        )
        conn.execute(
            """
            INSERT INTO ItemStatusLog (order_item_id, from_status, to_status, by_user_id)
            VALUES (?, ?, ?, ?);
            """,
            (self.id, from_status, to_status, by_user_id),
        )
        if commit:
            conn.commit()
        return self._reload(conn)

    def confirm_dispatch(
        self,
        conn: sqlite3.Connection,
        station_id: str,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 4.1: Bếp trưởng duyệt order, gán trạm mặc định và chuyển sang 'pending'."""
        if not station_id:
            raise InvalidStateTransitionError(
                self.id, self.status, "pending", "thiếu mã trạm chế biến khi tách món"
            )
        return self._transition(
            conn,
            "pending",
            by_user_id,
            station_id=station_id,
            update_station=True,
            commit=commit,
        )

    def start_cooking(
        self,
        conn: sqlite3.Connection,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 5.1: Đầu bếp bấm 'Nhận món', chuyển 'pending' -> 'cooking'."""
        return self._transition(conn, "cooking", by_user_id, commit=commit)

    def mark_ready(
        self,
        conn: sqlite3.Connection,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 5.2: Đầu bếp bấm 'Hoàn thành', chuyển 'cooking' -> 'ready'."""
        return self._transition(conn, "ready", by_user_id, commit=commit)

    def mark_completed(
        self,
        conn: sqlite3.Connection,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 5.3: Waiter bấm 'Đã bưng', chuyển 'ready' -> 'completed'."""
        return self._transition(conn, "completed", by_user_id, commit=commit)

    def cancel(
        self,
        conn: sqlite3.Connection,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 4.3 (R01): Huỷ món; chỉ cho phép khi món đang 'pending'."""
        return self._transition(conn, "cancelled", by_user_id, commit=commit)

    def reopen_for_rework(
        self,
        conn: sqlite3.Connection,
        new_note: Optional[str] = None,
        by_user_id: Optional[int] = None,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 4.3 (R04): Điều chỉnh ghi chú / làm lại món, đưa về 'pending' và reset mốc giờ."""
        if not self.station_id:
            raise InvalidStateTransitionError(
                self.id, self.status, "pending", "món chưa được gán trạm chế biến"
            )
        return self._transition(
            conn,
            "pending",
            by_user_id,
            new_note=new_note,
            update_note=(new_note is not None),
            reset_progress=True,
            commit=commit,
        )

    def reassign_to(
        self,
        conn: sqlite3.Connection,
        new_station_id: str,
        commit: bool = True,
    ) -> "OrderItem":
        """Kịch bản 4.2 (R01): Điều chuyển sang trạm khác; chỉ áp dụng với món 'pending'."""
        if self.status != "pending":
            raise InvalidStateTransitionError(
                self.id,
                self.status,
                self.status,
                "chỉ món 'pending' mới được điều chuyển sang trạm khác (R01)",
            )
        if not new_station_id:
            raise InvalidStateTransitionError(
                self.id, self.status, self.status, "thiếu mã trạm đích"
            )
        conn.execute(
            "UPDATE OrderItem SET station_id = ? WHERE id = ?;",
            (new_station_id, self.id),
        )
        if commit:
            conn.commit()
        return self._reload(conn)

    # Alias camelCase khớp tên phương thức trong sơ đồ lớp tài liệu thiết kế
    startCooking = start_cooking
    markReady = mark_ready
    markCompleted = mark_completed
    reopenForRework = reopen_for_rework
    reassignTo = reassign_to
