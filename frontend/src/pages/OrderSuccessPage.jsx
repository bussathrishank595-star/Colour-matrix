import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ShoppingBag, Home, Package } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/axios';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (id) {
      api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => {});
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="card max-w-lg w-full p-10 text-center"
      >
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
            className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
          >
            <CheckCircle size={48} className="text-green-500" />
          </motion.div>
          {/* Confetti dots */}
          {[...Array(8)].map((_, i) => (
            <motion.div key={i}
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: [0, 1, 0], x: [0, (Math.cos(i * 45 * Math.PI / 180) * 50)], y: [0, (Math.sin(i * 45 * Math.PI / 180) * 50)] }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.8 }}
              className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
              style={{ background: ['#e94560','#7c3aed','#10b981','#f59e0b','#0ea5e9','#ef4444','#8b5cf6','#059669'][i] }}
            />
          ))}
        </div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit'] mb-2">
          Order Placed! 🎉
        </h1>
        <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
          Thank you for your order! We've received it and will start processing soon.
        </p>

        {order && (
          <div className="bg-[var(--surface-2)] rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Order ID</span>
              <span className="font-bold text-[var(--text-primary)] font-mono">#{order._id?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Items</span>
              <span className="font-semibold text-[var(--text-primary)]">{order.orderItems?.length || 0} product{order.orderItems?.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Total</span>
              <span className="font-black text-[var(--brand-primary)]">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Payment</span>
              <span className={`font-bold capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {order.paymentStatus === 'paid' ? '✅ Paid' : '💵 Pay on Delivery'}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)] mb-6">
          📧 A confirmation email has been sent to your registered email address.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/profile" className="flex-1 btn-ghost flex items-center justify-center gap-2">
            <Package size={16} /> My Orders
          </Link>
          <Link to="/" className="flex-1 btn-primary flex items-center justify-center gap-2">
            <Home size={16} /> Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
