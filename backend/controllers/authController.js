const crypto = require('crypto');
const User = require('../models/User');
const sendTokenResponse = require('../utils/sendToken');
const { sendEmail } = require('../utils/sendEmail');
const {
  emailVerificationTemplate,
  passwordResetTemplate,
} = require('../utils/emailTemplates');

// ── REGISTER ───────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, phone });

    // Send verification email
    const verifyToken = user.getEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: '✅ Verify Your Email — Smart Paint & Hardware Store',
        html: emailVerificationTemplate(user.name, verifyUrl),
      });
    } catch (emailErr) {
      console.error('Email send error:', emailErr.message);
      // Don't fail registration if email fails
    }

    sendTokenResponse(user, 201, res, 'Registration successful! Please verify your email.');
  } catch (error) {
    next(error);
  }
};

// ── VERIFY EMAIL ────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully! You can now login.' });
  } catch (error) {
    next(error);
  }
};

// ── LOGIN ──────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// ── LOGOUT ─────────────────────────────────────────────
exports.logout = (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ── GET CURRENT USER ────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name price images');
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE PROFILE ──────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// ── CHANGE PASSWORD ─────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

// ── FORGOT PASSWORD ─────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: '🔐 Password Reset — Smart Paint & Hardware Store',
      html: passwordResetTemplate(user.name, resetUrl),
    });

    res.status(200).json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
    });
  } catch (error) {
    // Clean up tokens on failure
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    next(error);
  }
};

// ── RESET PASSWORD ──────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful');
  } catch (error) {
    next(error);
  }
};

// ── MANAGE ADDRESSES ────────────────────────────────────
exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
    Object.assign(addr, req.body);
    await user.save();
    res.status(200).json({ success: true, message: 'Address updated', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.addressId
    );
    await user.save();
    res.status(200).json({ success: true, message: 'Address deleted', addresses: user.addresses });
  } catch (error) {
    next(error);
  }
};

// ── WISHLIST ────────────────────────────────────────────
exports.toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);

    if (idx > -1) {
      user.wishlist.splice(idx, 1);
      await user.save();
      return res.status(200).json({ success: true, message: 'Removed from wishlist', wishlisted: false });
    } else {
      user.wishlist.push(productId);
      await user.save();
      return res.status(200).json({ success: true, message: 'Added to wishlist', wishlisted: true });
    }
  } catch (error) {
    next(error);
  }
};
