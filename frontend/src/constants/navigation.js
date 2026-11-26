export const ROLE_LABELS = {
  waiter: 'Nhân viên phục vụ',
  head_chef: 'Bếp trưởng',
  line_cook: 'Đầu bếp trạm',
};

// Cấu hình menu điều hướng riêng cho từng vai trò (PB-05 & R10)
export const ROLE_NAV_ITEMS = {
  waiter: [
    { id: 'waiter_order', label: 'Tạo order', screenCode: 'MH-W1', icon: '📝' },
    { id: 'waiter_ready', label: 'Đơn & Món cần bưng', screenCode: 'MH-W2', icon: '🍽️' },
  ],
  head_chef: [
    { id: 'chef_pending', label: 'Order chờ xác nhận', screenCode: 'MH-B1', icon: '📥' },
    { id: 'chef_board', label: 'Sơ đồ trạm', screenCode: 'MH-B2', icon: '📊' },
  ],
  line_cook: [
    { id: 'cook_kds', label: 'Màn hình trạm bếp', screenCode: 'MH-K1', icon: '🔥' },
  ],
};
