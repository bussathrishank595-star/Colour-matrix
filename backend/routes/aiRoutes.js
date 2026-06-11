const express = require('express');
const router = express.Router();
const { analyzeColorWithAI } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/ai/analyze-color — Admin only
router.post('/analyze-color', protect, authorize('admin'), analyzeColorWithAI);

module.exports = router;
