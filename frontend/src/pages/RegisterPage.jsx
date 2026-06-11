import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Paintbrush, Mail, Lock, User, Phone, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const strengthChecks = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains special character', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
  });

  const watchPassword = watch('password', '');

  const onSubmit = async (data) => {
    const result = await registerUser({ name: data.name, email: data.email, password: data.password, phone: data.phone });
    if (result.success) navigate('/');
  };

  const strength = strengthChecks.filter((c) => c.test(watchPassword)).length;
  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][Math.max(0, strength - 1)] || 'bg-gray-600';

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--brand-primary)] rounded-2xl mb-4">
            <Paintbrush size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Create account</h1>
          <p className="text-gray-400 mt-2">Join Smart Paint & Hardware Store</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('name')}
                  id="register-name"
                  placeholder="John Doe"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              {errors.name && <p className="mt-1 text-red-400 text-xs">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="register-email"
                  placeholder="you@example.com"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              {errors.email && <p className="mt-1 text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mobile Number <span className="text-gray-500">(optional)</span></label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  id="register-phone"
                  placeholder="9876543210"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              {errors.phone && <p className="mt-1 text-red-400 text-xs">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="register-password"
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 pr-12 focus:outline-none focus:border-[var(--brand-primary)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password strength */}
              {watchPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-white/10'}`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {strengthChecks.map((check) => (
                      <div key={check.label} className={`flex items-center gap-1 text-xs ${check.test(watchPassword) ? 'text-green-400' : 'text-gray-500'}`}>
                        <CheckCircle size={10} />
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.password && <p className="mt-1 text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  id="register-confirm-password"
                  placeholder="Re-enter password"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-[var(--brand-primary)] transition-all"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-red-400 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              id="register-submit"
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--brand-primary)] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
