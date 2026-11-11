import React from 'react';

/**
 * Giao diện nhân viên phục vụ (Waiter) - Chuẩn bị cho PB-05
 * Các chức năng chính:
 * - Chọn số bàn (Bàn 01, Bàn 02...)
 * - Xem danh mục món ăn (thấy món nào hết hàng theo thời gian thực)
 * - Tạo và gửi đơn gọi món tới Bếp trưởng
 * - Nhận thông báo chuông khi món đã "Sẵn sàng" (ready) để mang ra cho khách
 */
export default function WaiterScreen() {
  return (
    <div className="p-6 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <span>🧑‍🍳</span> Màn Hình Phục Vụ (Waiter Dashboard)
        </h2>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-mono">
          Vai trò: waiter
        </span>
      </div>

      <p className="text-sm text-slate-300">
        Đây là khung giao diện dành cho nhân viên phục vụ. Bạn phụ trách PB-05 có thể bắt đầu xây dựng các thành phần:
      </p>

      <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
        <li>Danh sách chọn bàn ăn (Khu vực bàn sảnh / VIP).</li>
        <li>Bảng chọn món ăn kèm số lượng và ghi chú khẩu vị (ít cay, không hành...).</li>
        <li>Danh sách các món đã gọi và trạng thái (Đang chờ duyệt, Đang nấu, Đã ra đồ).</li>
      </ul>
    </div>
  );
}
