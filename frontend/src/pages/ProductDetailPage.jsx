import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ShoppingCart, Heart, Share2, ArrowLeft, Plus, Minus,
  Truck, ShieldCheck, RotateCcw, Package, ChevronRight, Loader2,
  CheckCircle, MessageSquare, AlertCircle
} from 'lucide-react';
import api from '../lib/axios';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function StarRating({ rating, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.floor(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : i - rating < 1
              ? 'text-yellow-300 fill-yellow-200'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  );
}

function ImageGallery({ images, name }) {
  const [selected, setSelected] = useState(0);

  const imgs = images?.length > 0
    ? images
    : [{ url: `https://placehold.co/600x600/1a1a2e/e94560?text=${encodeURIComponent(name)}` }];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <motion.div
        key={selected}
        initial={{ opacity: 0.7, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="aspect-square bg-[var(--surface-2)] rounded-2xl overflow-hidden border border-[var(--border)]"
      >
        <img
          src={imgs[selected]?.url}
          alt={name}
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                selected === i
                  ? 'border-[var(--brand-primary)] scale-105'
                  : 'border-[var(--border)] hover:border-gray-400'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuantitySelector({ value, onChange, max }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1 w-fit">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--text-secondary)]"
        id="qty-decrease"
      >
        <Minus size={16} />
      </button>
      <span className="w-10 text-center font-bold text-[var(--text-primary)]">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--text-secondary)]"
        id="qty-increase"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { user, isLoggedIn } = useAuthStore();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [wishlisted, setWishlisted] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data.product);
        setRelatedProducts(res.data.relatedProducts || []);
        if (res.data.product.colorVariants?.length > 0) {
          setSelectedColor(res.data.product.colorVariants[0]);
        }
      })
      .catch(() => {
        toast.error('Product not found');
        navigate('/products');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedColor?.name);
  };

  const handleBuyNow = () => {
    if (!isLoggedIn()) {
      toast.error('Please login to continue');
      navigate(`/login?redirect=/products/${id}`);
      return;
    }
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWishlist = async () => {
    if (!isLoggedIn()) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }
    try {
      await api.put(`/auth/wishlist/${id}`);
      setWishlisted(w => !w);
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist ❤️');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast.error('Please login to submit a review');
      return;
    }
    if (!reviewForm.comment.trim()) {
      setReviewError('Please write a comment');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    try {
      await api.post(`/products/${id}/reviews`, reviewForm);
      toast.success('Review submitted! Thank you 🎉');
      setReviewForm({ rating: 5, comment: '' });
      // Refresh product to show new review
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.product);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-6">
            <div className="skeleton h-8 w-3/4 rounded-xl" />
            <div className="skeleton h-5 w-1/3 rounded-xl" />
            <div className="skeleton h-12 w-1/2 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
            <div className="skeleton h-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const finalPrice = product.discountedPrice || product.price;
  const discountPct = product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
          <Link to="/" className="hover:text-[var(--brand-primary)] transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/products" className="hover:text-[var(--brand-primary)] transition-colors">Products</Link>
          <ChevronRight size={14} />
          <Link
            to={`/products?category=${product.category?.slug}`}
            className="hover:text-[var(--brand-primary)] transition-colors"
          >
            {product.category?.name}
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--text-primary)] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] mb-8 transition-colors group"
          id="back-button"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        {/* ── MAIN PRODUCT SECTION ─────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ImageGallery images={product.images} name={product.name} />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Brand & Category */}
            <div className="flex items-center gap-3">
              {product.brand && (
                <span className="text-xs font-bold text-white bg-[var(--brand-accent)] px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.brand}
                </span>
              )}
              <Link
                to={`/products?category=${product.category?.slug}`}
                className="text-xs font-medium text-[var(--brand-primary)] hover:underline uppercase tracking-wider"
              >
                {product.category?.name}
              </Link>
            </div>

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] font-['Outfit'] leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <StarRating rating={product.rating} size={18} />
              <span className="font-bold text-[var(--text-primary)]">{product.rating?.toFixed(1)}</span>
              <span className="text-[var(--text-muted)] text-sm">
                ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
              </span>
              <span className={`ml-auto text-sm font-semibold ${product.stockQuantity > 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {product.stockQuantity > 0 ? `✅ In Stock (${product.stockQuantity})` : '❌ Out of Stock'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4 py-4 border-y border-[var(--border)]">
              <span className="text-4xl font-black text-[var(--brand-primary)]">
                ₹{finalPrice.toFixed(2)}
              </span>
              {product.discountedPrice && (
                <>
                  <span className="text-xl text-[var(--text-muted)] line-through mb-1">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <span className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-bold px-3 py-1 rounded-full mb-1">
                    {discountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Color Variants */}
            {product.colorVariants?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                  Color: <span className="text-[var(--text-primary)]">{selectedColor?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colorVariants.map((variant) => (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedColor(variant)}
                      title={variant.name}
                      className={`group relative w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                        selectedColor?.name === variant.name
                          ? 'border-[var(--brand-primary)] scale-110 shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: variant.hexCode || '#ccc' }}
                    >
                      {selectedColor?.name === variant.name && (
                        <CheckCircle size={14} className="absolute inset-0 m-auto text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Quantity</p>
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={product.stockQuantity}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex-1 btn-secondary py-3.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                id="product-add-to-cart"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className="flex-1 btn-primary py-3.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                id="product-buy-now"
              >
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={`p-3.5 border-2 rounded-xl transition-all ${
                  wishlisted
                    ? 'border-red-500 bg-red-500/10 text-red-500'
                    : 'border-[var(--border)] hover:border-red-400 hover:text-red-500'
                }`}
                id="product-wishlist"
              >
                <Heart size={18} className={wishlisted ? 'fill-red-500' : ''} />
              </button>
              <button
                onClick={handleShare}
                className="p-3.5 border-2 border-[var(--border)] rounded-xl hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-all"
                id="product-share"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, title: 'Free Delivery', sub: 'Orders ₹499+' },
                { icon: ShieldCheck, title: 'Genuine Product', sub: '100% Authentic' },
                { icon: RotateCcw, title: 'Easy Returns', sub: '7-day policy' },
              ].map((b) => (
                <div key={b.title} className="bg-[var(--surface-2)] rounded-xl p-3 text-center">
                  <b.icon size={20} className="mx-auto mb-2 text-[var(--brand-primary)]" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{b.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/products?search=${encodeURIComponent(tag)}`}
                    className="text-xs px-3 py-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text-muted)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── TABS: Description / Specifications / Reviews ─────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          {/* Tab headers */}
          <div className="flex border-b border-[var(--border)] gap-1 mb-8 overflow-x-auto">
            {[
              { id: 'description', label: 'Description' },
              { id: 'specifications', label: 'Specifications' },
              { id: 'reviews', label: `Reviews (${product.numReviews})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                id={`tab-${tab.id}`}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px ${
                  activeTab === tab.id
                    ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div
                key="desc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl"
              >
                <p className="text-[var(--text-secondary)] leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div
                key="specs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                {product.specifications?.length > 0 ? (
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                    {product.specifications.map((spec, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}`}
                      >
                        <div className="w-1/3 px-5 py-3 font-semibold text-sm text-[var(--text-secondary)] border-r border-[var(--border)]">
                          {spec.key}
                        </div>
                        <div className="flex-1 px-5 py-3 text-sm text-[var(--text-primary)]">
                          {spec.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--text-muted)]">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No specifications available for this product.</p>
                    <p className="text-sm mt-1">Contact us for detailed product information.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Rating summary */}
                <div className="flex items-center gap-8 p-6 bg-[var(--surface-2)] rounded-2xl max-w-md">
                  <div className="text-center">
                    <p className="text-5xl font-black text-[var(--text-primary)]">{product.rating?.toFixed(1)}</p>
                    <StarRating rating={product.rating} size={16} />
                    <p className="text-xs text-[var(--text-muted)] mt-1">{product.numReviews} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5,4,3,2,1].map((star) => {
                      const count = product.reviews?.filter(r => Math.round(r.rating) === star).length || 0;
                      const pct = product.numReviews > 0 ? (count / product.numReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-4">{star}</span>
                          <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          <div className="flex-1 bg-[var(--border)] rounded-full h-1.5">
                            <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-4 text-[var(--text-muted)]">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews list */}
                {product.reviews?.length > 0 ? (
                  <div className="space-y-4 max-w-3xl">
                    {product.reviews.map((review) => (
                      <div key={review._id} className="card p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {review.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-[var(--text-primary)]">{review.name}</p>
                              <span className="text-xs text-[var(--text-muted)]">
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <StarRating rating={review.rating} size={13} />
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mt-2">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm">Be the first to review this product!</p>
                  </div>
                )}

                {/* Write Review Form */}
                <div className="max-w-2xl border-t border-[var(--border)] pt-8">
                  <h3 className="font-bold text-[var(--text-primary)] text-lg mb-5 flex items-center gap-2">
                    <MessageSquare size={20} className="text-[var(--brand-primary)]" />
                    Write a Review
                  </h3>

                  {!isLoggedIn() ? (
                    <div className="p-5 bg-[var(--surface-2)] rounded-xl text-center">
                      <p className="text-[var(--text-secondary)] mb-3">Please login to write a review</p>
                      <Link to={`/login?redirect=/products/${id}`} className="btn-primary text-sm">
                        Login to Review
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Star rating picker */}
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Your Rating</p>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                size={28}
                                className={star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-[var(--text-muted)] self-center">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating]}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Your Review</p>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                          placeholder="Share your experience with this product..."
                          rows={4}
                          id="review-comment"
                          className="input-field resize-none"
                        />
                      </div>
                      {reviewError && (
                        <div className="flex items-center gap-2 text-red-500 text-sm">
                          <AlertCircle size={16} /> {reviewError}
                        </div>
                      )}
                      <button type="submit" disabled={submittingReview} className="btn-primary" id="submit-review">
                        {submittingReview ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Review'}
                      </button>
                    </form>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── RELATED PRODUCTS ──────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">
                Related Products
              </h2>
              <Link
                to={`/products?category=${product.category?.slug}`}
                className="text-sm text-[var(--brand-primary)] hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((rp) => (
                <Link key={rp._id} to={`/products/${rp._id}`} className="group card overflow-hidden">
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={rp.images?.[0]?.url || `https://placehold.co/200x200/1a1a2e/e94560?text=${encodeURIComponent(rp.name)}`}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 mb-1">{rp.name}</p>
                    <div className="flex items-center gap-1 mb-1">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-[var(--text-muted)]">{rp.rating?.toFixed(1)}</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--brand-primary)]">
                      ₹{(rp.discountedPrice || rp.price)?.toFixed(0)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
