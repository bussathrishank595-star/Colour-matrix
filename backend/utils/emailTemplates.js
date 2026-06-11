// ──────────────────────────────────────────────
//  EMAIL TEMPLATES for Smart Paint & Hardware Store
// ──────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Paint & Hardware Store</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: #e94560; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .header p { color: #a0aec0; margin: 6px 0 0; font-size: 13px; }
    .content { padding: 32px 40px; }
    .content h2 { color: #1a1a2e; margin-top: 0; }
    .content p { color: #4a5568; line-height: 1.7; }
    .btn { display: inline-block; background: linear-gradient(135deg, #e94560, #c0392b); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #1a1a2e; color: #fff; padding: 12px 16px; text-align: left; font-size: 13px; }
    .table td { padding: 12px 16px; border-bottom: 1px solid #e8e8e8; color: #4a5568; font-size: 14px; }
    .table tr:last-child td { border-bottom: none; }
    .total-row td { background: #f7f7f7; font-weight: 700; color: #1a1a2e; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #c6f6d5; color: #276749; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .info-box { background: #f0f4ff; border-left: 4px solid #e94560; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .footer { background: #1a1a2e; padding: 24px 40px; text-align: center; }
    .footer p { color: #718096; font-size: 12px; margin: 4px 0; }
    .footer a { color: #e94560; text-decoration: none; }
    .divider { border: none; border-top: 1px solid #e8e8e8; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏪 Smart Paint & Hardware Store</h1>
      <p>Your one-stop shop for quality paints & hardware</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Smart Paint & Hardware Store. All rights reserved.</p>
      <p>Need help? <a href="mailto:${process.env.FROM_EMAIL}">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
`;

// ── EMAIL VERIFICATION ──────────────────────────────────
const emailVerificationTemplate = (name, verifyUrl) =>
  baseTemplate(`
    <h2>👋 Welcome, ${name}!</h2>
    <p>Thanks for registering with Smart Paint & Hardware Store. Please verify your email to activate your account.</p>
    <div style="text-align:center">
      <a href="${verifyUrl}" class="btn">✅ Verify Email Address</a>
    </div>
    <p style="font-size:13px;color:#718096">This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
  `);

// ── PASSWORD RESET ──────────────────────────────────────
const passwordResetTemplate = (name, resetUrl) =>
  baseTemplate(`
    <h2>🔐 Password Reset Request</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to set a new password.</p>
    <div style="text-align:center">
      <a href="${resetUrl}" class="btn">🔑 Reset My Password</a>
    </div>
    <p style="font-size:13px;color:#718096">This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
  `);

// ── ORDER CONFIRMATION (CUSTOMER) ──────────────────────
const orderConfirmationTemplate = (order, user) => {
  const itemsRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.price.toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return baseTemplate(`
    <h2>🎉 Order Confirmed!</h2>
    <p>Hi <strong>${user.name || order.shippingAddress.fullName}</strong>,</p>
    <p>Your order has been placed successfully. Here's your summary:</p>
    
    <div class="info-box">
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Invoice No:</strong> ${order.invoiceNumber}</p>
      <p><strong>Payment ID:</strong> ${order.razorpayPaymentId || 'N/A'}</p>
      <p><strong>Status:</strong> <span class="badge badge-success">✅ ${order.paymentStatus.toUpperCase()}</span></p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
    </div>

    <h3 style="color:#1a1a2e">🛍️ Order Items</h3>
    <table class="table">
      <thead>
        <tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      <tfoot>
        <tr><td colspan="3" style="text-align:right;font-weight:700;padding:12px 16px">Subtotal:</td><td style="text-align:right;padding:12px 16px">₹${order.subtotal?.toFixed(2)}</td></tr>
        <tr><td colspan="3" style="text-align:right;font-weight:700;padding:12px 16px">Shipping:</td><td style="text-align:right;padding:12px 16px">₹${order.shippingCharge?.toFixed(2) || '0.00'}</td></tr>
        <tr class="total-row"><td colspan="3" style="text-align:right;font-weight:700;padding:12px 16px">Grand Total:</td><td style="text-align:right;padding:12px 16px;font-size:18px;color:#e94560">₹${order.totalAmount.toFixed(2)}</td></tr>
      </tfoot>
    </table>

    <h3 style="color:#1a1a2e">📦 Delivery Address</h3>
    <div class="info-box">
      <p><strong>${order.shippingAddress.fullName}</strong></p>
      <p>${order.shippingAddress.houseNumber}, ${order.shippingAddress.street}</p>
      <p>${order.shippingAddress.area}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</p>
      <p>${order.shippingAddress.state}, India</p>
      <p>📞 ${order.shippingAddress.phone}</p>
    </div>
    <p>We'll notify you when your order is shipped. Thank you for shopping with us! 🎨</p>
  `);
};

// ── ORDER ALERT (SHOPKEEPER/ADMIN) ─────────────────────
const shopkeeperOrderAlertTemplate = (order) => {
  const itemsRows = order.orderItems
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">₹${item.price.toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  return baseTemplate(`
    <h2>🔔 New Order Received!</h2>
    <div class="info-box">
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Invoice:</strong> ${order.invoiceNumber}</p>
      <p><strong>Payment Ref:</strong> ${order.razorpayPaymentId || 'COD'}</p>
      <p><strong>Payment Status:</strong> <span class="badge badge-success">${order.paymentStatus.toUpperCase()}</span></p>
      <p><strong>Amount Received:</strong> <strong style="color:#e94560;font-size:18px">₹${order.totalAmount.toFixed(2)}</strong></p>
      <p><strong>Order Time:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
    </div>

    <h3 style="color:#1a1a2e">👤 Customer Details</h3>
    <div class="info-box">
      <p><strong>Name:</strong> ${order.shippingAddress.fullName}</p>
      <p><strong>Email:</strong> ${order.shippingAddress.email}</p>
      <p><strong>Phone:</strong> ${order.shippingAddress.phone}</p>
    </div>

    <h3 style="color:#1a1a2e">📍 Delivery Address</h3>
    <div class="info-box">
      <p>${order.shippingAddress.houseNumber}, ${order.shippingAddress.street}</p>
      <p>${order.shippingAddress.area}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</p>
      <p>${order.shippingAddress.state}, India</p>
      ${order.shippingAddress.landmark ? `<p>Landmark: ${order.shippingAddress.landmark}</p>` : ''}
    </div>

    <h3 style="color:#1a1a2e">🛒 Order Items</h3>
    <table class="table">
      <thead>
        <tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>${itemsRows}</tbody>
      <tfoot>
        <tr class="total-row"><td colspan="3" style="text-align:right;padding:12px 16px">GRAND TOTAL:</td><td style="text-align:right;padding:12px 16px;font-size:18px;color:#e94560">₹${order.totalAmount.toFixed(2)}</td></tr>
      </tfoot>
    </table>
    <p><em>Please process and ship this order at the earliest. 🚚</em></p>
  `);
};

module.exports = {
  emailVerificationTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  shopkeeperOrderAlertTemplate,
};
