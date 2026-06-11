import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitializing: true, // true while we validate the persisted token on startup

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          localStorage.setItem('token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false });
          toast.success(res.data.message || 'Account created! Welcome 🎉');
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Registration failed');
          return { success: false };
        }
      },

      login: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', data);
          localStorage.setItem('token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false });
          toast.success(`Welcome back, ${res.data.user.name}! 👋`);
          return { success: true, role: res.data.user.role };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Login failed. Check email & password.');
          return { success: false };
        }
      },

      logout: async () => {
        try { await api.get('/auth/logout'); } catch {}
        localStorage.removeItem('token');
        set({ user: null, token: null });
        // ── Clear cart so admin cart doesn't bleed into customer session ──
        const { useCartStore } = await import('./cartStore');
        useCartStore.getState().clearCart();
        toast.success('Logged out successfully');
      },

      /**
       * Called on app startup.
       * Validates the persisted token against the backend.
       * If token is invalid/expired, clears auth state → user sees login page.
       */
      fetchMe: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitializing: false });
          return;
        }
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user, isInitializing: false });
        } catch {
          // Token is invalid/expired — force logout
          localStorage.removeItem('token');
          set({ user: null, token: null, isInitializing: false });
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/forgot-password', { email });
          set({ isLoading: false });
          toast.success(res.data.message);
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Something went wrong');
          return { success: false };
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true });
        try {
          const res = await api.put(`/auth/reset-password/${token}`, { password });
          localStorage.setItem('token', res.data.token);
          set({ user: res.data.user, token: res.data.token, isLoading: false });
          toast.success('Password reset successfully!');
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          toast.error(err.response?.data?.message || 'Reset failed');
          return { success: false };
        }
      },

      updateProfile: async (data) => {
        try {
          const res = await api.put('/auth/profile', data);
          set({ user: res.data.user });
          toast.success('Profile updated!');
          return { success: true };
        } catch (err) {
          toast.error(err.response?.data?.message || 'Update failed');
          return { success: false };
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isLoggedIn: () => !!get().token && !!get().user,
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
      // Don't persist isInitializing — always start as true
      onRehydrateStorage: () => (state) => {
        // After rehydration, isInitializing stays true until fetchMe completes
        if (state) state.isInitializing = true;
      },
    }
  )
);
