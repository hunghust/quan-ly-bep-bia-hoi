import React, { useEffect, useState } from 'react';
import AppLayout from './components/AppLayout';
import { ROLE_NAV_ITEMS } from './constants/navigation';
import DishCard from './components/DishCard';
import ConfirmModal from './components/ConfirmModal';
import {
  getHealth,
  getMenuItems,
  getNotifications,
  getTables,
  getUsers,
  logout,
  markNotificationRead,
} from './services/api';

const FALLBACK_USER = {
  id: 6,
  username: 'waiter_01',
  full_name: 'Phạm Minh Tuấn (Phục Vụ)',
  role: 'waiter',
  station_id: null,
  station_name: null,
};

export default function App() {
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [users, setUsers] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [currentUser, setCurrentUser] = useState(FALLBACK_USER);
  const [activePage, setActivePage] = useState(ROLE_NAV_ITEMS.waiter[0].id);

  const [confirmSampleOpen, setConfirmSampleOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Nạp dữ liệu nền tảng (PB-03) từ Backend
  useEffect(() => {
    getHealth()
      .then((h) => setBackendHealthy(h?.status === 'healthy'))
      .catch(() => setBackendHealthy(false));

    getUsers()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setUsers(list);
          const defaultWaiter = list.find((u) => u.role === 'waiter') || list[0];
          setCurrentUser(defaultWaiter);
          setActivePage(ROLE_NAV_ITEMS[defaultWaiter.role][0].id);
        }
      })
      .catch(() => {});

    getTables().then(setTables).catch(() => {});
    getMenuItems().then(setMenuItems).catch(() => {});
  }, []);

  // Nạp thông báo theo vai trò/trạm hiện tại (PB-04 / PB-05)
  useEffect(() => {
    if (!currentUser) return;
    getNotifications({
      role: currentUser.role,
      stationId: currentUser.station_id,
    }).then(setNotifications);
  }, [currentUser]);

  function handleSwitchDemoUser(username) {
    const found = users.find((u) => u.username === username);
    if (!found) return;
    setCurrentUser(found);
    const firstTab = ROLE_NAV_ITEMS[found.role]?.[0]?.id || '';
    setActivePage(firstTab);
    setStatusMessage('');
  }

  async function handleMarkNotificationRead(id) {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  async function handleLogout() {
    await logout();
    setStatusMessage('Đã kích hoạt luồng Đăng xuất (sẽ chuyển về màn MH-01 sau khi làm PB-07 & PB-08).');
  }

  return (
    <AppLayout
      currentUser={currentUser}
      activePage={activePage}
      onSelectPage={setActivePage}
      notifications={notifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onLogout={handleLogout}
      backendHealthy={backendHealthy}
      demoUsers={users}
      onSwitchDemoUser={handleSwitchDemoUser}
    >
      {statusMessage && (
        <div className="mb-5 rounded-xl bg-amber-500/15 border border-amber-500/40 px-4 py-3 text-sm text-amber-200 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-xs font-bold px-2 py-1 text-amber-300 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Khung trang Waiter: Tạo order (MH-W1) */}
      {activePage === 'waiter_order' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">
                Tạo Order Mới (Khung MH-W1)
              </h2>
              <p className="text-sm text-slate-400">
                Dữ liệu thật từ SQLite: {tables.length} bàn sẵn sàng • {menuItems.length} món trong thực đơn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmSampleOpen(true)}
              className="min-h-[46px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Thử hộp thoại xác nhận (ConfirmModal)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <DishCard
                key={item.id}
                mode="menu"
                dishName={item.name}
                stationLabel={`${item.default_station_id} • ${item.station_name}`}
                price={item.price}
                isSoldOut={item.is_sold_out}
                onSelect={() =>
                  setStatusMessage(`Đã bấm thử thẻ món "${item.name}" — sẵn sàng nối giỏ order ở PB-11.`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Khung trang Waiter: Đơn & Món cần bưng (MH-W2) */}
      {activePage === 'waiter_ready' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">Đơn Của Bàn & Món Cần Bưng (Khung MH-W2)</h2>
            <p className="text-sm text-slate-400">
              Hiển thị thẻ vé món dùng chung khi bếp báo hoàn thành (`ready`) để Waiter bấm Đã bưng (PB-18).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DishCard
              mode="ticket"
              tableNo="Bàn 01"
              stationLabel="ST01 - Trạm Nướng"
              dishName="Chân gà nướng muối ớt (Đĩa 6 chiếc)"
              quantity={2}
              note="Nướng kỹ, thêm muối ớt xanh"
              status="ready"
              elapsedText="Xong cách đây 1 phút"
            >
              <button
                type="button"
                onClick={() => setConfirmSampleOpen(true)}
                className="min-h-[46px] flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
              >
                Đã bưng ra bàn
              </button>
            </DishCard>
          </div>
        </div>
      )}

      {/* Khung trang Bếp trưởng: Order chờ xác nhận (MH-B1) */}
      {activePage === 'chef_pending' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">Order Tổng Chờ Xác Nhận (Khung MH-B1)</h2>
            <p className="text-sm text-slate-400">
              Khu vực tiếp nhận đơn từ Waiter và bấm Xác nhận để tách món xuống các trạm (PB-12, PB-13).
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DishCard
              mode="ticket"
              tableNo="Bàn 03"
              stationLabel="Đơn tổng chờ duyệt"
              dishName="Bò xào cần tỏi"
              quantity={1}
              note="Ít dầu, nhiều tỏi"
              status="awaiting_confirm"
              elapsedText="Vừa gửi từ waiter_01"
            >
              <button
                type="button"
                onClick={() => setConfirmSampleOpen(true)}
                className="min-h-[46px] flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
              >
                Xác nhận tách trạm
              </button>
            </DishCard>
          </div>
        </div>
      )}

      {/* Khung trang Bếp trưởng: Sơ đồ trạm (MH-B2) */}
      {activePage === 'chef_board' && (
        <div className="rounded-2xl bg-slate-800/70 border border-slate-700 p-6 space-y-2">
          <h2 className="text-xl font-bold text-white">Sơ Đồ Món Theo Trạm (Khung MH-B2)</h2>
          <p className="text-sm text-slate-300">
            Khung điều hướng sẵn sàng cho màn hình sơ đồ tải 4 trạm bếp và điều chuyển món (PB-23, PB-25 ở Sprint 2).
          </p>
        </div>
      )}

      {/* Khung trang Đầu bếp trạm: KDS trạm (MH-K1) */}
      {activePage === 'cook_kds' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">
              Màn Hình KDS — {currentUser.station_name || currentUser.station_id} (Khung MH-K1)
            </h2>
            <p className="text-sm text-slate-400">
              Hiển thị thẻ món của trạm theo thứ tự gửi (FIFO) kèm đồng hồ 10 phút và nút chuyển trạng thái (PB-15, PB-16, PB-17).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DishCard
              mode="ticket"
              tableNo="Bàn 02"
              stationLabel={currentUser.station_id || 'ST01'}
              dishName="Dải lợn nướng than hoa"
              quantity={1}
              status="pending"
              elapsedText="Chờ 2 phút"
            >
              <button
                type="button"
                onClick={() => setStatusMessage('Nút mẫu "Nhận món" trên MH-K1 — sẽ nối KitchenController ở PB-16.')}
                className="min-h-[46px] flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm cursor-pointer"
              >
                Nhận món
              </button>
            </DishCard>

            <DishCard
              mode="ticket"
              tableNo="Bàn 04"
              stationLabel={currentUser.station_id || 'ST01'}
              dishName="Chân gà nướng muối ớt (Đĩa 6 chiếc)"
              quantity={2}
              note="Làm cháy cạnh"
              status="cooking"
              elapsedText="Đang nấu 04:15 / 10:00"
            >
              <button
                type="button"
                onClick={() => setStatusMessage('Nút mẫu "Hoàn thành" trên MH-K1 — sẽ nối KitchenController ở PB-17.')}
                className="min-h-[46px] flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm cursor-pointer"
              >
                Hoàn thành
              </button>
            </DishCard>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmSampleOpen}
        title="Hộp thoại xác nhận dùng chung"
        message="Đây là thành phần ConfirmModal của PB-05, thiết kế nút bấm lớn cho thao tác cảm ứng trên tablet."
        confirmText="Đồng ý"
        cancelText="Đóng"
        onCancel={() => setConfirmSampleOpen(false)}
        onConfirm={() => {
          setConfirmSampleOpen(false);
          setStatusMessage('Đã xác nhận qua ConfirmModal dùng chung.');
        }}
      />
    </AppLayout>
  );
}
