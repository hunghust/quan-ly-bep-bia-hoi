"""Unit tests cho máy trạng thái OrderItem và ItemStatusLog (PB-14).

Bao phủ toàn bộ bảng chuyển trạng thái trong tài liệu (Phần V, mục 2) và tab Quy_Tac:
- Luồng chuẩn: awaiting_confirm -> pending -> cooking -> ready -> completed
- Huỷ món hợp lệ (pending -> cancelled) và bị từ chối (cooking/ready/completed/awaiting_confirm) theo R01
- Làm lại / sửa ghi chú (pending/cooking/ready/completed -> pending) theo R04
- Điều chuyển trạm chỉ cho phép khi 'pending' theo R01
- Ghi nhận đầy đủ ItemStatusLog và không ghi log khi chuyển lỗi
"""

import sqlite3
import pytest

from database import INIT_SQL_PATH
from order_item import (
    InvalidStateTransitionError,
    OrderItem,
    OrderItemNotFoundError,
)


@pytest.fixture
def db_conn(tmp_path):
    """Tạo CSDL SQLite sạch cho mỗi ca kiểm thử từ init_db.sql."""
    db_file = tmp_path / "test_kitchen.db"
    conn = sqlite3.connect(str(db_file))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    with open(INIT_SQL_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    yield conn
    conn.close()


def _create_sample_order_item(conn: sqlite3.Connection, note: str = "Ít cay") -> OrderItem:
    """Tạo nhanh một Order và OrderItem ở trạng thái 'awaiting_confirm' (Waiter waiter_01)."""
    waiter = conn.execute('SELECT id FROM "User" WHERE username = "waiter_01"').fetchone()
    cur = conn.execute(
        'INSERT INTO "Order" (table_no, waiter_id, status) VALUES (?, ?, ?);',
        ("Bàn 01", waiter["id"], "awaiting_confirm"),
    )
    order_id = cur.lastrowid
    return OrderItem.create(
        conn,
        order_id=order_id,
        menu_item_id=7,  # Chân gà nướng muối ớt (ST01)
        quantity=2,
        note=note,
        by_user_id=waiter["id"],
    )


def _get_user_id(conn: sqlite3.Connection, username: str) -> int:
    return conn.execute('SELECT id FROM "User" WHERE username = ?;', (username,)).fetchone()["id"]


def test_happy_path_full_lifecycle_and_logs(db_conn):
    """Kiểm tra luồng chuẩn: awaiting_confirm -> pending -> cooking -> ready -> completed."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")
    waiter_id = _get_user_id(db_conn, "waiter_01")

    item = _create_sample_order_item(db_conn)
    assert item.status == "awaiting_confirm"
    assert item.station_id is None

    # 4.1 Bếp trưởng xác nhận -> pending
    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    assert item.status == "pending"
    assert item.station_id == "ST01"

    # 5.1 Đầu bếp nhận món -> cooking
    item.start_cooking(db_conn, by_user_id=cook_id)
    assert item.status == "cooking"
    assert item.started_at is not None

    # 5.2 Đầu bếp báo hoàn thành -> ready
    item.mark_ready(db_conn, by_user_id=cook_id)
    assert item.status == "ready"
    assert item.ready_at is not None

    # 5.3 Waiter xác nhận đã bưng -> completed
    item.mark_completed(db_conn, by_user_id=waiter_id)
    assert item.status == "completed"
    assert item.completed_at is not None

    # Kiểm tra toàn bộ lịch sử ItemStatusLog (5 lần chuyển kể cả lúc tạo)
    logs = item.get_logs(db_conn)
    transitions = [(l["from_status"], l["to_status"], l["by_user_id"]) for l in logs]
    assert transitions == [
        (None, "awaiting_confirm", waiter_id),
        ("awaiting_confirm", "pending", chef_id),
        ("pending", "cooking", cook_id),
        ("cooking", "ready", cook_id),
        ("ready", "completed", waiter_id),
    ]


def test_cancel_allowed_only_from_pending_r01(db_conn):
    """R01: Chỉ món 'pending' mới được huỷ."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    item = _create_sample_order_item(db_conn)

    # Từ awaiting_confirm chưa tách xuống trạm không cho huỷ qua hàm huỷ trạm
    with pytest.raises(InvalidStateTransitionError):
        item.cancel(db_conn, by_user_id=chef_id)

    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    item.cancel(db_conn, by_user_id=chef_id)
    assert item.status == "cancelled"

    logs = item.get_logs(db_conn)
    assert logs[-1]["from_status"] == "pending"
    assert logs[-1]["to_status"] == "cancelled"
    assert logs[-1]["by_user_id"] == chef_id


@pytest.mark.parametrize("target_stage", ["cooking", "ready", "completed"])
def test_cancel_rejected_when_not_pending_r01(db_conn, target_stage):
    """R01: Từ chối huỷ khi món đang 'cooking', 'ready' hoặc 'completed' và không ghi log."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")
    waiter_id = _get_user_id(db_conn, "waiter_01")

    item = _create_sample_order_item(db_conn)
    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    if target_stage in ("cooking", "ready", "completed"):
        item.start_cooking(db_conn, by_user_id=cook_id)
    if target_stage in ("ready", "completed"):
        item.mark_ready(db_conn, by_user_id=cook_id)
    if target_stage == "completed":
        item.mark_completed(db_conn, by_user_id=waiter_id)

    logs_before = len(item.get_logs(db_conn))
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        item.cancel(db_conn, by_user_id=chef_id)

    assert "R01" in str(exc_info.value)
    # Tải lại từ DB để chắc chắn DB không bị đổi
    reloaded = OrderItem.get_by_id(db_conn, item.id)
    assert reloaded.status == target_stage
    assert len(reloaded.get_logs(db_conn)) == logs_before


@pytest.mark.parametrize("from_stage", ["pending", "cooking", "ready", "completed"])
def test_reopen_for_rework_from_all_active_stages_r04(db_conn, from_stage):
    """R04: Điều chỉnh / làm lại từ pending, cooking, ready, completed về pending, reset mốc giờ và giữ log cũ."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")
    waiter_id = _get_user_id(db_conn, "waiter_01")

    item = _create_sample_order_item(db_conn, note="Nướng vừa")
    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    if from_stage in ("cooking", "ready", "completed"):
        item.start_cooking(db_conn, by_user_id=cook_id)
        db_conn.execute("UPDATE OrderItem SET overdue_alerted = 1 WHERE id = ?;", (item.id,))
    if from_stage in ("ready", "completed"):
        item.mark_ready(db_conn, by_user_id=cook_id)
    if from_stage == "completed":
        item.mark_completed(db_conn, by_user_id=waiter_id)

    logs_before = len(item.get_logs(db_conn))
    item.reopen_for_rework(db_conn, new_note="Nướng cháy cạnh hơn", by_user_id=chef_id)

    assert item.status == "pending"
    assert item.note == "Nướng cháy cạnh hơn"
    assert item.started_at is None
    assert item.ready_at is None
    assert item.completed_at is None
    assert item.overdue_alerted == 0

    logs_after = item.get_logs(db_conn)
    assert len(logs_after) == logs_before + 1
    assert logs_after[-1]["from_status"] == from_stage
    assert logs_after[-1]["to_status"] == "pending"


def test_invalid_skip_transitions_and_terminal_cancelled(db_conn):
    """Kiểm tra từ chối chuyển nhảy cóc và từ trạng thái kết thúc cancelled."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")
    waiter_id = _get_user_id(db_conn, "waiter_01")

    item = _create_sample_order_item(db_conn)

    # awaiting_confirm không thể nhảy thẳng sang cooking / ready / completed
    with pytest.raises(InvalidStateTransitionError):
        item.start_cooking(db_conn, by_user_id=cook_id)
    with pytest.raises(InvalidStateTransitionError):
        item.mark_ready(db_conn, by_user_id=cook_id)

    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    # pending không thể nhảy thẳng sang ready hay completed
    with pytest.raises(InvalidStateTransitionError):
        item.mark_ready(db_conn, by_user_id=cook_id)
    with pytest.raises(InvalidStateTransitionError):
        item.mark_completed(db_conn, by_user_id=waiter_id)

    # cancelled là trạng thái kết thúc
    item.cancel(db_conn, by_user_id=chef_id)
    with pytest.raises(InvalidStateTransitionError):
        item.reopen_for_rework(db_conn, new_note="Đổi ý", by_user_id=chef_id)
    with pytest.raises(InvalidStateTransitionError):
        item.start_cooking(db_conn, by_user_id=cook_id)


def test_reassign_station_allowed_only_when_pending_r01(db_conn):
    """R01: Chỉ món 'pending' mới được điều chuyển sang trạm khác."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")

    item = _create_sample_order_item(db_conn)
    with pytest.raises(InvalidStateTransitionError):
        item.reassign_to(db_conn, "ST04")

    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    item.reassign_to(db_conn, "ST04")
    assert item.station_id == "ST04"

    item.start_cooking(db_conn, by_user_id=cook_id)
    with pytest.raises(InvalidStateTransitionError):
        item.reassign_to(db_conn, "ST02")


def test_get_by_id_not_found(db_conn):
    """Kiểm tra ném OrderItemNotFoundError khi ID không tồn tại."""
    with pytest.raises(OrderItemNotFoundError):
        OrderItem.get_by_id(db_conn, 99999)


def test_commit_false_supports_external_transaction_rollback(db_conn):
    """Kiểm tra commit=False cho phép Controller/InventoryService rollback đồng bộ theo R05."""
    chef_id = _get_user_id(db_conn, "bep_truong")
    cook_id = _get_user_id(db_conn, "bep_nuong")

    item = _create_sample_order_item(db_conn)
    item.confirm_dispatch(db_conn, "ST01", by_user_id=chef_id)
    item.start_cooking(db_conn, by_user_id=cook_id)

    item.mark_ready(db_conn, by_user_id=cook_id, commit=False)
    assert item.status == "ready"
    db_conn.rollback()

    reloaded = OrderItem.get_by_id(db_conn, item.id)
    assert reloaded.status == "cooking"
