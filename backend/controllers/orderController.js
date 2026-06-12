const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/sendEmail');
const { orderConfirmationTemplate, shopkeeperOrderAlertTemplate } = require('../utils/emailTemplates');

// Lazy init — prevents crash on startup if env vars not yet loaded
const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── CREATE ORDER ────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, upiTxnId } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    if (paymentMethod === 'upi' && (!upiTxnId || !/^\d{12}$/.test(upiTxnId))) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 12-digit UPI UTR number' });
    }

    // Verify stock and get current prices from DB
    const verifiedItems = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
        });
      }
      const price = product.discountedPrice || product.price;
      subtotal += price * item.quantity;
      verifiedItems.push({
        product: product._id,
        name: product.name,
        price,
        quantity: item.quantity,
        image: product.images[0]?.url || '',
        colorVariant: item.colorVariant,
      });
    }

    const shippingCharge = subtotal >= 499 ? 0 : 49;
    const tax = parseFloat((subtotal * 0.18).toFixed(2)); // 18% GST
    const totalAmount = parseFloat((subtotal + shippingCharge + tax).toFixed(2));

    // Create Razorpay order if selected
    let razorpayOrderId = null;
    if (paymentMethod === 'razorpay') {
      const rzpOrder = await getRazorpay().orders.create({
        amount: Math.round(totalAmount * 100), // in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });
      razorpayOrderId = rzpOrder.id;
    }

    const order = await Order.create({
      user: req.user._id,
      orderItems: verifiedItems,
      shippingAddress,
      subtotal,
      shippingCharge,
      tax,
      totalAmount,
      paymentMethod,
      razorpayOrderId,
      upiTxnId,
    });

    // Decrease stock immediately for COD and UPI orders (since they are placed instantly)
    if (paymentMethod === 'cod' || paymentMethod === 'upi') {
      for (const item of verifiedItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: -item.quantity, soldCount: item.quantity },
        });
      }

      // Send emails immediately for COD/UPI orders
      const populatedOrder = await Order.findById(order._id).populate('user', 'name email');
      Promise.all([
        sendEmail({
          to: populatedOrder.shippingAddress.email,
          subject: paymentMethod === 'upi'
            ? `⏳ Order Placed (Awaiting Payment Verification) #${populatedOrder.invoiceNumber}`
            : `🎉 Order Confirmed! #${populatedOrder.invoiceNumber}`,
          html: orderConfirmationTemplate(populatedOrder, populatedOrder.user),
        }),
        sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: paymentMethod === 'upi'
            ? `🔔 New UPI Order Awaiting Verification! ₹${populatedOrder.totalAmount} — #${populatedOrder.invoiceNumber}`
            : `🔔 New COD Order Received! ₹${populatedOrder.totalAmount} — #${populatedOrder.invoiceNumber}`,
          html: shopkeeperOrderAlertTemplate(populatedOrder),
        }),
      ]).catch((err) => console.error('Email send error:', err.message));
    }

    res.status(201).json({
      success: true,
      order,
      razorpayOrderId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      totalAmount,
    });
  } catch (error) {
    next(error);
  }
};

// ── VERIFY PAYMENT ──────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update order
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
        $push: { statusHistory: { status: 'confirmed', note: 'Payment verified' } },
      },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Decrease stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity, soldCount: item.quantity },
      });
    }

    // Send emails (non-blocking)
    Promise.all([
      sendEmail({
        to: order.shippingAddress.email,
        subject: `🎉 Order Confirmed! #${order.invoiceNumber}`,
        html: orderConfirmationTemplate(order, order.user),
      }),
      sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `🔔 New Order Received! ₹${order.totalAmount} — #${order.invoiceNumber}`,
        html: shopkeeperOrderAlertTemplate(order),
      }),
    ]).catch((err) => console.error('Email send error:', err.message));

    res.status(200).json({ success: true, message: 'Payment verified successfully', order });
  } catch (error) {
    next(error);
  }
};

// ── GET MY ORDERS ───────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderItems.product', 'name images'),
      Order.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET SINGLE ORDER ────────────────────────────────────
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Only owner or admin can view
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: GET ALL ORDERS ───────────────────────────────
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.orderStatus = req.query.status;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email phone'),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total },
    });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: UPDATE ORDER STATUS ──────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, note } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = order.orderStatus;
    const previousPaymentStatus = order.paymentStatus;

    if (status) {
      order.orderStatus = status;
      order.statusHistory.push({
        status,
        updatedBy: req.user._id,
        note: note || `Order status updated to ${status}`,
      });

      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }

      if (status === 'cancelled' && previousStatus !== 'cancelled') {
        order.cancelledAt = new Date();
        order.cancellationReason = note || 'Cancelled by admin';

        // Restore stock if the order was previously active/confirmed (i.e. stock was decreased)
        // Stock is decreased immediately for COD and UPI orders on creation,
        // and for Razorpay orders on successful payment.
        const wasStockDecreased = order.paymentMethod === 'cod' ||
                                  order.paymentMethod === 'upi' ||
                                  previousPaymentStatus === 'paid';

        if (wasStockDecreased) {
          for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stockQuantity: item.quantity, soldCount: -item.quantity },
            });
          }
        }
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
        order.paidAt = new Date();

        // If it was processing/pending verification and is now paid, confirm the order status as well
        if (order.orderStatus === 'processing') {
          order.orderStatus = 'confirmed';
          order.statusHistory.push({
            status: 'confirmed',
            updatedBy: req.user._id,
            note: 'Payment verified manually by admin',
          });
        }

        // Trigger payment confirmation email
        sendEmail({
          to: order.shippingAddress.email,
          subject: `🎉 Payment Verified & Confirmed! #${order.invoiceNumber}`,
          html: orderConfirmationTemplate(order, order.user),
        }).catch((err) => console.error('Email send error:', err.message));
      }
    }

    await order.save();

    res.status(200).json({ success: true, message: 'Order updated successfully', order });
  } catch (error) {
    next(error);
  }
};

// ── ADMIN: REVENUE ANALYTICS ────────────────────────────
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const [
      totalOrders,
      paidOrders,
      totalRevenue,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.countDocuments({ orderStatus: 'processing' }),
      Order.countDocuments({ orderStatus: 'confirmed' }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Order.find({ paymentStatus: 'paid' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email'),
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          totalSold: { $sum: '$orderItems.quantity' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        paidOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        recentOrders,
        monthlyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};
