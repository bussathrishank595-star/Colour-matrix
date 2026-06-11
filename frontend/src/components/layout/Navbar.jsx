import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, User, Menu, X, Sun, Moon,
  Heart, Package, LogOut, Settings, ChevronDown, Paintbrush
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useThemeStore } from '../../store/themeStore';

const categories = [
  { name: 'Paints', slug: 'paints', emoji: '🎨' },
  { name: 'Wall Putty', slug: 'wall-putty', emoji: '🪣' },
  { name: 'Brushes', slug: 'brushes', emoji: '🖌️' },
  { name: 'Rollers', slug: 'rollers', emoji: '🔄' },
  { name: 'Hardware Tools', slug: 'hardware-tools', emoji: '🔧' },
  { name: 'Plumbing', slug: 'plumbing-items', emoji: '🚿' },
  { name: 'Electrical', slug: 'electrical-items', emoji: '⚡' },
  { name: 'Cement Products', slug: 'cement-products', emoji: '🧱' },
  { name: 'Construction', slug: 'construction-accessories', emoji: '🏗️' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuthStore();
  const { getItemCount, openCart } = useCartStore();
  const { isDark, toggle } = useThemeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
    setShowUserMenu(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const cartCount = getItemCount();

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glass-dark shadow-xl'
            : 'bg-[var(--brand-dark)]'
        }`}
      >
        {/* Top announcement bar */}
        <div className="bg-[var(--brand-primary)] py-1 text-center text-white text-xs font-medium">
          🎨 Free shipping on orders above ₹499 | Use code <strong>PAINT10</strong> for 10% off
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Main nav row */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center">
                <Paintbrush size={18} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg leading-none font-['Outfit']">
                  Smart Paint
                </span>
                <span className="block text-[10px] text-gray-400 leading-none">& Hardware Store</span>
              </div>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, paints, tools..."
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 pr-12 focus:outline-none focus:border-[var(--brand-primary)] focus:bg-white/15 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <Search size={18} />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Dark mode */}
              <button
                onClick={toggle}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                aria-label="Toggle dark mode"
                id="dark-mode-toggle"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Cart */}
              <button
                onClick={openCart}
                id="cart-button"
                className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-primary)] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </button>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    id="user-menu-button"
                  >
                    <div className="w-7 h-7 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block text-sm font-medium">{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-[var(--brand-mid)] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-white/10">
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                          {isAdmin() && (
                            <span className="mt-1 inline-block text-[10px] bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-full font-semibold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="py-1">
                          {isAdmin() && (
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                              <Settings size={16} /> Admin Dashboard
                            </Link>
                          )}
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                            <User size={16} /> My Profile
                          </Link>
                          <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                            <Package size={16} /> My Orders
                          </Link>
                          <Link to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm">
                            <Heart size={16} /> Wishlist
                          </Link>
                          <hr className="border-white/10 my-1" />
                          <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
                            id="logout-button"
                          >
                            <LogOut size={16} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  id="navbar-login-btn"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all"
                >
                  <User size={15} /> Login
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white rounded-lg"
              >
                {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Category nav */}
          <div className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
            <Link
              to="/products"
              className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className="text-gray-400 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all whitespace-nowrap"
              >
                {cat.emoji} {cat.name}
              </Link>
            ))}
            <Link
              to="/visualizer"
              className="text-[var(--brand-primary)] hover:text-red-300 text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--brand-primary)]/10 transition-all whitespace-nowrap ml-auto"
            >
              🎨 AI Color Visualizer
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[var(--brand-mid)] border-t border-white/10 overflow-hidden"
            >
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 pr-12 focus:outline-none text-sm"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search size={18} />
                  </button>
                </div>
              </form>

              <div className="px-4 pb-4 space-y-1">
                <Link to="/products" className="flex items-center gap-3 text-gray-300 py-2 text-sm">All Products</Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/products?category=${cat.slug}`}
                    className="flex items-center gap-3 text-gray-300 hover:text-white py-2 text-sm"
                  >
                    <span>{cat.emoji}</span> {cat.name}
                  </Link>
                ))}
                <Link to="/visualizer" className="flex items-center gap-3 text-[var(--brand-primary)] font-semibold py-2 text-sm">
                  🎨 AI Color Visualizer
                </Link>
                {!user && (
                  <div className="pt-3 border-t border-white/10">
                    <Link to="/login" className="btn-primary w-full justify-center text-sm">
                      <User size={15} /> Login / Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed nav */}
      <div className="h-[104px] md:h-[108px]" />

      {/* Backdrop for user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
}
