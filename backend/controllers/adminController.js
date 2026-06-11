const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

// ── GET ALL USERS (ADMIN) ────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalUsers: total },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET SINGLE USER (ADMIN) ──────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 }).limit(5);
    res.status(200).json({ success: true, user, recentOrders: orders });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE USER ROLE (ADMIN) ─────────────────────────────
exports.updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
};

// ── TOGGLE USER ACTIVE STATUS (ADMIN) ───────────────────
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// ── ACTIVITY LOGS (ADMIN) ────────────────────────────────
exports.getActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    const total = await ActivityLog.countDocuments();

    res.status(200).json({
      success: true,
      logs,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN DASHBOARD SUMMARY ──────────────────────────────
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenue] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
