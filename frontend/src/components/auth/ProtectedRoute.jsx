import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// Full-screen spinner shown while we validate the persisted token
function InitializingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--brand-dark)]">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)] flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-white font-semibold text-sm">Loading…</p>
      </div>
    </div>
  );
}

/**
 * RequireLoginLayout — layout route that blocks all children unless logged in.
 * Uses <Outlet /> so it works as a React Router v6 parent route.
 *
 * Usage in App.jsx:
 *   <Route element={<RequireLoginLayout />}>
 *     <Route path="/" element={<Home />} />
 *     ...
 *   </Route>
 */
export function RequireLoginLayout() {
  const { user, token, isInitializing } = useAuthStore();
  const location = useLocation();

  // Show spinner while we check if the stored token is still valid
  if (isInitializing) return <InitializingScreen />;

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

/**
 * AdminLayout guard — sits inside RequireLoginLayout.
 * Redirects non-admin users to home.
 * Must wait for isInitializing so fetchMe can set the role before we check.
 */
export function AdminOnlyLayout() {
  const { user, isAdmin, isInitializing } = useAuthStore();

  // Wait for token validation to complete before checking role
  if (isInitializing) return <InitializingScreen />;

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/**
 * ProtectedRoute — inline component version (for single routes).
 */
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, token, isAdmin } = useAuthStore();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * PublicOnlyRoute — for /login and /register.
 * Redirects already-logged-in users away.
 */
export function PublicOnlyRoute({ children }) {
  const { user, token, isAdmin, isInitializing } = useAuthStore();

  if (isInitializing) return <InitializingScreen />;

  if (user && token) {
    return <Navigate to={isAdmin() ? '/admin' : '/'} replace />;
  }
  return children;
}
