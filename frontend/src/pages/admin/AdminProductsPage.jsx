import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Search, Filter, X, Save,
  Package, Star, IndianRupee, Image,
  ChevronDown, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

// ── Confirm Dialog ─────────────────────────────────────────
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--border)]">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-center text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const UNITS = ['piece', 'litre', 'kg', 'box', 'roll', 'set', 'bag', 'metre'];

const EMPTY_FORM = {
  name: '', description: '', price: '', discountedPrice: '',
  category: '', stockQuantity: '', brand: '', unit: 'piece',
  isFeatured: false, imageUrl: ''
};

// ── Product Form Modal ─────────────────────────────────────
function ProductModal({ open, product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = !!product;

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price ?? '',
          discountedPrice: product.discountedPrice ?? '',
          // category may be populated object or raw ID
          category: product.category?._id || product.category || '',
          stockQuantity: product.stockQuantity ?? '',
          brand: product.brand || '',
          unit: product.unit || 'piece',
          isFeatured: product.isFeatured || false,
          imageUrl: product.images?.[0]?.url || '',
        });
      } else {
        setForm({ ...EMPTY_FORM, category: categories[0]?._id || '' });
      }
    }
  }, [product, open, categories]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.stockQuantity || !form.category) {
      toast.error('Name, Price, Stock and Category are required');
      return;
    }
    setSaving(true);
    try {
      // Build FormData so the backend's multer middleware is satisfied
      // (even with no file, it accepts JSON body for updates)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
        category: form.category,
        stockQuantity: Number(form.stockQuantity),
        brand: form.brand.trim(),
        isFeatured: form.isFeatured,
      };

      // If admin provided an imageUrl, inject it as an image array via a tiny workaround
      if (form.imageUrl.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }

      if (isEdit) {
        await api.put(`/products/${product._id}`, payload);
        toast.success('Product updated! ✅');
      } else {
        await api.post('/products', payload);
        toast.success('Product added! ✅');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-[var(--surface)] rounded-2xl w-full max-w-xl my-8 shadow-2xl border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center">
              <Package size={17} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition-colors">
            <X size={18} className="text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Product Name *
            </label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Asian Paints Royale Matt"
              className="input-field w-full" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Description
            </label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              placeholder="Product description..."
              className="input-field w-full resize-none" />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Price (₹) *
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input name="price" type="number" min="0" step="0.01"
                  value={form.price} onChange={handleChange} required
                  placeholder="0.00" className="input-field w-full pl-8" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Discount Price (₹)
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input name="discountedPrice" type="number" min="0" step="0.01"
                  value={form.discountedPrice} onChange={handleChange}
                  placeholder="Optional" className="input-field w-full pl-8" />
              </div>
            </div>
          </div>

          {/* Category + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Category *
              </label>
              <div className="relative">
                <select name="category" value={form.category} onChange={handleChange} required
                  className="input-field w-full appearance-none pr-8">
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Stock Qty *
              </label>
              <input name="stockQuantity" type="number" min="0"
                value={form.stockQuantity} onChange={handleChange} required
                placeholder="0" className="input-field w-full" />
            </div>
          </div>

          {/* Brand + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Brand
              </label>
              <input name="brand" value={form.brand} onChange={handleChange}
                placeholder="e.g. Asian Paints" className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                Unit
              </label>
              <div className="relative">
                <select name="unit" value={form.unit} onChange={handleChange}
                  className="input-field w-full appearance-none pr-8">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
              Image URL
            </label>
            <div className="relative">
              <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input name="imageUrl" value={form.imageUrl} onChange={handleChange}
                placeholder="https://..." className="input-field w-full pl-8" />
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview"
                className="mt-2 h-16 w-16 object-cover rounded-lg border border-[var(--border)]"
                onError={e => { e.target.style.display = 'none'; }} />
            )}
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl cursor-pointer select-none">
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange}
              className="w-4 h-4 accent-[var(--brand-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Featured Product</p>
              <p className="text-xs text-[var(--text-muted)]">Show on homepage featured section</p>
            </div>
            <Star size={16} className={`ml-auto ${form.isFeatured ? 'text-yellow-500 fill-yellow-500' : 'text-[var(--text-muted)]'}`} />
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
              {saving
                ? <><RefreshCw size={15} className="animate-spin" /> Saving…</>
                : <><Save size={15} /> {isEdit ? 'Update Product' : 'Add Product'}</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Products Page ─────────────────────────────────────
export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load categories once
  useEffect(() => {
    api.get('/products/categories')
      .then(r => setCategories(r.data.categories || []))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort: '-createdAt' });
      if (search) params.set('search', search);
      if (filterCat) params.set('category', filterCat);   // slug filter
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
      // API returns: { pagination: { totalPages, totalProducts } }
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProducts(data.pagination?.totalProducts || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, filterCat]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProducts(); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteTarget._id}`);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const stockBadge = (qty) => {
    if (qty === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (qty < 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-700 bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">
            Product Management
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {totalProducts} products in store
          </p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
          <Plus size={17} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…" className="input-field w-full pl-10" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}
            className="input-field pl-8 pr-8 appearance-none min-w-[160px]">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-[var(--brand-primary)]" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-muted)] font-medium">No products found</p>
            <button
              onClick={() => { setEditProduct(null); setModalOpen(true); }}
              className="mt-4 text-sm text-[var(--brand-primary)] hover:underline">
              Add your first product →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  {['Product', 'Category', 'Price', 'Stock', 'Featured', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <motion.tr key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">

                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url
                            ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <Package size={16} className="text-[var(--text-muted)]" />
                              </div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{p.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{p.brand || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1 bg-[var(--surface-2)] rounded-full border border-[var(--border)] text-[var(--text-muted)]">
                        {typeof p.category === 'object' ? (p.category?.name || '—') : (p.category || '—')}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </p>
                      {p.discountedPrice && (
                        <p className="text-xs text-green-600 font-semibold">
                          Sale: ₹{Number(p.discountedPrice).toLocaleString('en-IN')}
                        </p>
                      )}
                    </td>

                    {/* Stock — field is stockQuantity */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${stockBadge(p.stockQuantity)}`}>
                        {p.stockQuantity === 0 ? 'Out of Stock' : `${p.stockQuantity} left`}
                      </span>
                    </td>

                    {/* Featured — field is isFeatured */}
                    <td className="px-4 py-3">
                      {p.isFeatured
                        ? <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                            <Star size={11} fill="currentColor" /> Yes
                          </span>
                        : <span className="text-xs text-[var(--text-muted)]">No</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditProduct(p); setModalOpen(true); }}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                          title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <button key={pg} onClick={() => setPage(pg)}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                page === pg
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]'
              }`}>
              {pg}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProductModal
        open={modalOpen}
        product={editProduct}
        categories={categories}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSaved={fetchProducts}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
