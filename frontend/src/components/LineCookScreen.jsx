import React from 'react';

/**
 * Giao diện Đầu bếp theo trạm (Line Cook) - Chuẩn bị cho PB-05
 * Các chức năng chính:
 * - Hiển thị các vé món thuộc trạm của mình theo thứ tự thời gian gửi (FIFO - sớm nhất lên đầu)
 * - Nút bấm chuyển trạng thái: "Bắt đầu nấu" (cooking) -> "Sẵn sàng ra đồ" (ready)
 * - Đồng hồ đếm thời gian và cảnh báo nhấp nháy đỏ khi món nấu quá 10 phút
 */
export default function LineCookScreen() {
  return (
    <div className="p-6 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
          <span>🔥</span> Màn Hình Đầu Bếp Trạm (Line Cook KDS)
        </h2>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-mono">
          Vai trò: line_cook
        </span>
      </div>

      <p className="text-sm text-slate-300">
        Khung giao diện màn hình hiển thị nhà bếp (KDS - Kitchen Display System) cho từng trạm:
      </p>

      <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
        <li>Bộ lọc theo trạm: Chọn trạm hiện tại (ST01 - Nướng, ST02 - Xào, ST03 - Bia, ST04 - Chiên).</li>
        <li>Danh sách vé món xếp theo hàng đợi (FIFO): Tên món, số lượng, bàn, thời gian chờ.</li>
        <li>Nút thao tác 1 chạm: "Nấu món" và "Hoàn tất ra đồ".</li>
      </ul>
    </div>
  );
}
