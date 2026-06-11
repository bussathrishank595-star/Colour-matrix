const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: String,
    image: {
      public_id: String,
      url: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('save', function () {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
});

module.exports = mongoose.model('Category', categorySchema);
