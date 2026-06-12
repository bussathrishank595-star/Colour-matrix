import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, RefreshCw, ChevronDown, X,
  Package, Truck, CheckCircle, XCircle, Clock,
  IndianRupee, MapPin, Phone, User, Eye, Calendar
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  processing:       { label: 'Processing',  color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Package size={12} /> },
  confirmed:        { label: 'Confirmed',   color: 'bg-blue-50 text-blue-700 border-blue-200',       icon: <CheckCircle size={12} /> },
  shipped:          { label: 'Shipped',     color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Truck size={12} /> },
  out_for_delivery: { label: 'Out Delivery', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Truck size={12} /> },
  delivered:        { label: 'Delivered',   color: 'bg-green-50 text-green-700 border-green-200',    icon: <CheckCircle size={12} /> },
  cancelled:        { label: 'Cancelled',   color: 'bg-red-50 text-red-700 border-red-200',          icon: <XCircle size={12} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Order Detail Modal ─────────────────────────────────────
function OrderModal({ order, open, onClose, onStatusChange }) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (order) setStatus(order.orderStatus || ''); }, [order]);
  if (!open || !order) return null;

  const handleStatusSave = async () => {
    if (status === order.orderStatus) { onClose(); return; }
    setSaving(true);
    try {
      await api.put(`/orders/${order._id}/status`, { status });
      toast.success(`Order status updated to "${status}"`);
      onStatusChange();
      onClose();
    } catch { toast.error('Failed to update status'); }
    finally { setSaving(false); }
  };

  const addr = order.shippingAddress || {};

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-[var(--surface)] rounded-2xl w-full max-w-lg my-8 shadow-2xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <p className="font-bold text-[var(--text-primary)]">Order #{order._id?.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-[var(--text-muted)]">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.orderStatus} />
            <button onClick={onClose} className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
              <X size={17} className="text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer */}
          <div className="p-4 bg-[var(--surface-2)] rounded-xl space-y-2">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Customer</p>
            <div className="flex items-center gap-2 text-sm"><User size={14} className="text-[var(--brand-primary)]" />
              <span className="font-semibold text-[var(--text-primary)]">{order.user?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-[var(--brand-primary)]" />
              <span className="text-[var(--text-muted)]">{addr.phone || order.user?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-start gap-2 text-sm"><MapPin size={14} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
              <span className="text-[var(--text-muted)]">
                {[addr.houseNumber || addr.street, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'No address'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Items ({order.orderItems?.length || 0})</p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {(order.orderItems || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0]?.url
                      ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={14} className="text-[var(--text-muted)]" /></div>
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
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-primary)]/10 to-purple-500/10 rounded-xl border border-[var(--border)]">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <IndianRupee size={16} /> Order Total
            </span>
            <span className="text-xl font-black text-[var(--brand-primary)]">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Update Status */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Update Status</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="input-field w-full appearance-none pr-8">
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
              <button onClick={handleStatusSave} disabled={saving}
                className="px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2">
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Save
              </button>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-[var(--surface-2)] rounded-xl">
              <p className="text-[var(--text-muted)] mb-0.5">Payment Method</p>
              <p className="font-bold text-[var(--text-primary)] uppercase font-mono">{order.paymentMethod || 'N/A'}</p>
            </div>
            <div className="p-3 bg-[var(--surface-2)] rounded-xl">
              <p className="text-[var(--text-muted)] mb-0.5">Payment Status</p>
              <p className={`font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {order.paymentStatus || 'Pending'}
              </p>
            </div>
          </div>

          {/* UPI Transaction Details & Action */}
          {order.paymentMethod === 'upi' && (
            <div className="p-4 border border-blue-200 bg-blue-50/10 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)] font-semibold">UPI Transaction UTR (12-digit):</span>
                <span className="font-mono font-black text-blue-700 bg-blue-100/50 px-2.5 py-1 rounded-lg select-all">
                  {order.upiTxnId || 'N/A'}
                </span>
              </div>
              {order.paymentStatus !== 'paid' && (
                <button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.put(`/orders/${order._id}/status`, { paymentStatus: 'paid' });
                      toast.success('UPI Payment approved & order confirmed!');
                      onStatusChange();
                      onClose();
                    } catch {
                      toast.error('Failed to approve payment');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} /> Verify & Approve Payment (₹{order.totalAmount?.toLocaleString('en-IN')})
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Orders Page ───────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, sort: '-createdAt' });
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || data.count || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, filterStatus]);

  const filtered = orders.filter(o =>
    !search ||
    o._id?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: totalOrders,
    pending: orders.filter(o => o.orderStatus === 'processing').length,
    delivered: orders.filter(o => o.orderStatus === 'delivered').length,
    revenue: orders.filter(o => o.orderStatus !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">Orders</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{totalOrders} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', val: stats.total, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Processing', val: stats.pending, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Delivered', val: stats.delivered, color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Revenue', val: `₹${stats.revenue.toLocaleString('en-IN')}`, color: 'bg-purple-50 border-purple-200 text-purple-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.color}`}>
            <p className="text-xl font-black truncate">{s.val}</p>
            <p className="text-xs font-semibold mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by Order ID or customer name…" className="input-field w-full pl-10" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="input-field appearance-none pr-8 min-w-[160px]">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
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
            <ShoppingBag size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <motion.tr key={o._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[var(--text-primary)] font-mono">
                        #{o._id?.slice(-8).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[130px]">{o.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[130px]">{o.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {o.orderItems?.length || 0} item{o.orderItems?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[var(--text-primary)]">₹{o.totalAmount?.toLocaleString('en-IN')}</p>
                      <p className={`text-[10px] font-semibold capitalize ${o.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                        {o.paymentStatus || 'pending'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setSelectedOrder(o); setModalOpen(true); }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                page === p ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]'
              }`}>{p}</button>
          ))}
        </div>
      )}

      <OrderModal order={selectedOrder} open={modalOpen}
        onClose={() => setModalOpen(false)} onStatusChange={fetchOrders} />
    </div>
  );
}
