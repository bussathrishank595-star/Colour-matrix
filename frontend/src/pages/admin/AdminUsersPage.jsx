import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Shield, ShieldOff, UserCheck, UserX,
  Mail, Calendar, Phone, RefreshCw, ChevronDown, Eye
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

function Avatar({ name, size = 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['#e94560', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  const color = colors[name?.charCodeAt(0) % colors.length] || '#e94560';
  const sz = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}>
      {initials}
    </div>
  );
}

// ── User Detail Drawer ─────────────────────────────────────
function UserDrawer({ user, open, onClose, onUpdate }) {
  if (!open || !user) return null;

  const handleToggleRole = async () => {
    try {
      const newRole = user.role === 'admin' ? 'customer' : 'admin';
      await api.put(`/admin/users/${user._id}/role`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      onUpdate();
      onClose();
    } catch { toast.error('Failed to update role'); }
  };

  const handleToggleStatus = async () => {
    try {
      await api.put(`/admin/users/${user._id}/status`);
      toast.success(`User ${user.isActive ? 'blocked' : 'activated'}`);
      onUpdate();
      onClose();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--surface)] rounded-2xl w-full max-w-md shadow-2xl border border-[var(--border)]">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-[var(--text-primary)] truncate">{user.name}</p>
              <p className="text-sm text-[var(--text-muted)] truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>{user.role?.toUpperCase()}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  user.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                }`}>{user.isActive !== false ? 'Active' : 'Blocked'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-6">
            {[
              { icon: <Mail size={14} />, label: 'Email', val: user.email },
              { icon: <Phone size={14} />, label: 'Phone', val: user.phone || 'Not provided' },
              { icon: <Calendar size={14} />, label: 'Joined', val: new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: <UserCheck size={14} />, label: 'Orders', val: user.orderCount ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl">
                <span className="text-[var(--brand-primary)]">{row.icon}</span>
                <span className="text-[var(--text-muted)] w-16">{row.label}</span>
                <span className="text-[var(--text-primary)] font-medium">{row.val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleToggleRole}
              className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                user.role === 'admin'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
              }`}>
              <Shield size={15} />
              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
            </button>
            <button onClick={handleToggleStatus}
              className={`py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                user.isActive !== false
                  ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}>
              {user.isActive !== false ? <UserX size={15} /> : <UserCheck size={15} />}
              {user.isActive !== false ? 'Block User' : 'Activate'}
            </button>
          </div>

          <button onClick={onClose}
            className="w-full mt-3 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Users Page ────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.isActive !== false).length,
    blocked: users.filter(u => u.isActive === false).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">Users</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{stats.total} registered users</p>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', val: stats.total, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Admins', val: stats.admins, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'Active', val: stats.active, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Blocked', val: stats.blocked, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.color}`}>
            <p className="text-2xl font-black">{s.val}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…" className="input-field w-full pl-10" />
        </div>
        <div className="relative">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="input-field appearance-none pr-8 min-w-[140px]">
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  {['User', 'Email', 'Role', 'Status', 'Joined', 'Action'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[140px]">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)] max-w-[180px] truncate">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>{u.role?.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        u.isActive !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>{u.isActive !== false ? '● Active' : '● Blocked'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedUser(u); setDrawerOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 rounded-lg hover:bg-[var(--brand-primary)]/10 transition-colors">
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UserDrawer user={selectedUser} open={drawerOpen}
        onClose={() => setDrawerOpen(false)} onUpdate={fetchUsers} />
    </div>
  );
}
