import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ShoppingCart, Paintbrush, Wrench, Zap, Droplets, Package, ChevronRight, Play } from 'lucide-react';
import api from '../lib/axios';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

const categories = [
  { name: 'Paints', slug: 'paints', emoji: '🎨', color: 'from-red-500 to-pink-600', desc: 'Interior, exterior & specialty' },
  { name: 'Wall Putty', slug: 'wall-putty', emoji: '🪣', color: 'from-blue-500 to-cyan-600', desc: 'Smooth finish solutions' },
  { name: 'Brushes', slug: 'brushes', emoji: '🖌️', color: 'from-green-500 to-emerald-600', desc: 'Professional grade brushes' },
  { name: 'Rollers', slug: 'rollers', emoji: '🔄', color: 'from-purple-500 to-violet-600', desc: 'For large surface coverage' },
  { name: 'Hardware Tools', slug: 'hardware-tools', emoji: '🔧', color: 'from-orange-500 to-amber-600', desc: 'Power & hand tools' },
  { name: 'Plumbing', slug: 'plumbing-items', emoji: '🚿', color: 'from-teal-500 to-cyan-600', desc: 'Pipes, fittings & fixtures' },
  { name: 'Electrical', slug: 'electrical-items', emoji: '⚡', color: 'from-yellow-500 to-orange-600', desc: 'Wires, switches & panels' },
  { name: 'Cement', slug: 'cement-products', emoji: '🧱', color: 'from-gray-500 to-slate-600', desc: 'OPC, PPC & rapid cement' },
  { name: 'Construction', slug: 'construction-accessories', emoji: '🏗️', color: 'from-rose-500 to-red-600', desc: 'Rebar, formwork & more' },
];

const reviews = [
  { name: 'Rajesh Kumar', rating: 5, comment: 'Excellent quality products! The AI paint visualizer helped me choose the perfect color for my living room.', avatar: 'R', city: 'Hyderabad' },
  { name: 'Priya Sharma', rating: 5, comment: 'Fast delivery, great prices. The hardware tools are top quality. Highly recommend!', avatar: 'P', city: 'Bangalore' },
  { name: 'Mohammed Ali', rating: 4, comment: 'Very helpful customer service. The paint color turned out exactly as shown in the visualizer.', avatar: 'M', city: 'Chennai' },
  { name: 'Deepa Nair', rating: 5, comment: 'Best hardware store online! Got all my renovation materials in one place. Amazing experience.', avatar: 'D', city: 'Mumbai' },
];

const stats = [
  { label: 'Happy Customers', value: '15,000+', icon: '😊' },
  { label: 'Products Available', value: '2,500+', icon: '📦' },
  { label: 'Cities Served', value: '50+', icon: '🏙️' },
  { label: 'Years of Trust', value: '12+', icon: '🏆' },
];

function ProductCard({ product }) {
  const { addItem } = useCartStore();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="card group overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0]?.url || `https://placehold.co/400x400/1a1a2e/e94560?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-[var(--brand-primary)] text-white text-xs font-bold px-2.5 py-1 rounded-full">
            ⭐ Featured
          </span>
        )}
        {product.discountedPrice && (
          <span className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
          </span>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      </div>
      <div className="p-4">
        <p className="text-xs text-[var(--brand-primary)] font-medium mb-1">{product.category?.name}</p>
        <h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-2 mb-2 group-hover:text-[var(--brand-primary)] transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < Math.round(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
          ))}
          <span className="text-xs text-[var(--text-muted)] ml-1">({product.numReviews})</span>
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
            className="flex-1 btn-primary text-sm py-2"
            id={`add-to-cart-${product._id}`}
          >
            <ShoppingCart size={15} /> Add to Cart
          </button>
          <Link
            to={`/products/${product._id}`}
            className="px-3 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowRight size={15} className="text-[var(--text-secondary)]" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then(res => setFeaturedProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[var(--brand-primary)] rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span className="inline-flex items-center gap-2 bg-[var(--brand-primary)]/20 border border-[var(--brand-primary)]/30 text-[var(--brand-primary)] text-sm font-semibold px-4 py-2 rounded-full mb-6">
              🎨 India's #1 Paint & Hardware Store
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight font-['Outfit'] mb-6">
              Transform Your
              <span className="block gradient-text">Space with Color</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
              Discover premium paints, hardware tools, and building materials. Use our AI-powered visualizer to see your colors before you paint.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary text-base px-8 py-4">
                Shop Now <ArrowRight size={20} />
              </Link>
              <Link to="/visualizer" className="btn-secondary text-base px-8 py-4 border-white/30 text-white hover:bg-white/10">
                <Paintbrush size={20} /> Try AI Visualizer
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.icon} {s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/20 to-purple-600/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-3xl p-6 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  {/* Paint color swatches */}
                  {[
                    ['#e94560', '#c0392b', '#922b21', '#7b241c'],
                    ['#2980b9', '#1a5276', '#1f618d', '#154360'],
                    ['#27ae60', '#1e8449', '#196f3d', '#145a32'],
                    ['#f39c12', '#d68910', '#b7770d', '#9a7d0a'],
                  ].map((row, ri) => (
                    <div key={ri} className="grid grid-cols-4 gap-1 rounded-xl overflow-hidden">
                      {row.map((color) => (
                        <div
                          key={color}
                          className="aspect-square rounded-lg cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white font-semibold text-sm mb-1">🤖 AI Color Visualizer</p>
                  <p className="text-gray-400 text-xs">Upload your room photo and preview any color instantly</p>
                  <Link
                    to="/visualizer"
                    className="mt-3 flex items-center gap-2 text-[var(--brand-primary)] text-sm font-semibold hover:underline"
                  >
                    Try it free <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────── */}
      <section className="py-20 section-gradient">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-[var(--text-primary)] font-['Outfit'] mb-4">
              Shop by Category
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
              Everything you need for your construction, renovation, and painting projects
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/products?category=${cat.slug}`}>
                  <div className="group card p-5 text-center hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                      {cat.emoji}
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">{cat.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{cat.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI VISUALIZER BANNER ──────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand-accent)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand-primary)]/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[var(--brand-primary)] font-semibold text-sm uppercase tracking-wider">AI-Powered</span>
            <h2 className="text-4xl font-black text-white font-['Outfit'] mt-2 mb-5">
              See Your Colors Before You Paint
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Upload a photo of your room or wall and instantly visualize how different paint colors will look. Choose from 10+ premium colors and compare before & after.
            </p>
            <div className="space-y-4 mb-8">
              {[
                '📸 Upload any room or wall photo',
                '🎨 Choose from 10+ premium paint colors',
                '⚡ Instant AI-powered color preview',
                '🔄 Side-by-side before & after comparison',
                '💾 Download and share your vision',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-gray-300">
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link to="/visualizer" className="btn-primary text-base px-8 py-4">
              Try AI Visualizer Free <ArrowRight size={20} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass rounded-3xl p-6 border border-white/10">
              <div className="grid grid-cols-5 gap-2 mb-6">
                {[
                  ['#e74c3c','Red'],['#3498db','Blue'],['#2ecc71','Green'],
                  ['#f1c40f','Yellow'],['#ecf0f1','White'],
                  ['#f5f0e8','Cream'],['#e67e22','Orange'],['#95a5a6','Grey'],
                  ['#795548','Brown'],['#9b59b6','Purple'],
                ].map(([color, name]) => (
                  <div key={name} className="text-center">
                    <div
                      className="w-full aspect-square rounded-xl border-2 border-white/10 hover:border-white/40 hover:scale-110 transition-all cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">{name}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-white font-semibold mb-1">Select a color to preview →</p>
                <p className="text-gray-400 text-xs">Works on any room photo you upload</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <h2 className="text-4xl font-black text-[var(--text-primary)] font-['Outfit']">Featured Products</h2>
              <p className="text-[var(--text-secondary)] mt-2">Hand-picked bestsellers loved by our customers</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-[var(--brand-primary)] font-semibold hover:underline text-sm">
              View all <ArrowRight size={16} />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-3">
                    <div className="skeleton h-4 w-2/3 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-6 w-1/3 rounded" />
                    <div className="skeleton h-9 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">📦</p>
              <p className="text-[var(--text-secondary)]">Products will appear here once added by admin.</p>
              <Link to="/products" className="btn-primary mt-4">Browse All Products</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── REVIEWS ───────────────────────────────────────────── */}
      <section className="py-20 section-gradient">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-black text-[var(--text-primary)] font-['Outfit']">What Customers Say</h2>
            <p className="text-[var(--text-secondary)] mt-3 text-lg">Trusted by thousands across India</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5 italic">
                  "{review.comment}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{review.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{review.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hero-gradient rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[var(--brand-primary)]/5 pointer-events-none" />
            <h2 className="text-4xl font-black text-white font-['Outfit'] mb-4">
              Ready to Transform Your Space?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
              Join 15,000+ happy customers. Shop premium products with fast delivery and expert support.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base px-10 py-4">
                Get Started Free <ArrowRight size={20} />
              </Link>
              <Link to="/visualizer" className="btn-secondary text-base px-10 py-4 border-white/30 text-white hover:bg-white/10">
                <Paintbrush size={20} /> Try AI Visualizer
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
