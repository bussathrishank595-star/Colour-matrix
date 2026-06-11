const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    avatar: {
      public_id: String,
      url: { type: String, default: '' },
    },
    addresses: [
      {
        fullName: String,
        phone: String,
        houseNumber: String,
        street: String,
        area: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function () {
  const verifyToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verifyToken;
};

module.exports = mongoose.model('User', userSchema);
