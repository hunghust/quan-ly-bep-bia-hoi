import React from 'react';

const STATUS_BADGES = {
  awaiting_confirm: {
    label: 'Chờ bếp trưởng duyệt',
    cardBorder: 'border-slate-600',
    badgeClass: 'bg-slate-700 text-slate-200 border-slate-500',
  },
  pending: {
    label: 'Chờ chế biến',
    cardBorder: 'border-amber-500/50',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  },
  cooking: {
    label: 'Đang nấu',
    cardBorder: 'border-sky-500',
    badgeClass: 'bg-sky-600/30 text-sky-200 border-sky-400',
  },
  ready: {
    label: 'Sẵn sàng ra đồ',
    cardBorder: 'border-emerald-500',
    badgeClass: 'bg-emerald-600/30 text-emerald-200 border-emerald-400',
  },
  completed: {
    label: 'Đã bưng ra bàn',
    cardBorder: 'border-teal-600/60',
    badgeClass: 'bg-teal-900/60 text-teal-200 border-teal-600',
  },
  cancelled: {
    label: 'Đã huỷ',
    cardBorder: 'border-rose-700/60',
    badgeClass: 'bg-rose-900/60 text-rose-200 border-rose-600',
  },
};

/**
 * Thẻ món ăn dùng chung cho toàn bộ hệ thống (PB-05 / MH-02).
 * - mode="menu": Hiển thị món trong thực đơn (chọn món, làm mờ & khóa khi hết hàng - R03).
 * - mode="ticket": Hiển thị thẻ món theo trạng thái tại Bếp trưởng, KDS trạm và danh sách cần bưng.
 */
export default function DishCard({
  mode = 'menu',
  dishName,
  stationLabel,
  price,
  isSoldOut = false,
  tableNo,
  quantity,
  note,
  status,
  isOverdue = false,
  elapsedText,
  onSelect,
  selectLabel = '+ Thêm món',
  children,
}) {
  if (mode === 'menu') {
    return (
      <div
        className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition ${
          isSoldOut
            ? 'bg-slate-900/50 border-slate-800 opacity-55'
            : 'bg-slate-800/80 border-slate-700 hover:border-amber-500/60'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-amber-300">
              {stationLabel}
            </span>
            {isSoldOut ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-rose-900/70 text-rose-200 border border-rose-600">
                Hết hàng
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Còn món
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-white leading-snug">{dishName}</h4>
          {typeof price === 'number' && price > 0 && (
            <p className="mt-1 text-sm font-mono text-amber-400">
              {price.toLocaleString('vi-VN')} đ
            </p>
          )}
        </div>

        {onSelect && (
          <button
            type="button"
            disabled={isSoldOut}
            onClick={onSelect}
            className={`min-h-[46px] w-full rounded-xl font-bold text-sm transition ${
              isSoldOut
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {isSoldOut ? 'Tạm ngưng phục vụ' : selectLabel}
          </button>
        )}
      </div>
    );
  }

  const statusMeta = STATUS_BADGES[status] || STATUS_BADGES.pending;

  return (
    <div
      className={`rounded-2xl border-2 p-4 bg-slate-800/90 flex flex-col justify-between gap-3 transition ${
        isOverdue ? 'border-rose-500 ring-2 ring-rose-500/40' : statusMeta.cardBorder
      }`}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {tableNo && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-amber-300 font-bold text-sm border border-slate-700">
                {tableNo}
              </span>
            )}
            {stationLabel && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-700 text-slate-200">
                {stationLabel}
              </span>
            )}
          </div>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusMeta.badgeClass}`}>
            {isOverdue ? 'QUÁ GIỜ • ' : ''}
            {statusMeta.label}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <h4 className="text-base sm:text-lg font-bold text-white leading-snug">{dishName}</h4>
          {quantity != null && (
            <span className="shrink-0 text-base font-extrabold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-lg">
              ×{quantity}
            </span>
          )}
        </div>

        {note && (
          <p className="text-sm text-amber-200 bg-amber-950/50 border border-amber-800/60 rounded-xl px-3 py-2">
            Ghi chú: <span className="font-medium">{note}</span>
          </p>
        )}

        {elapsedText && (
          <p className={`text-xs font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            ⏱ {elapsedText}
          </p>
        )}
      </div>

      {children && <div className="pt-2 border-t border-slate-700/70 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
