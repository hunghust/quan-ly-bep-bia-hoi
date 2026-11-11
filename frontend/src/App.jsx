import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);
  const [stations, setStations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API backend kiểm tra kết nối
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'offline' }));

    fetch('/api/stations')
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(() => setStations([]));

    fetch('/api/menu-items')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(() => setMenuItems([]));

    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 sticky top-0 z-50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🍻</span>
            <div>
              <h1 className="text-lg font-bold text-amber-400 leading-tight">
                Quản Lý Bếp Nhà Hàng Bia Hơi
              </h1>
              <p className="text-xs text-slate-400">
                Đồ án Quản trị dự án CNTT • Nhóm 13 (Sprint 1)
              </p>
            </div>
          </div>

          {/* Health Status Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
              <span className={`h-2.5 w-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="font-medium">
                {health?.status === 'healthy' ? `FastAPI + SQLite (WAL)` : 'Đang kết nối Backend...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Sprint 1 Banner */}
        <div className="bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-transparent border-l-4 border-amber-500 bg-slate-800/60 p-5 rounded-r-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 mb-2">
                Sprint 1: Tuần Khởi Động & Nền Tảng (PB-01 → PB-05)
              </span>
              <h2 className="text-xl font-bold text-white">
                Khung Dự Án Sẵn Sàng (Project Skeleton Initialized)
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                Backend FastAPI (SQLite WAL Mode) kết nối Frontend React 19 + Tailwind CSS.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                ✓ PB-01: Git & Setup
              </span>
              <span className="px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                ✓ PB-02: DB Schema WAL
              </span>
              <span className="px-3 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                ✓ PB-03: Seed Data
              </span>
              <span className="px-3 py-1 rounded-md bg-slate-700 text-slate-300">
                ⏳ PB-04: Polling
              </span>
              <span className="px-3 py-1 rounded-md bg-slate-700 text-slate-300">
                ⏳ PB-05: Layout
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Tổng Quan & Trạm Bếp
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'menu'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh Mục Món Ăn ({menuItems.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'roles'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Tài Khoản Phân Quyền ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === 'docs'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Quy Trình & Hướng Dẫn Git
            </button>
          </nav>
        </div>

        {/* Tab 1: Overview & Stations */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Các Trạm Bếp Được Thiết Lập (Kitchen Stations)
              </h3>
              <p className="text-sm text-slate-400">
                Đơn gọi món từ Waiter sẽ tự động tách về các trạm tương ứng theo định tuyến món.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stations.map(st => (
                <div key={st.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 hover:border-amber-500/50 transition">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                      {st.id}
                    </span>
                    <span className="text-emerald-400 text-xs">● Hoạt động</span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-2">{st.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick 3 Roles Preview */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                3 Màn Hình Theo Vai Trò (Chuẩn bị cho PB-05)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
                  <div className="text-2xl mb-2">🧑‍🍳</div>
                  <h4 className="font-bold text-white mb-1">Giao diện Phục Vụ (Waiter)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Tạo Order theo bàn, chọn món, xem món hết hàng theo thời gian thực, nhận báo chuông khi món đã "Sẵn sàng" (Ready).
                  </p>
                  <span className="text-xs text-amber-400/90 font-medium">Vai trò: waiter</span>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
                  <div className="text-2xl mb-2">👨‍💼</div>
                  <h4 className="font-bold text-white mb-1">Giao diện Bếp Trưởng (Head Chef)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Màn hình tổng quan, xác nhận Order từ Waiter, điều phối tải giữa các trạm, quản lý danh mục món & cảnh báo tồn kho.
                  </p>
                  <span className="text-xs text-amber-400/90 font-medium">Vai trò: head_chef</span>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
                  <div className="text-2xl mb-2">🔥</div>
                  <h4 className="font-bold text-white mb-1">Màn hình Trạm Bếp (Line Cook)</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Vé món theo thứ tự thời gian (FIFO), nút chuyển trạng thái "Đang nấu" → "Ra đồ", cảnh báo món quá giờ nấu (&gt; 10 phút).
                  </p>
                  <span className="text-xs text-amber-400/90 font-medium">Vai trò: line_cook</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Menu Items */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Danh Mục Món Nhậu Bia Hơi Mẫu</h3>
              <span className="text-xs text-slate-400">Nguồn: CSDL SQLite (bảng MenuItem & Station)</span>
            </div>
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Mã</th>
                    <th className="py-3 px-4">Tên món</th>
                    <th className="py-3 px-4">Trạm mặc định</th>
                    <th className="py-3 px-4 text-right">Đơn giá</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {menuItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-750">
                      <td className="py-3 px-4 font-mono text-slate-400">#{item.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-amber-300 font-mono">
                          {item.default_station_id} - {item.station_name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        {item.price.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          item.is_sold_out 
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700' 
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {item.is_sold_out ? 'Hết hàng' : 'Còn hàng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Tài Khoản Đăng Nhập Mẫu (Seed Data PB-03)</h3>
            <p className="text-sm text-slate-400">Mật khẩu mặc định cho toàn bộ tài khoản thử nghiệm: <code className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono">123456</code></p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      @{u.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                      {u.role}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1">{u.full_name}</h4>
                  <p className="text-xs text-slate-400">
                    Trạm phụ trách: <span className="text-slate-200">{u.station_name || 'Toàn hệ thống'}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Git Workflow & Docs */}
        {activeTab === 'docs' && (
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-amber-400">Quy Ước Nhánh & Commit Nhóm 13 (PB-01)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">1. Cấu Trúc Nhánh Git</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
                  <li><code className="text-amber-300 font-mono">main</code>: Nhánh sản phẩm ổn định, dùng để báo cáo và demo nghiệm thu với thầy.</li>
                  <li><code className="text-amber-300 font-mono">develop</code>: Nhánh tích hợp chính của nhóm, toàn bộ tính năng gộp vào đây trước.</li>
                  <li><code className="text-amber-300 font-mono">feature/pb-xx-...</code>: Nhánh làm việc độc lập của từng bạn.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white">2. Quy Ước Đặt Tên Commit</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
                  <li><code className="text-emerald-400 font-mono">PB-01: Cấu hình khung dự án backend và frontend</code></li>
                  <li><code className="text-emerald-400 font-mono">PB-04: Thêm API polling thông báo món sẵn sàng</code></li>
                  <li><code className="text-emerald-400 font-mono">PB-05: Hoàn thiện layout thanh điều hướng cho Waiter</code></li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h4 className="font-semibold text-white mb-2 text-sm">Lệnh Chạy Nhanh Cho Cả Nhóm:</h4>
              <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                <p className="text-slate-400"># 1. Chạy Backend (cửa sổ terminal 1):</p>
                <p className="text-amber-300">cd backend; .\venv\Scripts\uvicorn main:app --reload --port 8000</p>
                <p className="text-slate-400 mt-2"># 2. Chạy Frontend (cửa sổ terminal 2):</p>
                <p className="text-amber-300">cd frontend; npm run dev</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/90 py-4 text-center text-xs text-slate-500">
        Đồ án Quản trị dự án CNTT • Nhóm 13 • Quản lý bếp nhà hàng bia hơi • Đại học Bách Khoa Hà Nội
      </footer>
    </div>
  );
}
