import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Paintbrush, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Redirect target after login — use 'from' state set by RequireLogin guard
  const from = location.state?.from || null;
  const redirectTo = new URLSearchParams(location.search).get('redirect') || from || null;

  // If already logged in, redirect away
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo || '/', { replace: true });
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    const result = await login(form);
    if (result.success) {
      if (result.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectTo || '/', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (brand) ───────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${100 + i * 80}px`,
                height: `${100 + i * 80}px`,
                left: `${10 + i * 15}%`,
                top: `${15 + i * 12}%`,
                background: `rgba(233,69,96,${0.04 + i * 0.01})`,
                border: '1px solid rgba(233,69,96,0.08)',
              }}
              animate={{ scale: [1, 1.08, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* Brand */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center shadow-lg">
              <Paintbrush size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white text-2xl font-black font-['Outfit']">Smart Paint</p>
              <p className="text-gray-400 text-sm">& Hardware Store</p>
            </div>
          </div>
          <h2 className="text-4xl font-black text-white font-['Outfit'] leading-tight mb-4">
            Your one-stop<br />
            <span className="text-[var(--brand-primary)]">hardware &</span><br />
            paint shop
          </h2>
          <p className="text-gray-400 text-base leading-relaxed">
            Browse 1000+ products, use our AI Color Visualizer,
            and get home delivery across India.
          </p>
        </div>

        {/* Features */}
        <div className="relative space-y-4">
          {[
            { icon: '🎨', text: 'AI Paint Color Visualizer — see colors on your walls before buying' },
            { icon: '🚚', text: 'Free delivery on orders above ₹499' },
            { icon: '🔒', text: 'Secure payments via Razorpay' },
          ].map((f) => (
            <div key={f.text} className="flex items-start gap-3">
              <span className="text-xl">{f.icon}</span>
              <p className="text-gray-300 text-sm">{f.text}</p>
            </div>
          ))}
        </div>

        <p className="relative text-gray-500 text-xs">
          © 2024 Smart Paint & Hardware Store. All rights reserved.
        </p>
      </div>

      {/* ── Right panel (form) ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--surface)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center">
              <Paintbrush size={18} className="text-white" />
            </div>
            <span className="text-xl font-black text-[var(--text-primary)] font-['Outfit']">Smart Paint & Hardware</span>
          </div>

          <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit'] mb-1">
            Welcome back 👋
          </h1>
          <p className="text-[var(--text-muted)] mb-8">
            Sign in to your account to continue shopping
          </p>

          {/* Admin hint (subtle, for shopkeeper) */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-6 text-sm text-blue-700">
            <ShieldCheck size={16} className="flex-shrink-0" />
            <span>Shopkeeper? Login with your admin credentials to access the dashboard.</span>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-600"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-[var(--text-secondary)]" htmlFor="login-password">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[var(--brand-primary)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="input-field pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  id="toggle-password"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              id="login-submit"
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-muted)]">New to Smart Paint?</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Sign Up link */}
          <Link
            to="/register"
            id="goto-register"
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-[var(--border)] rounded-xl text-[var(--text-primary)] font-semibold text-sm hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all"
          >
            Create a new account →
          </Link>

          <p className="text-center text-xs text-[var(--text-muted)] mt-6">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-[var(--brand-primary)]">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-[var(--brand-primary)]">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
