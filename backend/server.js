require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Import Routes ──────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

// ── Connect to Database ────────────────────────────────
connectDB();

const app = express();

// ── Security Headers ───────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Handled separately if needed
  })
);

// ── CORS ───────────────────────────────────────────────
app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Global Rate Limiter ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, message: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// ── Body Parsers ───────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Logger ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏪 Smart Paint & Hardware Store API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
