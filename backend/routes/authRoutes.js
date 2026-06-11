const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile, changePassword,
  forgotPassword, resetPassword, verifyEmail,
  addAddress, updateAddress, deleteAddress, toggleWishlist,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please slow down' },
});

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.use(protect);
router.get('/logout', logout);
router.get('/me', generalLimiter, getMe);
router.put('/profile', generalLimiter, updateProfile);
router.put('/change-password', authLimiter, changePassword);

// Addresses
router.post('/address', addAddress);
router.put('/address/:addressId', updateAddress);
router.delete('/address/:addressId', deleteAddress);

// Wishlist
router.put('/wishlist/:productId', toggleWishlist);

module.exports = router;
