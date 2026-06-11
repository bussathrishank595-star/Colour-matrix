import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, Package, DollarSign, TrendingUp, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../lib/axios';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/admin/analytics')
      .then(res => setAnalytics(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const chartData = analytics?.monthlyRevenue?.map(item => ({
    month: MONTHS[(item._id.month || 1) - 1],
    revenue: item.revenue || 0,
    orders: item.orders || 0,
  })) || [];

  const statCards = [
    {
      title: 'Total Revenue',
      value: analytics ? `₹${(analytics.totalRevenue / 100).toFixed(0)}` : '—',
      subValue: `₹${analytics?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      change: '+12.5%',
    },
    {
      title: 'Total Orders',
      value: analytics?.totalOrders || 0,
      subValue: `${analytics?.paidOrders || 0} paid`,
      icon: ShoppingBag,
      color: 'from-blue-500 to-cyan-600',
      change: '+8.2%',
    },
    {
      title: 'Pending Orders',
      value: analytics?.pendingOrders || 0,
      subValue: `${analytics?.processingOrders || 0} confirmed`,
      icon: Clock,
      color: 'from-orange-500 to-amber-600',
      change: 'Action needed',
    },
    {
      title: 'Delivered',
      value: analytics?.deliveredOrders || 0,
      subValue: 'completed',
      icon: CheckCircle,
      color: 'from-purple-500 to-violet-600',
      change: '+15%',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">Dashboard</h1>
          <p className="text-[var(--text-muted)] mt-1">Welcome back! Here's what's happening.</p>
        </div>
        <Link to="/admin/orders" className="btn-primary text-sm">
          View All Orders <ArrowRight size={16} />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] mt-1">{card.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{card.subValue}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center flex-shrink-0`}>
                <card.icon size={20} className="text-white" />
              </div>
            </div>
            <span className="text-xs font-medium text-green-500">{card.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-5">Revenue Trend (Last 6 Months)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
                  formatter={(v) => [`₹${v}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={2.5} dot={{ fill: '#e94560', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-[var(--text-muted)]">No data yet</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-[var(--text-primary)] mb-5">Orders per Month</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }} />
                <Bar dataKey="orders" fill="#0f3460" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-[var(--text-muted)]">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex justify-between mb-5">
            <h3 className="font-bold text-[var(--text-primary)]">Recent Orders</h3>
            <Link to="/admin/orders" className="text-sm text-[var(--brand-primary)] hover:underline">View all</Link>
          </div>
          {analytics?.recentOrders?.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentOrders.map(order => (
                <div key={order._id} className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl">
                  <div className="w-8 h-8 bg-[var(--brand-primary)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={14} className="text-[var(--brand-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{order.user?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{order.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-[var(--brand-primary)]">₹{order.totalAmount?.toFixed(0)}</p>
                    <span className={`text-[10px] font-semibold ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm text-center py-8">No orders yet</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex justify-between mb-5">
            <h3 className="font-bold text-[var(--text-primary)]">Top Products</h3>
            <Link to="/admin/products" className="text-sm text-[var(--brand-primary)] hover:underline">Manage</Link>
          </div>
          {analytics?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.map((product, i) => (
                <div key={product._id} className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl">
                  <span className="w-7 h-7 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{product.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{product.totalSold} units sold</p>
                  </div>
                  <p className="font-bold text-sm text-green-600">₹{product.revenue?.toFixed(0)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm text-center py-8">No sales data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
