const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  addReview, getCategories, createCategory, updateCategory, deleteCategory,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// Multer config (temp storage before Cloudinary)
const storage = multer.diskStorage({
  destination: '/tmp/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ── Category Routes ──────────────────────────────────────
router.get('/categories', getCategories);
router.post('/categories', protect, authorize('admin'), upload.single('image'), createCategory);
router.put('/categories/:id', protect, authorize('admin'), updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), deleteCategory);

// ── Product Routes ────────────────────────────────────────
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('admin'), upload.array('images', 5), createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

// ── Reviews ───────────────────────────────────────────────
router.post('/:id/reviews', protect, addReview);

module.exports = router;
