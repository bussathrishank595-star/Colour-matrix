const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserById, updateUserRole, toggleUserStatus,
  getActivityLogs, getDashboardSummary,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes are protected
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardSummary);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.get('/logs', getActivityLogs);

module.exports = router;
