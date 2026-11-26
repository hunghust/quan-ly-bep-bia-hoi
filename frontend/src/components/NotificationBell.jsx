import React, { useState, useRef, useEffect } from 'react';

const TYPE_META = {
  order_new: { label: 'Order mới', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  order_updated: { label: 'Cập nhật order', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  item_new: { label: 'Món mới về trạm', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  item_ready: { label: 'Món sẵn sàng', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  item_overdue: { label: 'Quá giờ nấu', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  item_cancel_rejected: { label: 'Từ chối huỷ', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  low_stock: { label: 'Tồn kho thấp', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  menu_changed: { label: 'Đổi thực đơn', badge: 'bg-slate-600/40 text-slate-200 border-slate-500' },
};

function formatPayload(rawPayload) {
  if (!rawPayload) return 'Có thông báo mới';
  try {
    const obj = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    if (obj.message) return obj.message;
    const parts = [];
    if (obj.table_no) parts.push(obj.table_no);
    if (obj.dish_name) parts.push(obj.dish_name);
    if (obj.quantity) parts.push(`x${obj.quantity}`);
    return parts.length > 0 ? parts.join(' • ') : String(rawPayload);
  } catch {
    return String(rawPayload);
  }
}

/**
 * Chuông thông báo dùng chung (PB-05 / MH-02).
 * Sẵn sàng nối polling từ PB-04 để cập nhật danh sách theo vai trò & trạm.
 */
export default function NotificationBell({ notifications = [], onMarkRead }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Thông báo"
        className="relative min-h-[44px] min-w-[44px] px-3 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-amber-500/60 flex items-center justify-center gap-2 text-slate-200 transition cursor-pointer"
      >
        <span className="text-lg">🔔</span>
        <span className="hidden sm:inline text-xs font-semibold">Thông báo</span>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-600 text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm font-bold text-white">
              Thông báo ({unreadCount} chưa đọc)
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
            >
              Đóng
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-700/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Chưa có thông báo mới nào.
              </div>
            ) : (
              notifications.map((item) => {
                const meta = TYPE_META[item.type] || {
                  label: item.type,
                  badge: 'bg-slate-700 text-slate-200 border-slate-600',
                };
                const isUnread = !item.read_at;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition ${isUnread ? 'bg-slate-800' : 'bg-slate-900/40 opacity-70'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${meta.badge}`}>
                        {meta.label}
                      </span>
                      {isUnread && onMarkRead && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(item.id)}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 rounded cursor-pointer"
                        >
                          Đã đọc
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-100 leading-snug">
                      {formatPayload(item.payload)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
