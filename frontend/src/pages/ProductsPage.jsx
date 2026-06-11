import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Star, ShoppingCart, Heart, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import api from '../lib/axios';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

function ProductCard({ product }) {
  const { addItem } = useCartStore();
  const { isLoggedIn } = useAuthStore();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast.error('Please login to add to wishlist');
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.put(`/auth/wishlist/${product._id}`);
      setWishlisted(res.data.wishlisted);
      toast.success(res.data.wishlisted ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="card group overflow-hidden"
    >
      <Link to={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0]?.url || `https://placehold.co/400x400/1a1a2e/e94560?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-md disabled:opacity-60"
          id={`wishlist-${product._id}`}
        >
          {wishlistLoading
            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            : <Heart size={16} className={wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'} />
          }
        </button>
        {product.discountedPrice && (
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
          </span>
        )}
        {product.stockQuantity === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full">Out of Stock</span>
          </div>
        )}
      </Link>
      <div className="p-4">
        <p className="text-xs text-[var(--brand-primary)] font-medium mb-1 uppercase tracking-wide">{product.category?.name}</p>
        <Link to={`/products/${product._id}`}>
          <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-2 group-hover:text-[var(--brand-primary)] transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">({product.numReviews})</span>
          <span className={`ml-auto text-xs font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg font-bold text-[var(--brand-primary)]">
            ₹{(product.discountedPrice || product.price).toFixed(2)}
          </span>
          {product.discountedPrice && (
            <span className="text-sm text-[var(--text-muted)] line-through">₹{product.price.toFixed(2)}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addItem(product)}
            disabled={product.stockQuantity === 0}
            className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            id={`add-cart-${product._id}`}
          >
            <ShoppingCart size={14} /> Add to Cart
          </button>
          <Link to={`/products/${product._id}`} className="btn-ghost text-sm py-2 px-3">
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    setSearchParams(params);
  };

  useEffect(() => {
    api.get('/products/categories').then(res => setCategories(res.data.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    params.set('page', page);
    params.set('limit', 12);

    api.get(`/products?${params}`)
      .then(res => {
        setProducts(res.data.products || []);
        setPagination(res.data.pagination || {});
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  }, [search, category, sort, minPrice, maxPrice, page]);

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = search || category || minPrice || maxPrice;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] font-['Outfit']">
              {search ? `Results for "${search}"` : category ? categories.find(c => c.slug === category)?.name || 'Products' : 'All Products'}
            </h1>
            {!loading && (
              <p className="text-[var(--text-muted)] mt-1">{pagination.totalProducts || 0} products found</p>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-ghost flex-1 sm:flex-none ${showFilters ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : ''}`}
              id="toggle-filters"
            >
              <SlidersHorizontal size={16} /> Filters
              {hasFilters && <span className="ml-1 w-4 h-4 bg-[var(--brand-primary)] text-white text-[10px] rounded-full flex items-center justify-center">!</span>}
            </button>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="input-field flex-1 sm:w-48 text-sm py-2"
              id="sort-select"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-64 flex-shrink-0"
            >
              <div className="card p-5 sticky top-28 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[var(--text-primary)]">Filters</h3>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1">
                      <X size={12} /> Clear all
                    </button>
                  )}
                </div>

                {/* Category */}
                <div>
                  <p className="font-semibold text-[var(--text-secondary)] text-sm mb-3 uppercase tracking-wider">Category</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateParam('category', '')}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${!category ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.slug}
                        onClick={() => updateParam('category', cat.slug)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${category === cat.slug ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'}`}
                        id={`filter-cat-${cat.slug}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <p className="font-semibold text-[var(--text-secondary)] text-sm mb-3 uppercase tracking-wider">Price Range</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={minPrice}
                      onChange={(e) => updateParam('minPrice', e.target.value)}
                      className="input-field text-sm py-2 w-full"
                      id="price-min"
                    />
                    <span className="text-[var(--text-muted)]">-</span>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={maxPrice}
                      onChange={(e) => updateParam('maxPrice', e.target.value)}
                      className="input-field text-sm py-2 w-full"
                      id="price-max"
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Active search bar */}
            {search && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-[var(--surface-2)] rounded-xl">
                <Search size={18} className="text-[var(--brand-primary)]" />
                <span className="text-sm text-[var(--text-secondary)]">Search: <strong className="text-[var(--text-primary)]">{search}</strong></span>
                <button onClick={() => updateParam('search', '')} className="ml-auto text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="card">
                    <div className="skeleton aspect-square" />
                    <div className="p-4 space-y-3">
                      <div className="skeleton h-3 w-3/4 rounded" />
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-5 w-1/3 rounded" />
                      <div className="skeleton h-9 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No products found</h3>
                <p className="text-[var(--text-muted)] mb-6">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const params = new URLSearchParams(searchParams);
                          params.set('page', i + 1);
                          setSearchParams(params);
                        }}
                        className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${page === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                        id={`page-${i+1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
