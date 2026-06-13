import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, ShoppingBag, MapPin, Lock,
  Edit3, Save, X, Plus, Trash2, RefreshCw, Eye,
  Package, Truck, CheckCircle, XCircle, Clock,
  ChevronRight, Star, LogOut, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';

/* ── Status helpers ───────────────────────────────────────── */
const STATUS = {
  processing:       { label: 'Processing',       color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <Package size={11} /> },
  confirmed:        { label: 'Confirmed',        color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <CheckCircle size={11} /> },
  shipped:          { label: 'Shipped',          color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Truck size={11} /> },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Truck size={11} /> },
  delivered:        { label: 'Delivered',        color: 'text-green-600 bg-green-50 border-green-200',    icon: <CheckCircle size={11} /> },
  cancelled:        { label: 'Cancelled',        color: 'text-red-600 bg-red-50 border-red-200',          icon: <XCircle size={11} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/* ── Avatar ───────────────────────────────────────────────── */
function Avatar({ name, size = 60 }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white shadow-lg flex-shrink-0"
      style={{ width: size, height: size, fontSize: size / 2.5, background: 'linear-gradient(135deg,#e94560,#c0392b)' }}>
      {initials}
    </div>
  );
}

/* ── Tab Nav ──────────────────────────────────────────────── */
const TABS = [
  { id: 'profile',  label: 'My Profile',    icon: User },
  { id: 'orders',   label: 'My Orders',     icon: ShoppingBag },
  { id: 'address',  label: 'Addresses',     icon: MapPin },
  { id: 'password', label: 'Change Password', icon: Lock },
];

/* ─────────────────────────────────────────────────────────── */
/*  TAB 1 — Profile Edit                                       */
/* ─────────────────────────────────────────────────────────── */
function ProfileTab({ user, onUpdated }) {
  const { updateProfile } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const result = await updateProfile(form);
    if (result.success) onUpdated();
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <Avatar name={user?.name} size={72} />
        <div>
          <h2 className="text-xl font-black text-[var(--text-primary)] font-['Outfit']">{user?.name}</h2>
          <p className="text-sm text-[var(--text-muted)]">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full uppercase">
              {user?.role}
            </span>
            {user?.isEmailVerified && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full flex items-center gap-1">
                <Shield size={9} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h3 className="font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <Edit3 size={16} className="text-[var(--brand-primary)]" /> Edit Profile
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                  className="input-field w-full pl-10" placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field w-full pl-10" placeholder="+91 9XXXXXXXXX" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={user?.email} disabled className="input-field w-full pl-10 opacity-50 cursor-not-allowed" />
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Email cannot be changed</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-6 grid sm:grid-cols-2 gap-4">
        {[
          { label: 'Member Since', val: new Date(user?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
          { label: 'Last Login', val: user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'N/A' },
        ].map(row => (
          <div key={row.label} className="p-4 bg-[var(--surface-2)] rounded-xl">
            <p className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wide mb-1">{row.label}</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">{row.val}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  TAB 2 — My Orders                                          */
/* ─────────────────────────────────────────────────────────── */
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/orders/my-orders')
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  if (orders.length === 0) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="card p-12 text-center">
      <ShoppingBag size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No orders yet</h3>
      <p className="text-sm text-[var(--text-muted)] mb-5">You haven't placed any orders. Start shopping!</p>
      <a href="/products" className="btn-primary inline-flex">Browse Products</a>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
      {orders.map((order, i) => (
        <motion.div key={order._id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className="card overflow-hidden">
          {/* Order header */}
          <button
            onClick={() => setExpanded(expanded === order._id ? null : order._id)}
            className="w-full flex items-center gap-4 p-4 hover:bg-[var(--surface-2)] transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={18} className="text-[var(--brand-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  #{order._id?.slice(-8).toUpperCase()}
                </p>
                <StatusBadge status={order.orderStatus} />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black text-[var(--brand-primary)]">
                ₹{order.totalAmount?.toLocaleString('en-IN')}
              </p>
              <ChevronRight size={14} className={`ml-auto text-[var(--text-muted)] transition-transform ${expanded === order._id ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {/* Expanded items */}
          <AnimatePresence>
            {expanded === order._id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-[var(--border)]">
                <div className="p-4 space-y-3">
                  {(order.orderItems || []).map((item, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0]?.url
                          ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          : <Package size={18} className="m-auto text-[var(--text-muted)] mt-3" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{item.product?.name || item.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                        {item.colorVariant && <p className="text-[10px] text-[var(--brand-primary)] font-bold">Colour: {item.colorVariant}</p>}
                      </div>
                      <p className="text-sm font-bold text-[var(--text-primary)] flex-shrink-0">
                        ₹{(item.quantity * item.price)?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}

                  {/* Shipping address if available */}
                  {order.shippingAddress && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-start gap-2 text-xs text-[var(--text-muted)]">
                      <MapPin size={13} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
                      <span>
                        Deliver to: {[
                          order.shippingAddress.houseNumber || order.shippingAddress.street,
                          order.shippingAddress.street,
                          order.shippingAddress.area,
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.pincode
                        ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Payment */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)] capitalize">
                      Payment Method: <strong className="uppercase font-mono">{order.paymentMethod || 'N/A'}</strong>
                      {order.upiTxnId && <span> (UTR: <strong className="font-mono">{order.upiTxnId}</strong>)</span>}
                    </span>
                    <span className={`text-xs font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  TAB 3 — Addresses                                          */
/* ─────────────────────────────────────────────────────────── */
const EMPTY_ADDR = { street: '', city: '', state: '', pincode: '', phone: '', isDefault: false };

function AddressTab({ user }) {
  const { fetchMe } = useAuthStore();
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDR);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    await fetchMe();
    const r = await api.get('/auth/me');
    setAddresses(r.data.user?.addresses || []);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.street || !form.city || !form.state || !form.pincode) {
      toast.error('Street, City, State and Pincode are required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/address', form);
      toast.success('Address added!');
      setForm(EMPTY_ADDR);
      setShowForm(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/address/${id}`);
      toast.success('Address removed');
      refresh();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
          <Plus size={15} /> Add Address
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">New Address</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))}
                placeholder="Street / House No. / Area *" className="input-field w-full" required />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="City *" className="input-field w-full" required />
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  placeholder="State *" className="input-field w-full" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                  placeholder="Pincode *" className="input-field w-full" required maxLength={6} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone (optional)" className="input-field w-full" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isDefault}
                  onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))}
                  className="w-4 h-4 accent-[var(--brand-primary)]" />
                <span className="text-[var(--text-secondary)]">Set as default address</span>
              </label>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY_ADDR); }}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Address
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="card p-10 text-center">
          <MapPin size={40} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
          <p className="text-[var(--text-muted)]">No saved addresses yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr, i) => (
            <motion.div key={addr._id || i}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`card p-4 flex items-start gap-4 ${addr.isDefault ? 'border-[var(--brand-primary)] border' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin size={16} className="text-[var(--brand-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{addr.street}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                </p>
                {addr.phone && <p className="text-xs text-[var(--text-muted)]">📞 {addr.phone}</p>}
                {addr.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full mt-1 inline-block">
                    ★ Default
                  </span>
                )}
              </div>
              <button onClick={() => handleDelete(addr._id)}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  TAB 4 — Change Password                                    */
/* ─────────────────────────────────────────────────────────── */
function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ cur: false, new: false, con: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully! 🔒');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const PasswordInput = ({ field, placeholder, showKey }) => (
    <div className="relative">
      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        type={show[showKey] ? 'text' : 'password'}
        value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        placeholder={placeholder}
        required
        className="input-field w-full pl-10 pr-11"
      />
      <button type="button" onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
        <Eye size={15} />
      </button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="card p-6 max-w-md">
        <h3 className="font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
          <Lock size={16} className="text-[var(--brand-primary)]" /> Change Password
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Current Password</label>
            <PasswordInput field="currentPassword" placeholder="Enter current password" showKey="cur" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">New Password</label>
            <PasswordInput field="newPassword" placeholder="Min 6 characters" showKey="new" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Confirm New Password</label>
            <PasswordInput field="confirmPassword" placeholder="Re-enter new password" showKey="con" />
          </div>

          {/* Strength indicator */}
          {form.newPassword && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(n => {
                  const strength = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(form.newPassword)).length;
                  return (
                    <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= strength
                      ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-orange-400' : strength <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                      : 'bg-[var(--border)]'}`} />
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">Use uppercase, numbers & symbols for a stronger password</p>
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-[var(--brand-primary)] text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Profile Page                                           */
/* ─────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, logout, fetchMe } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Refresh user data when page mounts
  useEffect(() => { fetchMe(); }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw size={24} className="animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--surface-2)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit']">My Account</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage your profile, orders, and preferences</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1 space-y-3">
            {/* Profile mini card */}
            <div className="card p-4 flex items-center gap-3">
              <Avatar name={user.name} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
              </div>
            </div>

            {/* Tabs */}
            <nav className="card p-2 space-y-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                      activeTab === tab.id
                        ? 'bg-[var(--brand-primary)] text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]'
                    }`}>
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}

              <div className="pt-1 border-t border-[var(--border)] mt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </nav>
          </motion.div>

          {/* Main content */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {activeTab === 'profile'  && <ProfileTab key="profile"  user={user} onUpdated={fetchMe} />}
              {activeTab === 'orders'   && <OrdersTab  key="orders" />}
              {activeTab === 'address'  && <AddressTab key="address" user={user} />}
              {activeTab === 'password' && <PasswordTab key="password" />}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
