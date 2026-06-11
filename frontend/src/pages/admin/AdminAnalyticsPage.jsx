import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, IndianRupee, Users,
  Package, BarChart2, RefreshCw, ArrowUp, ArrowDown,
  Star, Calendar
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

// ── Simple bar chart using divs ────────────────────────────
function BarChart({ data, color = 'var(--brand-primary)' }) {
  if (!data?.length) return <p className="text-center text-[var(--text-muted)] text-sm py-8">No data yet</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  const months = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="flex items-end gap-2 h-40 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-[var(--text-muted)] font-semibold">
            ₹{d.value >= 1000 ? (d.value/1000).toFixed(1)+'k' : d.value}
          </span>
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
            transition={{ duration: 0.6, delay: i * 0.05 }}
            className="w-full rounded-t-lg min-h-1"
            style={{ background: color }}
          />
          <span className="text-[9px] text-[var(--text-muted)]">{months[d.month]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, change }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">{value}</p>
      <p className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        api.get('/orders/admin/analytics'),
        api.get('/admin/dashboard'),
      ]);
      setAnalytics(aRes.data.analytics);
      setDashboard(dRes.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={28} className="animate-spin text-[var(--brand-primary)]" />
    </div>
  );

  const monthlyData = (analytics?.monthlyRevenue || []).map(m => ({
    month: m._id.month,
    value: Math.round(m.revenue),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">Analytics</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Store performance overview</p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue" color="bg-[var(--brand-primary)]"
          value={`₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          sub="From paid orders" />
        <StatCard icon={ShoppingBag} label="Total Orders" color="bg-blue-500"
          value={analytics?.totalOrders || 0}
          sub={`${analytics?.paidOrders || 0} paid`} />
        <StatCard icon={Users} label="Total Users" color="bg-purple-500"
          value={dashboard?.totalUsers || 0}
          sub="Registered accounts" />
        <StatCard icon={Package} label="Products" color="bg-green-500"
          value={dashboard?.totalProducts || 0}
          sub="In catalogue" />
      </div>

      {/* Order status breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Pending', val: analytics?.pendingOrders || 0, color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
          { label: 'Confirmed / Processing', val: (analytics?.processingOrders || 0), color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Delivered', val: analytics?.deliveredOrders || 0, color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-2xl border ${s.color}`}>
            <p className="text-3xl font-black">{s.val}</p>
            <p className="text-sm font-bold mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
            <BarChart2 size={16} className="text-[var(--brand-primary)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Monthly Revenue</h3>
            <p className="text-xs text-[var(--text-muted)]">Last 6 months</p>
          </div>
        </div>
        <BarChart data={monthlyData} />
      </div>

      {/* Top products + Recent orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <h3 className="font-bold text-[var(--text-primary)]">Top Selling Products</h3>
          </div>
          {(analytics?.topProducts || []).length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {(analytics?.topProducts || []).map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{p.totalSold} units sold</p>
                  </div>
                  <p className="text-sm font-bold text-[var(--brand-primary)] flex-shrink-0">
                    ₹{Math.round(p.revenue).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-[var(--brand-primary)]" />
            <h3 className="font-bold text-[var(--text-primary)]">Recent Orders</h3>
          </div>
          {(analytics?.recentOrders || []).length === 0 ? (
            <p className="text-center text-[var(--text-muted)] text-sm py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {(analytics?.recentOrders || []).map(o => (
                <div key={o._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={15} className="text-[var(--brand-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {o.user?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(o.createdAt).toLocaleDateString('en-IN')} · #{o._id?.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[var(--brand-primary)] flex-shrink-0">
                    ₹{o.totalAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
