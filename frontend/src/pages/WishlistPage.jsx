import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingCart, Trash2, Package,
  Star, RefreshCw, ArrowRight, Search, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import api from '../lib/axios';
import toast from 'react-hot-toast';

/* ── Product Card ─────────────────────────────────────────── */
function WishlistCard({ product, onRemove, onAddToCart }) {
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(product._id);
    setRemoving(false);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    await onAddToCart(product);
    setAdding(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="card overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <Link to={`/products/${product._id}`} className="relative overflow-hidden aspect-square bg-[var(--surface-2)]">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-[var(--text-muted)] opacity-30" />
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-[var(--brand-primary)] text-white text-[10px] font-black px-2 py-1 rounded-full">
            -{discount}%
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Remove from wishlist"
        >
          {removing
            ? <RefreshCw size={13} className="animate-spin text-gray-400" />
            : <Heart size={14} className="text-[var(--brand-primary)] fill-current" />
          }
        </button>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product._id}`}>
          <p className="text-sm font-bold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--brand-primary)] transition-colors leading-snug mb-1">
            {product.name}
          </p>
        </Link>

        {/* Category */}
        {product.category?.name && (
          <p className="text-[11px] text-[var(--text-muted)] mb-2">
            {product.category.name}
          </p>
        )}

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {product.rating.toFixed(1)}
            </span>
            {product.numReviews > 0 && (
              <span className="text-[11px] text-[var(--text-muted)]">({product.numReviews})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto mb-3">
          <span className="text-lg font-black text-[var(--brand-primary)]">
            ₹{(product.discountedPrice || product.price)?.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[var(--text-muted)] line-through">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Stock */}
        {product.stockQuantity === 0 ? (
          <div className="text-center py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-bold border border-red-200">
            Out of Stock
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {adding
              ? <RefreshCw size={14} className="animate-spin" />
              : <ShoppingCart size={14} />
            }
            {adding ? 'Adding…' : 'Add to Cart'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Wishlist Page ───────────────────────────────────── */
export default function WishlistPage() {
  const { user, fetchMe } = useAuthStore();
  const { addItem } = useCartStore();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* Load wishlist — user.wishlist is array of product IDs (not populated here),
     so we fetch /auth/me which populates them with name, price, images */
  const loadWishlist = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      setWishlist(data.user?.wishlist || []);
    } catch {
      toast.error('Could not load wishlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadWishlist(); }, []);

  const handleRemove = async (productId) => {
    try {
      await api.put(`/auth/wishlist/${productId}`);
      setWishlist(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
      // Sync auth store
      fetchMe();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleAddToCart = async (product) => {
    addItem(product, 1);
  };

  const handleClearAll = async () => {
    if (!wishlist.length) return;
    // Remove all sequentially
    const ids = wishlist.map(p => p._id);
    try {
      await Promise.all(ids.map(id => api.put(`/auth/wishlist/${id}`)));
      setWishlist([]);
      toast.success('Wishlist cleared');
      fetchMe();
    } catch {
      toast.error('Could not clear wishlist');
    }
  };

  const handleAddAllToCart = () => {
    const inStock = wishlist.filter(p => p.stockQuantity > 0);
    if (!inStock.length) { toast.error('No in-stock items to add'); return; }
    inStock.forEach(p => addItem(p, 1));
    toast.success(`${inStock.length} item${inStock.length > 1 ? 's' : ''} added to cart! 🛒`);
  };

  const filtered = wishlist.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ── LOADING ──────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto mb-4">
          <Heart size={24} className="text-[var(--brand-primary)] animate-pulse" />
        </div>
        <p className="text-[var(--text-muted)] text-sm">Loading your wishlist…</p>
      </div>
    </div>
  );

  /* ── EMPTY ────────────────────────────────────────────── */
  if (wishlist.length === 0) return (
    <div className="min-h-screen bg-[var(--surface-2)] py-12">
      <div className="max-w-lg mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--brand-primary)]/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Heart size={40} className="text-[var(--brand-primary)]" />
          </div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit'] mb-3">
            Your Wishlist is Empty
          </h1>
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            Save products you love by clicking the ❤️ heart icon on any product. They'll appear here for easy access.
          </p>
          <Link to="/products"
            className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4">
            Browse Products <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </div>
  );

  /* ── MAIN ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[var(--surface-2)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit'] flex items-center gap-3">
              <Heart size={28} className="text-[var(--brand-primary)] fill-[var(--brand-primary)]" />
              My Wishlist
            </h1>
            <p className="text-[var(--text-muted)] mt-1">
              {wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleAddAllToCart}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
            >
              <ShoppingCart size={16} /> Add All to Cart
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} /> Clear All
            </button>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search wishlist…"
            className="input-field w-full pl-10 pr-10"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={15} />
            </button>
          )}
        </div>

        {/* No search results */}
        {filtered.length === 0 && search && (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)]">No wishlist items match "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-[var(--brand-primary)] hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* Grid */}
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {filtered.map(product => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link to="/products"
            className="inline-flex items-center gap-2 text-[var(--brand-primary)] font-semibold text-sm hover:underline">
            ← Continue Shopping
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
