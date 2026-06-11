const express = require('express');
const router = express.Router();
const {
  createOrder, verifyPayment, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus, getRevenueAnalytics,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Customer routes
router.post('/', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Admin routes
router.get('/', protect, authorize('admin'), getAllOrders);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.get('/admin/analytics', protect, authorize('admin'), getRevenueAnalytics);

module.exports = router;
