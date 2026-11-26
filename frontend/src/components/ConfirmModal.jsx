import React from 'react';

const VARIANT_STYLES = {
  primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  danger: 'bg-rose-600 hover:bg-rose-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
};

/**
 * Hộp thoại xác nhận dùng chung (PB-05 / MH-02).
 * Thiết kế nút bấm kích thước lớn (>= 48px) hỗ trợ thao tác cảm ứng trên tablet (NFR-04).
 */
export default function ConfirmModal({
  open,
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ bỏ',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <h3 id="confirm-modal-title" className="text-lg font-bold text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700/80 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 font-semibold text-sm hover:bg-slate-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`min-h-[48px] px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm active:scale-[0.99] transition disabled:opacity-50 cursor-pointer ${confirmClass}`}
          >
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
