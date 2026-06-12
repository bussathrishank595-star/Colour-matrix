import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag, MapPin, CreditCard, Truck, CheckCircle,
  ChevronRight, Plus, Trash2, RefreshCw, Shield,
  Tag, IndianRupee, Package, ArrowLeft, Phone, User, Mail
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';

/* ── Load Razorpay script ─────────────────────────────────── */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ── Step indicator ───────────────────────────────────────── */
const STEPS = ['Cart Review', 'Delivery', 'Payment'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
              i < current ? 'bg-green-500 text-white' :
              i === current ? 'bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/30' :
              'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
            }`}>
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-[11px] font-semibold mt-1 whitespace-nowrap ${
              i <= current ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
            }`}>{step}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors ${
              i < current ? 'bg-green-500' : 'bg-[var(--border)]'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Order Summary sidebar ────────────────────────────────── */
function OrderSummary({ items, subtotal, shipping, tax, total }) {
  return (
    <div className="card p-5 sticky top-28">
      <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <ShoppingBag size={16} className="text-[var(--brand-primary)]" /> Order Summary
      </h3>

      {/* Items */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex-shrink-0">
              {item.product?.images?.[0]?.url
                ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                : <Package size={16} className="m-auto mt-3 text-[var(--text-muted)]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{item.product?.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)] flex-shrink-0">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Price breakdown */}
      <div className="border-t border-[var(--border)] pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Subtotal</span>
          <span className="font-semibold text-[var(--text-primary)]">₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Shipping</span>
          {shipping === 0
            ? <span className="font-semibold text-green-600">FREE</span>
            : <span className="font-semibold text-[var(--text-primary)]">₹{shipping}</span>
          }
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">GST (18%)</span>
          <span className="font-semibold text-[var(--text-primary)]">₹{tax.toLocaleString('en-IN')}</span>
        </div>
        {shipping === 0 && (
          <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <Tag size={10} /> Free delivery on orders above ₹499
          </p>
        )}
      </div>

      <div className="border-t border-[var(--border)] mt-3 pt-3 flex justify-between">
        <span className="font-black text-[var(--text-primary)]">Total</span>
        <span className="font-black text-xl text-[var(--brand-primary)]">₹{total.toLocaleString('en-IN')}</span>
      </div>

      {/* Trust badges */}
      <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-2 text-center">
        {[
          { icon: Shield, text: 'Secure Pay' },
          { icon: Truck, text: 'Fast Ship' },
          { icon: CheckCircle, text: 'Genuine' },
        ].map(b => (
          <div key={b.text} className="flex flex-col items-center gap-1">
            <b.icon size={16} className="text-green-500" />
            <span className="text-[9px] text-[var(--text-muted)] font-semibold">{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  STEP 0 — Cart Review                                       */
/* ─────────────────────────────────────────────────────────── */
function CartReview({ items, onNext, onRemove, onQty }) {
  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <ShoppingBag size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h3>
        <Link to="/products" className="btn-primary inline-flex mt-4">Browse Products</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
      {items.map(item => (
        <div key={item.key} className="card p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex-shrink-0">
            {item.product?.images?.[0]?.url
              ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
              : <Package size={20} className="m-auto mt-5 text-[var(--text-muted)]" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2">{item.product?.name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">₹{item.price?.toLocaleString('en-IN')} each</p>
            {item.colorVariant && <p className="text-xs text-[var(--brand-primary)]">Colour: {item.colorVariant}</p>}
          </div>

          {/* Qty control */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => onQty(item.key, item.quantity - 1)}
              className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--surface)] transition-colors">−</button>
            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
            <button onClick={() => onQty(item.key, item.quantity + 1)}
              className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-sm font-bold hover:bg-[var(--surface)] transition-colors">+</button>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-black text-[var(--text-primary)]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
            <button onClick={() => onRemove(item.key)}
              className="mt-1 p-1 hover:text-red-500 text-[var(--text-muted)] transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-end mt-4">
        <button onClick={onNext}
          className="btn-primary px-8 flex items-center gap-2">
          Continue to Delivery <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  STEP 1 — Delivery Address                                   */
/* ─────────────────────────────────────────────────────────── */
const EMPTY_ADDR = { fullName: '', phone: '', email: '', houseNumber: '', street: '', area: '', city: '', state: '', pincode: '' };

function DeliveryStep({ user, onNext, onBack }) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    ...EMPTY_ADDR,
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    api.get('/auth/me').then(r => {
      const addrs = r.data.user?.addresses || [];
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.findIndex(a => a.isDefault);
        setSelected(def >= 0 ? def : 0);
      } else {
        setSelected('new');
      }
    }).catch(() => setSelected('new'));
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleContinue = () => {
    let addr;
    if (selected === 'new') {
      const { fullName, phone, email, houseNumber, street, area, city, state, pincode } = form;
      if (!fullName || !phone || !email || !houseNumber || !city || !state || !pincode) {
        toast.error('Please fill all required fields');
        return;
      }
      if (!/^\d{6}$/.test(pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
      addr = { fullName, phone, email, houseNumber, street: street || houseNumber, area: area || city, city, state, pincode };
    } else {
      const a = savedAddresses[selected];
      addr = {
        fullName: user?.name || '',
        phone: a.phone || user?.phone || '',
        email: user?.email || '',
        houseNumber: a.street || '',
        street: a.street || '',
        area: a.city || '',
        city: a.city || '',
        state: a.state || '',
        pincode: a.pincode || '',
      };
    }
    onNext(addr);
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Saved Addresses</p>
          {savedAddresses.map((a, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`w-full card p-4 text-left flex items-start gap-3 transition-all ${selected === i ? 'border-[var(--brand-primary)] border shadow-md' : 'hover:border-[var(--brand-primary)]/40'}`}>
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 ${selected === i ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-[var(--border)]'}`}>
                {selected === i && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{a.street}</p>
                <p className="text-xs text-[var(--text-muted)]">{[a.city, a.state, a.pincode].join(', ')}</p>
                {a.isDefault && <span className="text-[10px] text-[var(--brand-primary)] font-bold">★ Default</span>}
              </div>
            </button>
          ))}
          <button onClick={() => setSelected('new')}
            className={`w-full card p-4 text-left flex items-center gap-3 transition-all ${selected === 'new' ? 'border-[var(--brand-primary)] border' : 'hover:border-[var(--brand-primary)]/40'}`}>
            <Plus size={16} className="text-[var(--brand-primary)]" />
            <span className="text-sm font-semibold text-[var(--brand-primary)]">Use a new address</span>
          </button>
        </div>
      )}

      {/* New address form */}
      {(selected === 'new' || savedAddresses.length === 0) && (
        <div className="card p-5 space-y-3">
          <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wide">Delivery Details</p>

          {/* Name + Phone */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Full Name *</label>
              <div className="relative"><User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="Full name" className="input-field w-full pl-9" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Phone *</label>
              <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="10-digit mobile" className="input-field w-full pl-9" required />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Email *</label>
            <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input name="email" value={form.email} onChange={handleChange}
                placeholder="For order confirmation" className="input-field w-full pl-9" required />
            </div>
          </div>

          {/* House Number */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">House / Flat No. *</label>
            <input name="houseNumber" value={form.houseNumber} onChange={handleChange}
              placeholder="e.g. H.No 12-3, Flat 4B" className="input-field w-full" required />
          </div>

          {/* Street + Area */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Street / Colony</label>
              <input name="street" value={form.street} onChange={handleChange}
                placeholder="Street name, Colony" className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Area / Landmark</label>
              <input name="area" value={form.area} onChange={handleChange}
                placeholder="Area, Landmark" className="input-field w-full" />
            </div>
          </div>

          {/* City + State + Pincode */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">City *</label>
              <input name="city" value={form.city} onChange={handleChange}
                placeholder="City" className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">State *</label>
              <input name="state" value={form.state} onChange={handleChange}
                placeholder="State" className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange}
                placeholder="6-digit" maxLength={6} className="input-field w-full" required />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button onClick={onBack} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={handleContinue} className="btn-primary px-8 flex items-center gap-2">
          Continue to Payment <ChevronRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  STEP 2 — Payment                                            */
/* ─────────────────────────────────────────────────────────── */
function PaymentStep({ items, shippingAddress, total, onBack, onSuccess }) {
  const [method, setMethod] = useState('upi');
  const [upiTxnId, setUpiTxnId] = useState('');
  const [placing, setPlacing] = useState(false);
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (method === 'upi') {
      if (!upiTxnId) {
        toast.error('Please enter your 12-digit UPI Transaction ID (UTR)');
        return;
      }
      if (!/^\d{12}$/.test(upiTxnId)) {
        toast.error('UPI Transaction ID (UTR) must be exactly 12 digits');
        return;
      }
    }

    setPlacing(true);
    try {
      const orderItems = items.map(i => ({
        product: i.product._id,
        quantity: i.quantity,
        colorVariant: i.colorVariant || null,
      }));

      const { data } = await api.post('/orders', {
        orderItems,
        shippingAddress,
        paymentMethod: method,
        upiTxnId: method === 'upi' ? upiTxnId : undefined,
      });

      clearCart();
      if (method === 'upi') {
        toast.success('🎉 Order placed! Awaiting payment verification.');
      } else {
        toast.success('🎉 Order placed! Pay on delivery.');
      }
      navigate(`/order-success/${data.order._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
      setPlacing(false);
    }
  };

  const METHODS = [
    {
      id: 'upi',
      label: 'Pay via UPI QR Code',
      sub: 'GPay, PhonePe, Paytm, BHIM',
      icon: <CreditCard size={20} className="text-blue-500" />,
    },
    {
      id: 'cod',
      label: 'Cash on Delivery',
      sub: 'Pay when your order arrives',
      icon: <IndianRupee size={20} className="text-green-500" />,
    },
  ];

  const upiId = import.meta.env.VITE_UPI_ID || 'bussathrishank595@okaxis';

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {/* Delivery summary */}
      <div className="card p-4">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-2">Delivering to</p>
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-[var(--brand-primary)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{shippingAddress.fullName} · {shippingAddress.phone}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {[shippingAddress.houseNumber, shippingAddress.street, shippingAddress.area, shippingAddress.city, shippingAddress.state, shippingAddress.pincode].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="card p-5 space-y-4">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1">Choose Payment Method</p>
        <div className="space-y-3">
          {METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                method === m.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5' : 'border-[var(--border)] hover:border-[var(--brand-primary)]/40'
              }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${method === m.id ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]' : 'border-[var(--border)]'}`}>
                {method === m.id && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
              </div>
              <div className="w-9 h-9 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">{m.icon}</div>
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">{m.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* UPI Details section */}
        {method === 'upi' && (
          <div className="p-4 border border-blue-200 bg-blue-50/10 dark:bg-blue-950/10 rounded-2xl space-y-4">
            <div className="text-center space-y-3">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Scan QR Code to Pay ₹{total.toLocaleString('en-IN')}
              </p>
              
              {/* Dynamic QR Code from free API */}
              <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border border-[var(--border)] shadow-md flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `upi://pay?pa=${upiId}&pn=Smart%20Paint%20Store&am=${total}&cu=INR`
                  )}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">UPI ID (tap to copy):</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(upiId);
                    toast.success('UPI ID copied to clipboard!');
                  }}
                  className="text-sm font-black text-[var(--brand-primary)] font-mono hover:underline focus:outline-none"
                >
                  {upiId}
                </button>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
                  Enter 12-Digit UPI Transaction ID (UTR No.) *
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={upiTxnId}
                  onChange={(e) => setUpiTxnId(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 301234567890"
                  className="input-field w-full text-center font-mono text-lg tracking-widest font-black"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed text-center">
                Please complete the transfer on Google Pay, PhonePe, or Paytm first. Once paid, check your app transaction details, copy the 12-digit UPI Ref/UTR No., and enter it above.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Secure badge */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-green-50/50 border border-green-200/50 rounded-xl p-3">
        <Shield size={14} className="text-green-600 flex-shrink-0" />
        <span>Your transaction is <strong className="text-green-700">secure</strong>. We manually verify all payments before shipping.</span>
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={onBack} disabled={placing} className="btn-ghost flex items-center gap-2">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={handlePlaceOrder} disabled={placing}
          className="btn-primary px-8 flex items-center gap-2 disabled:opacity-60">
          {placing
            ? <><RefreshCw size={16} className="animate-spin" /> Processing…</>
            : <><CheckCircle size={16} /> Place Order — ₹{total.toLocaleString('en-IN')}</>
          }
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Main Checkout Page                                          */
/* ─────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState(null);

  const subtotal = getSubtotal();
  const shipping = subtotal >= 499 ? 0 : 49;
  const tax = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login?redirect=/checkout');
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--surface-2)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Link to="/cart" className="text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">Checkout</h1>
          </div>
          <StepBar current={step} />
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <CartReview
                  key="cart"
                  items={items}
                  onNext={() => setStep(1)}
                  onRemove={removeItem}
                  onQty={updateQuantity}
                />
              )}
              {step === 1 && (
                <DeliveryStep
                  key="delivery"
                  user={user}
                  onNext={(addr) => { setShippingAddress(addr); setStep(2); }}
                  onBack={() => setStep(0)}
                />
              )}
              {step === 2 && shippingAddress && (
                <PaymentStep
                  key="payment"
                  items={items}
                  shippingAddress={shippingAddress}
                  total={total}
                  onBack={() => setStep(1)}
                  onSuccess={() => {}}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <OrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shipping}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
