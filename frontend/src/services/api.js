/**
 * Tầng dịch vụ API chuẩn hóa theo Hợp đồng API Sprint 1 (docs/API_Contract_Sprint1.md).
 *
 * Cơ chế hoạt động:
 * - Luôn ưu tiên gọi Backend thật tại `/api/...`.
 * - Chỉ tự động chuyển sang dữ liệu giả lập (mock) khi endpoint Backend trả về 404
 *   (tức chức năng Backend đó đang được thành viên khác phát triển) hoặc khi bật FORCE_MOCK.
 * - Mọi lỗi nghiệp vụ thật từ Backend (400, 401, 403, 409, 422) đều được giữ nguyên để UI hiển thị.
 */

const TOKEN_KEY = 'kbh_auth_token';
const USER_KEY = 'kbh_auth_user';
const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK === 'true';

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.detail || data?.message || `Lỗi máy chủ (${response.status})`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

/**
 * Gọi endpoint thật; chỉ fallback sang mockFn nếu endpoint chưa tồn tại trên server (HTTP 404).
 */
async function requestWithMockFallback(path, options, mockFn) {
  if (FORCE_MOCK) {
    return mockFn();
  }
  try {
    return await request(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && typeof mockFn === 'function') {
      return mockFn();
    }
    throw err;
  }
}

// ============================================================================
// Dữ liệu mock tạm thời khớp Hợp đồng API Sprint 1 (cho các endpoint chưa xong)
// ============================================================================
let mockState = {
  notifications: [
    {
      id: 1,
      target_role: 'head_chef',
      target_station_id: null,
      type: 'order_new',
      payload: JSON.stringify({ table_no: 'Bàn 03', message: 'Bàn 03 vừa gửi order mới (3 món)' }),
      created_at: new Date(Date.now() - 120000).toISOString(),
      read_at: null,
    },
    {
      id: 2,
      target_role: 'waiter',
      target_station_id: null,
      type: 'item_ready',
      payload: JSON.stringify({ table_no: 'Bàn 01', dish_name: 'Chân gà nướng muối ớt', quantity: 2 }),
      created_at: new Date(Date.now() - 45000).toISOString(),
      read_at: null,
    },
    {
      id: 3,
      target_role: 'line_cook',
      target_station_id: 'ST01',
      type: 'item_new',
      payload: JSON.stringify({ table_no: 'Bàn 05', dish_name: 'Dải lợn nướng than hoa', quantity: 1 }),
      created_at: new Date(Date.now() - 30000).toISOString(),
      read_at: null,
    },
  ],
};

// ============================================================================
// Các API Nền tảng đã chạy thật trên Backend
// ============================================================================
export const getHealth = () => request('/api/health');
export const getStations = () => request('/api/stations');
export const getTables = () => request('/api/tables');
export const getMenuItems = () => request('/api/menu-items');
export const getUsers = () => request('/api/users');

// ============================================================================
// Thông báo (PB-04) - đọc thật từ /api/notifications, bổ sung mock khi DB trống để preview
// ============================================================================
export async function getNotifications({ role, stationId, sinceId } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (stationId) params.set('station_id', stationId);
  if (sinceId) params.set('since_id', String(sinceId));

  try {
    const rows = await request(`/api/notifications?${params.toString()}`);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
    // Khi bảng Notification chưa có sự kiện thực tế nào, lọc từ mock preview cho PB-05
    return mockState.notifications.filter((n) => {
      const matchRole = !role || !n.target_role || n.target_role === role;
      const matchStation = !stationId || !n.target_station_id || n.target_station_id === stationId;
      return matchRole && matchStation;
    });
  } catch {
    return [];
  }
}

export function markNotificationRead(notificationId) {
  return requestWithMockFallback(
    `/api/notifications/${notificationId}/read`,
    { method: 'PUT' },
    () => {
      const now = new Date().toISOString();
      mockState.notifications = mockState.notifications.map((n) =>
        n.id === notificationId ? { ...n, read_at: now } : n
      );
      return { id: notificationId, read_at: now };
    }
  );
}

// ============================================================================
// Xác thực (PB-06, PB-08)
// ============================================================================
export async function login(username, password) {
  return requestWithMockFallback(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    async () => {
      const users = await getUsers();
      const matched = users.find((u) => u.username === username);
      if (!matched || password !== '123456') {
        throw new ApiError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
      }
      return {
        token: `mock-token-${matched.username}`,
        expires_in: 28800,
        user: matched,
        isMock: true,
      };
    }
  );
}

export async function logout() {
  try {
    return await requestWithMockFallback(
      '/api/auth/logout',
      { method: 'POST' },
      () => ({ message: 'Đã đăng xuất (mock).' })
    );
  } finally {
    clearSession();
  }
}

// ============================================================================
// Order & Điều phối (PB-10, PB-12, PB-13) & KDS (PB-15..PB-18)
// ============================================================================
export function createOrder(payload) {
  return requestWithMockFallback(
    '/api/orders',
    { method: 'POST', body: JSON.stringify(payload) },
    () => ({
      id: Math.floor(Math.random() * 1000) + 100,
      table_no: payload.table_no,
      status: 'awaiting_confirm',
      created_at: new Date().toISOString(),
      items: payload.items,
      isMock: true,
    })
  );
}

export function getPendingOrders() {
  return requestWithMockFallback('/api/orders?status=awaiting_confirm', {}, () => []);
}

export function confirmOrder(orderId) {
  return requestWithMockFallback(
    `/api/orders/${orderId}/confirm`,
    { method: 'PUT' },
    () => ({ id: orderId, status: 'confirmed', already_confirmed: false, isMock: true })
  );
}

export function getStationItems(stationId) {
  return requestWithMockFallback(`/api/stations/${stationId}/items`, {}, () => []);
}

export function getReadyItems() {
  return requestWithMockFallback('/api/order-items/ready', {}, () => []);
}

export function changeItemStatus(itemId, status) {
  return requestWithMockFallback(
    `/api/order-items/${itemId}/status`,
    { method: 'PUT', body: JSON.stringify({ status }) },
    () => ({ id: itemId, status, isMock: true })
  );
}
