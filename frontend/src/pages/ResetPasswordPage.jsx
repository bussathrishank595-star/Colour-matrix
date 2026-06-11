import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(r => r.test(form.password)).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { return; }
    if (form.password !== form.confirm) { return; }
    setLoading(true);
    const result = await resetPassword(token, form.password);
    setLoading(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-2)] px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">
              {done ? 'Password Reset!' : 'Set New Password'}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              {done ? 'Redirecting you to the homepage…' : 'Choose a strong password for your account.'}
            </p>
          </div>

          {done ? (
            <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <CheckCircle size={22} className="text-green-600" />
              <p className="text-sm text-green-700 font-semibold">Password updated successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="input-field w-full pl-10 pr-11"
                    minLength={6}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(n => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= strength
                          ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-orange-400' : strength <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                          : 'bg-[var(--border)]'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {['', 'Weak', 'Fair', 'Good', 'Strong'][strength]} — use uppercase, numbers & symbols
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    className={`input-field w-full pl-10 ${form.confirm && form.confirm !== form.password ? 'border-red-400' : ''}`}
                    required
                  />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || form.password.length < 6 || form.password !== form.confirm}
                className="btn-primary w-full py-3 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><RefreshCw size={16} className="animate-spin" /> Updating…</> : <><CheckCircle size={16} /> Reset Password</>}
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
