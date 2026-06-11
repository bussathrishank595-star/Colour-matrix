const Product = require('../models/Product');
const Category = require('../models/Category');
const cloudinary = require('../config/cloudinary');

// ── GET ALL PRODUCTS ────────────────────────────────────
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    // Category filter
    if (req.query.category) {
      const cat = await Category.findOne({ slug: req.query.category });
      if (cat) query.category = cat._id;
    }

    // Price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Rating filter
    if (req.query.rating) {
      query.rating = { $gte: Number(req.query.rating) };
    }

    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Featured filter
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }

    // Sort
    let sortOption = { createdAt: -1 };
    if (req.query.sort === 'price_asc') sortOption = { price: 1 };
    else if (req.query.sort === 'price_desc') sortOption = { price: -1 };
    else if (req.query.sort === 'rating') sortOption = { rating: -1 };
    else if (req.query.sort === 'popular') sortOption = { soldCount: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET SINGLE PRODUCT ──────────────────────────────────
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isActive: true })
      .populate('category', 'name slug')
      .populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Related products
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(6)
      .select('name price images rating numReviews discountedPrice');

    res.status(200).json({ success: true, product, relatedProducts: related });
  } catch (error) {
    next(error);
  }
};

// ── CREATE PRODUCT (ADMIN) ──────────────────────────────
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, discountedPrice, category, stockQuantity, brand, tags, isFeatured, colorVariants, specifications, imageUrl } = req.body;

    let images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: 'smartpaint/products' })
      );
      const results = await Promise.all(uploadPromises);
      images = results.map((r) => ({ public_id: r.public_id, url: r.secure_url }));
    } else if (imageUrl) {
      // Admin pasted a direct image URL — store it without Cloudinary
      images = [{ public_id: '', url: imageUrl }];
    }

    const product = await Product.create({
      name,
      description,
      price,
      discountedPrice,
      category,
      stockQuantity,
      brand,
      tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
      isFeatured,
      colorVariants: colorVariants ? (typeof colorVariants === 'string' ? JSON.parse(colorVariants) : colorVariants) : [],
      specifications: specifications ? (typeof specifications === 'string' ? JSON.parse(specifications) : specifications) : [],
      images,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) {
    next(error);
  }
};

// ── UPDATE PRODUCT (ADMIN) ──────────────────────────────
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const updates = { ...req.body };
    if (updates.tags && typeof updates.tags === 'string') updates.tags = JSON.parse(updates.tags);
    if (updates.colorVariants && typeof updates.colorVariants === 'string') updates.colorVariants = JSON.parse(updates.colorVariants);
    if (updates.specifications && typeof updates.specifications === 'string') updates.specifications = JSON.parse(updates.specifications);

    // Remove imageUrl from updates object — handle separately
    const imageUrl = updates.imageUrl;
    delete updates.imageUrl;

    if (req.files && req.files.length > 0) {
      // Upload new files to Cloudinary
      await Promise.all(product.images.map((img) => img.public_id && cloudinary.uploader.destroy(img.public_id)));
      const results = await Promise.all(
        req.files.map((f) => cloudinary.uploader.upload(f.path, { folder: 'smartpaint/products' }))
      );
      updates.images = results.map((r) => ({ public_id: r.public_id, url: r.secure_url }));
    } else if (imageUrl) {
      // Admin updated via URL
      updates.images = [{ public_id: '', url: imageUrl }];
    }

    product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Product updated', product });
  } catch (error) {
    next(error);
  }
};

// ── DELETE PRODUCT (ADMIN) ──────────────────────────────
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    await Promise.all(product.images.map((img) => img.public_id && cloudinary.uploader.destroy(img.public_id)));
    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// ── PRODUCT REVIEW ───────────────────────────────────────
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
    product.calcAverageRating();
    await product.save();

    res.status(201).json({ success: true, message: 'Review added', rating: product.rating, numReviews: product.numReviews });
  } catch (error) {
    next(error);
  }
};

// ── CATEGORIES ────────────────────────────────────────────
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    let image = {};
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'smartpaint/categories' });
      image = { public_id: result.public_id, url: result.secure_url };
    }
    const category = await Category.create({ ...req.body, image });
    res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    if (category.image?.public_id) await cloudinary.uploader.destroy(category.image.public_id);
    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};
