import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';

// Route guards — layout-route pattern (React Router v6 correct way)
import {
  RequireLoginLayout,
  AdminOnlyLayout,
  PublicOnlyRoute,
} from './components/auth/ProtectedRoute';

// Auth pages (always public)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Main pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import VisualizerPage from './pages/VisualizerPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ColorAnalyzerPage from './pages/admin/ColorAnalyzerPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';

// Stores
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';

// ── Placeholder pages ─────────────────────────────────────────────
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
    <div className="text-8xl mb-4">🔍</div>
    <h1 className="text-4xl font-black text-[var(--text-primary)] font-['Outfit'] mb-4">
      404 — Page Not Found
    </h1>
    <p className="text-[var(--text-secondary)] mb-8">
      The page you're looking for doesn't exist.
    </p>
    <a href="/" className="btn-primary">Go Home</a>
  </div>
);

const ComingSoon = ({ title }) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
    <p className="text-[var(--text-secondary)] mt-2">This page is coming soon!</p>
  </div>
);

// ── Layout wrappers ───────────────────────────────────────────────
function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const { init } = useThemeStore();
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    init();
    // Always validate token on startup — fetchMe clears auth if token is expired
    fetchMe();
  }, []);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#e94560', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ═══════════════════════════════════════════════════════
            PUBLIC AUTH ROUTES — no login required
            ═══════════════════════════════════════════════════════ */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<ComingSoon title="Email Verification" />} />

        {/* ═══════════════════════════════════════════════════════
            ALL PROTECTED ROUTES — must be logged in
            RequireLoginLayout redirects to /login if not authenticated
            ═══════════════════════════════════════════════════════ */}
        <Route element={<RequireLoginLayout />}>

          {/* ── Customer / public routes (require login) ── */}
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/products" element={<MainLayout><ProductsPage /></MainLayout>} />
          <Route path="/products/:id" element={<MainLayout><ProductDetailPage /></MainLayout>} />
          <Route path="/visualizer" element={<MainLayout><VisualizerPage /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
          <Route path="/orders" element={<MainLayout><ProfilePage /></MainLayout>} />
          <Route path="/orders/:id" element={<MainLayout><ComingSoon title="Order Detail" /></MainLayout>} />
          <Route path="/wishlist" element={<MainLayout><WishlistPage /></MainLayout>} />
          <Route path="/cart" element={<MainLayout><CheckoutPage /></MainLayout>} />
          <Route path="/checkout" element={<MainLayout><CheckoutPage /></MainLayout>} />
          <Route path="/order-success/:id" element={<MainLayout><OrderSuccessPage /></MainLayout>} />

          {/* ── Admin routes — nested inside RequireLoginLayout, then AdminOnlyLayout ── */}
          <Route element={<AdminOnlyLayout />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="color-analyzer" element={<ColorAnalyzerPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
            </Route>
          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
        </Route>
      </Routes>
    </Router>
  );
}
