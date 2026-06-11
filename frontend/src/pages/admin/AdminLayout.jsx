import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Users, TrendingUp,
  Settings, LogOut, Menu, X, Paintbrush, AlertCircle, Bell, Pipette
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/axios';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/color-analyzer', label: 'Color Analyzer', icon: Pipette, badge: 'AI' },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setSummary(res.data.summary || {}))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--surface-2)] flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{ x: sidebarOpen ? 0 : -260 }}
        className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--brand-dark)] z-30 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center">
              <Paintbrush size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Smart Paint</p>
              <p className="text-gray-500 text-[10px]">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              id={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick stats */}
        <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{summary.totalOrders || 0}</p>
            <p className="text-gray-500 text-[10px]">Orders</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white font-bold text-lg">{summary.totalUsers || 0}</p>
            <p className="text-gray-500 text-[10px]">Users</p>
          </div>
        </div>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
            id="admin-logout"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            id="sidebar-toggle"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="badge badge-success text-xs">● Live</span>
            <Link to="/" className="text-sm text-[var(--brand-primary)] hover:underline">
              ← View Store
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
