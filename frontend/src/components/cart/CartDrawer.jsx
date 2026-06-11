import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const subtotal = getSubtotal();
  const shippingCharge = subtotal >= 499 ? 0 : 49;
  const gst = parseFloat((subtotal * 0.18).toFixed(2));
  const total = subtotal + shippingCharge + gst;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--surface)] z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={22} className="text-[var(--brand-primary)]" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]">
                  My Cart
                  {getItemCount() > 0 && (
                    <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                      ({getItemCount()} items)
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
              >
                <X size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 bg-[var(--surface-2)] rounded-full flex items-center justify-center">
                    <ShoppingBag size={32} className="text-[var(--text-muted)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Your cart is empty</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Start adding products!</p>
                  </div>
                  <Link to="/products" onClick={closeCart} className="btn-primary text-sm">
                    Browse Products
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.key}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-4 p-4 bg-[var(--surface-2)] rounded-xl"
                  >
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder.jpg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                        {item.product.name}
                      </p>
                      {item.colorVariant && (
                        <p className="text-xs text-[var(--text-muted)]">{item.colorVariant}</p>
                      )}
                      <p className="text-[var(--brand-primary)] font-bold mt-1">
                        ₹{item.price.toFixed(2)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-[var(--border)] rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-5 border-t border-[var(--border)] space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Shipping</span>
                    <span className={shippingCharge === 0 ? 'text-green-500 font-medium' : ''}>
                      {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>GST (18%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-primary)] font-bold text-base pt-2 border-t border-[var(--border)]">
                    <span>Total</span>
                    <span className="text-[var(--brand-primary)]">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {shippingCharge > 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center">
                    Add ₹{(499 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}

                <Link
                  to={isLoggedIn() ? '/checkout' : '/login?redirect=checkout'}
                  onClick={closeCart}
                  className="btn-primary w-full justify-center"
                  id="proceed-to-checkout"
                >
                  Proceed to Checkout
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/products"
                  onClick={closeCart}
                  className="btn-ghost w-full justify-center text-sm"
                >
                  Continue Shopping
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
