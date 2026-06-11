const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Gemini client ─────────────────────────────────────────────────
let genAI = null;
function getGenAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured in .env');
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

// Model fallback chain — tries each in order if the previous gets 503/overloaded
const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
];

/** Try generateContent across the model chain; returns { result, modelUsed } */
async function generateWithFallback(ai, parts) {
  let lastErr;
  for (const modelName of MODEL_CHAIN) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(parts);
        return { result, modelUsed: modelName };
      } catch (err) {
        lastErr = err;
        const is503 = err.message?.includes('503') || err.message?.includes('high demand') || err.message?.includes('overloaded');
        if (is503) {
          // wait 1.5s then try next model / attempt
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        // Non-503 error on this model — skip to next model immediately
        break;
      }
    }
  }
  throw lastErr;
}

// ── Master prompt — ML measurements + step-by-step mixing order ───
const SYSTEM_PROMPT = `You are a senior paint chemist at a professional paint shop with 20+ years of experience.

The user has uploaded a COLOR SWATCH or COLOR SAMPLE PHOTO.

Your job:
1. Identify the EXACT dominant color from the photo
2. Determine if it is a standard named paint color OR a custom mixed color
3. If mixing is needed, give a PRECISE formula with EXACT ML amounts for a 1 LITER (1000ml) batch
4. Give step-by-step mixing instructions — which color to add FIRST, SECOND, THIRD, etc.

IMPORTANT RULES:
- Base paint colors you can use: White, Red, Blue, Yellow, Black, Green, Orange, Brown, Violet
- All ml values must add up to exactly 1000ml
- All percent values must add up to exactly 100
- Mixing steps must be ordered correctly for best result (usually: base/white first, main pigment second, dark pigment last)
- Be very specific in each step (e.g. "Stir for 2 minutes after each addition")
- If the color IS a standard paint (Pure White, Black, Navy Blue, etc.), set availableDirectly to true and mixingFormula to []

Respond ONLY with valid raw JSON — no markdown fences, no extra text:

{
  "colorName": "The exact paint color name",
  "hexCode": "#rrggbb",
  "rgb": { "r": 0, "g": 0, "b": 0 },
  "isStandardColor": false,
  "availableDirectly": false,
  "confidence": "high",
  "description": "Brief 1-2 sentence description of the color's character and mood",
  "paintCategory": "Interior Wall",
  "totalVolume": "1000ml (1 Liter)",
  "mixingFormula": [
    { "color": "White",  "hex": "#ffffff", "percent": 65, "ml": 650 },
    { "color": "Blue",   "hex": "#0033cc", "percent": 25, "ml": 250 },
    { "color": "Black",  "hex": "#111111", "percent": 10, "ml": 100 }
  ],
  "mixingSteps": [
    {
      "step": 1,
      "colorUsed": "White",
      "hex": "#ffffff",
      "ml": 650,
      "instruction": "Pour 650ml of White paint into a clean mixing container. This is your BASE — always start with the lightest color."
    },
    {
      "step": 2,
      "colorUsed": "Blue",
      "hex": "#0033cc",
      "ml": 250,
      "instruction": "Slowly add 250ml of Blue paint into the white base. Stir continuously in circular motion for 2 minutes until evenly blended."
    },
    {
      "step": 3,
      "colorUsed": "Black",
      "hex": "#111111",
      "ml": 100,
      "instruction": "Add 100ml of Black paint DROP BY DROP — do not pour all at once. Black is very powerful; stir thoroughly after each small addition. Mix for 3 minutes."
    },
    {
      "step": 4,
      "colorUsed": null,
      "hex": null,
      "ml": null,
      "instruction": "Final check: Apply a small test patch on paper and let it dry for 10 minutes. Dried color will appear slightly darker. Adjust if needed."
    }
  ],
  "proTips": [
    "Always mix more than you need — matching the exact shade later is very difficult",
    "Use a clean wooden stick or paint mixer — never a dirty tool",
    "Test the color on the actual surface before full application — some surfaces change how color appears"
  ],
  "mixingTip": "One key insight for achieving this specific color perfectly"
}

IMPORTANT: mixingSteps must be in the CORRECT ORDER for best mixing result. The last step should always be a 'final check/test patch' step with colorUsed: null.`;

/**
 * POST /api/ai/analyze-color
 * Body: { image: "data:image/jpeg;base64,..." }
 */
exports.analyzeColorWithAI = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image provided.',
      });
    }

    // Parse the data URL
    const matches = image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Expected data URL (data:image/...;base64,...)',
      });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    // Size guard
    const sizeBytes = (base64Data.length * 3) / 4;
    if (sizeBytes > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image too large. Please use an image under 10MB.',
      });
    }

    // Call Gemini — auto-retries with fallback models on 503
    const ai = getGenAI();
    const { result, modelUsed } = await generateWithFallback(ai, [
      SYSTEM_PROMPT,
      { inlineData: { mimeType, data: base64Data } },
    ]);
    console.log(`[AI] Used model: ${modelUsed}`);

    const raw = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the response
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('[AI] Parse error. Raw response:', cleaned.slice(0, 300));
      return res.status(500).json({
        success: false,
        message: 'AI returned an unexpected format. Please try again.',
      });
    }

    // Sanitize arrays
    if (!Array.isArray(analysis.mixingFormula)) analysis.mixingFormula = [];
    if (!Array.isArray(analysis.mixingSteps))   analysis.mixingSteps   = [];
    if (!Array.isArray(analysis.proTips))        analysis.proTips       = [];

    // Filter zero entries from formula
    analysis.mixingFormula = analysis.mixingFormula.filter((f) => f.percent > 0);

    // Compute ml if missing (from percent)
    analysis.mixingFormula = analysis.mixingFormula.map((f) => ({
      ...f,
      ml: f.ml ?? Math.round((f.percent / 100) * 1000),
    }));

    return res.json({ success: true, analysis });
  } catch (err) {
    console.error('[AI] Error:', err.message);

    if (err.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'AI service not configured. Add GEMINI_API_KEY to backend .env',
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'AI analysis failed. Please try again.',
    });
  }
};
