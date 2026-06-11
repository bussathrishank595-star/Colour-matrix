const mongoose = require('mongoose');

const colorVisualizationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalImage: {
      public_id: String,
      url: { type: String, required: true },
    },
    processedImage: {
      public_id: String,
      url: String,
    },
    colorApplied: {
      name: String,
      hexCode: String,
    },
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    sessionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('ColorVisualization', colorVisualizationSchema);
