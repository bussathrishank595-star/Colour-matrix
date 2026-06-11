const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    endpoint: String,
    method: String,
    ipAddress: String,
    userAgent: String,
    status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
    details: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
