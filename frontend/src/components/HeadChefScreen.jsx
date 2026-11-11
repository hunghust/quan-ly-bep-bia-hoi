import React from 'react';

/**
 * Giao diện Bếp trưởng (Head Chef) - Chuẩn bị cho PB-05
 * Các chức năng chính:
 * - Tiếp nhận đơn từ Waiter và bấm "Xác nhận" để tự động tách món xuống các trạm
 * - Theo dõi tổng quan tải của 4 trạm (Nướng, Xào, Bia, Chiên)
 * - Điều chuyển món giữa các trạm khi quá tải
 * - Quản lý trạng thái món (báo hết hàng) và cảnh báo tồn kho nguyên liệu
 */
export default function HeadChefScreen() {
  return (
    <div className="p-6 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <span>👨‍🍳</span> Màn Hình Bếp Trưởng (Head Chef Dashboard)
        </h2>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-mono">
          Vai trò: head_chef
        </span>
      </div>

      <p className="text-sm text-slate-300">
        Khung giao diện điều phối tổng quan toàn bộ khu bếp nhà hàng bia hơi:
      </p>

      <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
        <li>Khu vực duyệt đơn: Đơn mới gửi từ Waiter đang chờ xác nhận (awaiting_confirm).</li>
        <li>Khu vực tải trạm: Thống kê số món đang nấu tại từng trạm (ST01, ST02, ST03, ST04).</li>
        <li>Nút thao tác nhanh: Đổi trạm cho món khi trạm bị nghẽn, đánh dấu món hết hàng.</li>
      </ul>
    </div>
  );
}
