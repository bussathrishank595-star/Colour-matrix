/**
 * Seed Script — Smart Paint & Hardware Store
 * Run: node utils/seed.js
 * Creates the admin account + sample categories + sample products
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const adminUser = {
  name: 'Bachu Rajesh',
  email: 'bachu@gmail.com',
  password: 'Bachu@1324',
  role: 'admin',
  isEmailVerified: true,
  phone: '9876543210',
};

const categories = [
  { name: 'Paints', description: 'Interior, exterior and specialty paints', slug: 'paints' },
  { name: 'Wall Putty', description: 'White cement based wall putty for smooth finish', slug: 'wall-putty' },
  { name: 'Brushes', description: 'Professional grade paint brushes', slug: 'brushes' },
  { name: 'Rollers', description: 'Paint rollers for large surface coverage', slug: 'rollers' },
  { name: 'Hardware Tools', description: 'Power and hand tools for construction', slug: 'hardware-tools' },
  { name: 'Plumbing Items', description: 'Pipes, fittings and plumbing fixtures', slug: 'plumbing-items' },
  { name: 'Electrical Items', description: 'Wires, switches, panels and electrical accessories', slug: 'electrical-items' },
  { name: 'Cement Products', description: 'OPC, PPC and specialty cement', slug: 'cement-products' },
  { name: 'Construction Accessories', description: 'Rebar, formwork and construction accessories', slug: 'construction-accessories' },
];

const getProducts = (cats) => {
  const catMap = {};
  cats.forEach(c => { catMap[c.slug] = c._id; });

  return [
    // Paints
    {
      name: 'Asian Paints Apcolite Premium Emulsion',
      description: 'High quality interior emulsion paint with excellent coverage and washability. Ideal for bedrooms, living rooms and hallways. Provides a smooth, silky finish with a subtle sheen.',
      price: 1299,
      discountedPrice: 1099,
      category: catMap['paints'],
      stockQuantity: 50,
      brand: 'Asian Paints',
      isFeatured: true,
      tags: ['interior', 'emulsion', 'premium'],
      rating: 4.5,
      numReviews: 128,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/e94560/ffffff?text=Asian+Paints+Emulsion' }],
    },
    {
      name: 'Berger Weathercoat Exterior Paint',
      description: 'All-season exterior weather protection paint. Resists rain, UV rays and fungal growth. Perfect for exterior walls, facades and compound walls.',
      price: 1850,
      discountedPrice: 1650,
      category: catMap['paints'],
      stockQuantity: 35,
      brand: 'Berger',
      isFeatured: true,
      tags: ['exterior', 'weathercoat', 'waterproof'],
      rating: 4.7,
      numReviews: 89,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/2980b9/ffffff?text=Berger+Exterior' }],
    },
    {
      name: 'Dulux Velvet Touch Interior Luxury Emulsion',
      description: 'Ultra-smooth luxury finish interior paint. Stain-resistant and easy to clean. Available in 1500+ shades. Provides a velvety matte finish.',
      price: 2100,
      category: catMap['paints'],
      stockQuantity: 28,
      brand: 'Dulux',
      isFeatured: true,
      tags: ['luxury', 'interior', 'stain-resistant'],
      rating: 4.8,
      numReviews: 204,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/8e44ad/ffffff?text=Dulux+Velvet' }],
    },
    {
      name: 'Nerolac Economy Interior Paint (White) 20L',
      description: 'Economical interior wall paint for large projects. Good hiding power and easy application. Suitable for all interior surfaces.',
      price: 2850,
      discountedPrice: 2499,
      category: catMap['paints'],
      stockQuantity: 42,
      brand: 'Nerolac',
      isFeatured: false,
      tags: ['economy', 'interior', 'white', '20L'],
      rating: 4.2,
      numReviews: 67,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/27ae60/ffffff?text=Nerolac+Economy' }],
    },

    // Wall Putty
    {
      name: 'JK Wall Putty White Cement Based 40kg',
      description: 'Premium white cement-based wall putty. Provides excellent bonding and a smooth base for paints. Reduces paint consumption significantly. Suitable for interior and exterior use.',
      price: 620,
      discountedPrice: 549,
      category: catMap['wall-putty'],
      stockQuantity: 80,
      brand: 'JK',
      isFeatured: true,
      tags: ['putty', 'white cement', '40kg', 'base coat'],
      rating: 4.4,
      numReviews: 156,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/ecf0f1/1a1a2e?text=JK+Wall+Putty' }],
    },
    {
      name: 'Birla White Wallcare Putty 20kg',
      description: 'High quality wall care putty for a perfectly smooth finish before painting. Excellent adhesion and easy workability. Water resistant formula.',
      price: 380,
      category: catMap['wall-putty'],
      stockQuantity: 60,
      brand: 'Birla',
      isFeatured: false,
      tags: ['putty', '20kg', 'birla white'],
      rating: 4.3,
      numReviews: 94,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/bdc3c7/1a1a2e?text=Birla+Putty' }],
    },

    // Brushes
    {
      name: 'Asian Paints TrueBlue Premium Brush Set (Pack of 3)',
      description: 'Professional grade flat paint brushes with natural bristles. Ideal for oil-based and water-based paints. Ergonomic wooden handle for comfort. Includes 1", 2" and 3" brushes.',
      price: 450,
      discountedPrice: 399,
      category: catMap['brushes'],
      stockQuantity: 100,
      brand: 'Asian Paints TrueBlue',
      isFeatured: true,
      tags: ['brush', 'set', 'professional', 'flat brush'],
      rating: 4.6,
      numReviews: 312,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/e67e22/ffffff?text=TrueBlue+Brush+Set' }],
    },
    {
      name: 'Professional Wall Painting Brush 4 inch',
      description: 'Heavy duty 4-inch flat brush for wall painting. Nylon-polyester blend bristles for smooth finish. Suitable for emulsion, distemper and enamels.',
      price: 180,
      category: catMap['brushes'],
      stockQuantity: 200,
      brand: 'Purdy',
      isFeatured: false,
      tags: ['brush', '4 inch', 'wall painting'],
      rating: 4.1,
      numReviews: 78,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/d35400/ffffff?text=4+inch+Brush' }],
    },

    // Rollers
    {
      name: '9-inch Paint Roller Set with Extension Pole',
      description: 'Complete roller kit for large surface painting. Includes 9-inch roller frame, 3 roller covers (short nap, medium nap, long nap) and 4-foot extension pole. Ideal for walls, ceilings and floors.',
      price: 750,
      discountedPrice: 649,
      category: catMap['rollers'],
      stockQuantity: 65,
      brand: 'Anza',
      isFeatured: true,
      tags: ['roller', 'set', 'extension pole', '9 inch'],
      rating: 4.5,
      numReviews: 187,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/16a085/ffffff?text=Roller+Set' }],
    },

    // Hardware Tools
    {
      name: 'Bosch Professional GSB 500W Impact Drill',
      description: 'Compact and powerful 500W impact drill for drilling into wood, metal and masonry. Variable speed control and reverse function. Includes 13mm keyless chuck and carry case.',
      price: 3499,
      discountedPrice: 2999,
      category: catMap['hardware-tools'],
      stockQuantity: 20,
      brand: 'Bosch',
      isFeatured: true,
      tags: ['drill', 'bosch', '500W', 'impact drill'],
      rating: 4.8,
      numReviews: 523,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/2c3e50/e94560?text=Bosch+Drill' }],
    },
    {
      name: 'Stanley Tape Measure 8m with Belt Clip',
      description: 'Heavy duty 8-meter tape measure with ABS case, double-sided nylon coated blade and magnetic hook. Belt clip included for easy carry.',
      price: 320,
      discountedPrice: 275,
      category: catMap['hardware-tools'],
      stockQuantity: 150,
      brand: 'Stanley',
      isFeatured: false,
      tags: ['tape measure', 'stanley', '8m'],
      rating: 4.6,
      numReviews: 234,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/f39c12/1a1a2e?text=Stanley+Tape' }],
    },

    // Plumbing
    {
      name: 'Supreme CPVC Pipes 3/4 inch x 3m (Pack of 5)',
      description: 'High quality CPVC pipes for hot and cold water systems. Corrosion resistant and long lasting. Easy installation with solvent cement. Suitable for residential and commercial plumbing.',
      price: 1250,
      discountedPrice: 1099,
      category: catMap['plumbing-items'],
      stockQuantity: 40,
      brand: 'Supreme',
      isFeatured: false,
      tags: ['cpvc', 'pipes', 'plumbing', 'hot water'],
      rating: 4.4,
      numReviews: 91,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/1abc9c/ffffff?text=CPVC+Pipes' }],
    },

    // Electrical
    {
      name: 'Havells 2.5 sq mm Copper Wire 90m Roll',
      description: 'FR grade 2.5mm² flexible copper conductor wire for home wiring. Fire retardant PVC insulation. ISI marked and FRLS certified. Suitable for all electrical circuits.',
      price: 1850,
      discountedPrice: 1699,
      category: catMap['electrical-items'],
      stockQuantity: 55,
      brand: 'Havells',
      isFeatured: true,
      tags: ['wire', 'copper', 'havells', '2.5mm', 'FR'],
      rating: 4.7,
      numReviews: 342,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/e74c3c/ffffff?text=Havells+Wire' }],
    },

    // Cement
    {
      name: 'UltraTech Cement OPC 43 Grade (50kg)',
      description: 'Premium Ordinary Portland Cement 43 Grade for general construction. Ideal for foundations, columns, slabs and plastering. High strength and durability.',
      price: 420,
      discountedPrice: 389,
      category: catMap['cement-products'],
      stockQuantity: 200,
      brand: 'UltraTech',
      isFeatured: true,
      tags: ['cement', 'opc43', 'ultratech', '50kg'],
      rating: 4.5,
      numReviews: 189,
      images: [{ public_id: 'demo', url: 'https://placehold.co/600x600/7f8c8d/ffffff?text=UltraTech+Cement' }],
    },
  ];
};

async function seed() {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // ── ADMIN USER ────────────────────────────────────────────
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${adminUser.email}`);
    } else {
      const admin = await User.create(adminUser);
      console.log(`✅ Admin user created: ${admin.name} (${admin.email})`);
    }

    // ── CATEGORIES ────────────────────────────────────────────
    console.log('\n📂 Seeding categories...');
    const createdCategories = [];
    for (const cat of categories) {
      const existing = await Category.findOne({ slug: cat.slug });
      if (existing) {
        console.log(`   ⚠️  Category exists: ${cat.name}`);
        createdCategories.push(existing);
      } else {
        const created = await Category.create(cat);
        console.log(`   ✅ Created: ${cat.name}`);
        createdCategories.push(created);
      }
    }

    // ── PRODUCTS ──────────────────────────────────────────────
    console.log('\n📦 Seeding products...');
    const products = getProducts(createdCategories);
    let created = 0, skipped = 0;
    for (const product of products) {
      const existing = await Product.findOne({ name: product.name });
      if (existing) {
        skipped++;
      } else {
        await Product.create(product);
        console.log(`   ✅ ${product.name}`);
        created++;
      }
    }
    if (skipped > 0) console.log(`   ⚠️  ${skipped} products already existed, skipped.`);

    console.log(`\n✅ Seed complete!`);
    console.log(`   📦 ${created} products created`);
    console.log(`   📂 ${categories.length} categories processed`);
    console.log('\n🔑 Admin Login Credentials:');
    console.log(`   Email   : ${adminUser.email}`);
    console.log(`   Password: ${adminUser.password}`);
    console.log(`   Role    : Admin (Shopkeeper)\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
