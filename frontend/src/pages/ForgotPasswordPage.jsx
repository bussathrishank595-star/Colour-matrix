import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, SendHorizonal, RefreshCw, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-2)] px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">
              {sent ? 'Email Sent!' : 'Forgot Password?'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {sent
                ? `We've sent a password reset link to ${email}`
                : "No worries! Enter your email and we'll send a reset link."}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl">
                <CheckCircle size={22} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400 font-semibold">
                  Check your inbox and click the reset link.
                </p>
              </div>
              <p className="text-xs text-[var(--text-muted)] text-center">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-[var(--brand-primary)] font-semibold hover:underline">
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="input-field w-full pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><RefreshCw size={16} className="animate-spin" /> Sending…</>
                  : <><SendHorizonal size={16} /> Send Reset Link</>
                }
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors font-semibold">
              <ArrowLeft size={15} /> Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
