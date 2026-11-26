import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import ConfirmModal from './ConfirmModal';
import { ROLE_LABELS, ROLE_NAV_ITEMS } from '../constants/navigation';

/**
 * Khung giao diện chung theo vai trò (PB-05 / MH-02).
 * - Chỉ hiển thị menu điều hướng thuộc vai trò hiện tại.
 * - Các nút điều hướng, chuông thông báo, đăng xuất đủ lớn cho thao tác cảm ứng trên tablet (NFR-04).
 */
export default function AppLayout({
  currentUser,
  activePage,
  onSelectPage,
  notifications = [],
  onMarkNotificationRead,
  onLogout,
  backendHealthy = false,
  demoUsers = [],
  onSwitchDemoUser,
  children,
}) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const navItems = ROLE_NAV_ITEMS[currentUser?.role] || [];
  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header cố định */}
      <header className="bg-slate-800/95 border-b border-slate-700 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Thương hiệu & trạng thái Backend */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍻</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-amber-400 leading-tight">
                  Bếp Bia Hơi — Nhóm 13
                </h1>
                <span
                  title={backendHealthy ? 'Backend sẵn sàng' : 'Mất kết nối Backend'}
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400">
                {currentUser?.full_name} • <span className="text-amber-300 font-medium">{roleLabel}</span>
                {currentUser?.station_name ? ` (${currentUser.station_name})` : ''}
              </p>
            </div>
          </div>

          {/* Cụm phải: Chuông thông báo + Nút Đăng xuất */}
          <div className="flex items-center gap-2.5">
            <NotificationBell
              notifications={notifications}
              onMarkRead={onMarkNotificationRead}
            />

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="min-h-[44px] px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/50 text-rose-200 font-semibold text-sm transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Thanh điều hướng theo vai trò + Bộ chuyển tài khoản xem thử cho giai đoạn chưa có PB-07 */}
        <div className="border-t border-slate-700/70 bg-slate-900/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
            <nav className="flex flex-wrap gap-2" aria-label="Điều hướng theo vai trò">
              {navItems.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPage(item.id)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-slate-950/15 text-slate-950' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {item.screenCode}
                    </span>
                  </button>
                );
              })}
            </nav>

            {demoUsers.length > 0 && onSwitchDemoUser && (
              <div className="flex items-center gap-2 text-xs">
                <label htmlFor="demo-user-select" className="text-slate-400 whitespace-nowrap">
                  Xem thử vai trò:
                </label>
                <select
                  id="demo-user-select"
                  value={currentUser?.username || ''}
                  onChange={(e) => onSwitchDemoUser(e.target.value)}
                  className="min-h-[40px] px-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 text-xs font-medium cursor-pointer"
                >
                  {demoUsers.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.full_name} [{u.role}{u.station_id ? ` - ${u.station_id}` : ''}]
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Nội dung trang */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      <ConfirmModal
        open={logoutModalOpen}
        title="Xác nhận đăng xuất"
        message={`Bạn có chắc muốn đăng xuất khỏi tài khoản "${currentUser?.full_name}"?`}
        confirmText="Đăng xuất"
        cancelText="Ở lại"
        variant="danger"
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={() => {
          setLogoutModalOpen(false);
          onLogout?.();
        }}
      />
    </div>
  );
}
