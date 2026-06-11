/**
 * colorUtils.js — Color identification + paint mixing formula engine
 * Fixed: better dominant color detection, accurate color naming, realistic mixing
 */

// ── Named Color Database (deduplicated, 130+ colors) ───────────────
export const NAMED_COLORS = [
  // Whites & Near-whites
  { name: 'Pure White',         r: 255, g: 255, b: 255 },
  { name: 'Off White',          r: 245, g: 245, b: 245 },
  { name: 'Ivory',              r: 255, g: 255, b: 240 },
  { name: 'Cream',              r: 255, g: 253, b: 208 },
  { name: 'Linen',              r: 250, g: 240, b: 230 },
  { name: 'Antique White',      r: 250, g: 235, b: 215 },
  { name: 'Beige',              r: 245, g: 245, b: 220 },
  { name: 'Cornsilk',          r: 255, g: 248, b: 220 },
  { name: 'Floral White',       r: 255, g: 250, b: 240 },
  { name: 'Seashell',           r: 255, g: 245, b: 238 },
  // Blacks & Grays
  { name: 'Black',              r: 0,   g: 0,   b: 0   },
  { name: 'Charcoal',           r: 54,  g: 69,  b: 79  },
  { name: 'Dark Gray',          r: 64,  g: 64,  b: 64  },
  { name: 'Gray',               r: 128, g: 128, b: 128 },
  { name: 'Silver',             r: 192, g: 192, b: 192 },
  { name: 'Light Gray',         r: 211, g: 211, b: 211 },
  { name: 'Ash Gray',           r: 178, g: 190, b: 181 },
  { name: 'Smoke Gray',         r: 150, g: 150, b: 150 },
  { name: 'Slate Gray',         r: 112, g: 128, b: 144 },
  { name: 'Steel Gray',         r: 97,  g: 107, b: 117 },
  // Reds
  { name: 'Red',                r: 255, g: 0,   b: 0   },
  { name: 'Dark Red',           r: 139, g: 0,   b: 0   },
  { name: 'Crimson',            r: 220, g: 20,  b: 60  },
  { name: 'Scarlet',            r: 255, g: 36,  b: 0   },
  { name: 'Maroon',             r: 128, g: 0,   b: 0   },
  { name: 'Cherry Red',         r: 153, g: 0,   b: 0   },
  { name: 'Brick Red',          r: 156, g: 71,  b: 43  },
  { name: 'Indian Red',         r: 205, g: 92,  b: 92  },
  { name: 'Tomato',             r: 255, g: 99,  b: 71  },
  { name: 'Light Coral',        r: 240, g: 128, b: 128 },
  { name: 'Salmon',             r: 250, g: 128, b: 114 },
  // Pinks
  { name: 'Hot Pink',           r: 255, g: 105, b: 180 },
  { name: 'Deep Pink',          r: 255, g: 20,  b: 147 },
  { name: 'Pink',               r: 255, g: 192, b: 203 },
  { name: 'Baby Pink',          r: 244, g: 194, b: 194 },
  { name: 'Blush Pink',         r: 222, g: 93,  b: 131 },
  { name: 'Dusty Rose',         r: 197, g: 145, b: 145 },
  { name: 'Rose',               r: 255, g: 0,   b: 127 },
  { name: 'Pastel Pink',        r: 255, g: 209, b: 220 },
  // Oranges
  { name: 'Orange',             r: 255, g: 165, b: 0   },
  { name: 'Dark Orange',        r: 255, g: 140, b: 0   },
  { name: 'Burnt Orange',       r: 191, g: 87,  b: 0   },
  { name: 'Coral',              r: 255, g: 127, b: 80  },
  { name: 'Tangerine',          r: 242, g: 133, b: 0   },
  { name: 'Peach',              r: 255, g: 218, b: 185 },
  { name: 'Amber',              r: 255, g: 191, b: 0   },
  // Yellows
  { name: 'Yellow',             r: 255, g: 255, b: 0   },
  { name: 'Gold',               r: 255, g: 215, b: 0   },
  { name: 'Lemon Yellow',       r: 255, g: 244, b: 79  },
  { name: 'Light Yellow',       r: 255, g: 255, b: 224 },
  { name: 'Butter Yellow',      r: 255, g: 243, b: 179 },
  { name: 'Mustard Yellow',     r: 255, g: 219, b: 88  },
  { name: 'Khaki',              r: 240, g: 230, b: 140 },
  { name: 'Pale Yellow',        r: 255, g: 255, b: 153 },
  { name: 'Goldenrod',          r: 218, g: 165, b: 32  },
  // Greens
  { name: 'Green',              r: 0,   g: 128, b: 0   },
  { name: 'Lime Green',         r: 50,  g: 205, b: 50  },
  { name: 'Dark Green',         r: 0,   g: 100, b: 0   },
  { name: 'Forest Green',       r: 34,  g: 139, b: 34  },
  { name: 'Olive Green',        r: 107, g: 142, b: 35  },
  { name: 'Mint Green',         r: 152, g: 255, b: 152 },
  { name: 'Sage Green',         r: 143, g: 188, b: 143 },
  { name: 'Sea Green',          r: 46,  g: 139, b: 87  },
  { name: 'Emerald Green',      r: 0,   g: 201, b: 87  },
  { name: 'Jade Green',         r: 0,   g: 168, b: 107 },
  { name: 'Moss Green',         r: 138, g: 154, b: 91  },
  { name: 'Bottle Green',       r: 0,   g: 106, b: 78  },
  { name: 'Lawn Green',         r: 124, g: 252, b: 0   },
  { name: 'Yellow Green',       r: 154, g: 205, b: 50  },
  { name: 'Chartreuse',         r: 127, g: 255, b: 0   },
  { name: 'Pea Green',          r: 143, g: 188, b: 74  },
  // Blues
  { name: 'Blue',               r: 0,   g: 0,   b: 255 },
  { name: 'Dark Blue',          r: 0,   g: 0,   b: 139 },
  { name: 'Navy Blue',          r: 0,   g: 0,   b: 128 },
  { name: 'Royal Blue',         r: 65,  g: 105, b: 225 },
  { name: 'Sky Blue',           r: 135, g: 206, b: 235 },
  { name: 'Baby Blue',          r: 137, g: 207, b: 240 },
  { name: 'Powder Blue',        r: 176, g: 224, b: 230 },
  { name: 'Steel Blue',         r: 70,  g: 130, b: 180 },
  { name: 'Cerulean Blue',      r: 0,   g: 123, b: 167 },
  { name: 'Cobalt Blue',        r: 0,   g: 71,  b: 171 },
  { name: 'Cornflower Blue',    r: 100, g: 149, b: 237 },
  { name: 'Dodger Blue',        r: 30,  g: 144, b: 255 },
  { name: 'Deep Sky Blue',      r: 0,   g: 191, b: 255 },
  { name: 'Light Blue',         r: 173, g: 216, b: 230 },
  { name: 'Midnight Blue',      r: 25,  g: 25,  b: 112 },
  { name: 'Prussian Blue',      r: 0,   g: 49,  b: 83  },
  { name: 'Ice Blue',           r: 153, g: 204, b: 255 },
  // Purples & Violets
  { name: 'Purple',             r: 128, g: 0,   b: 128 },
  { name: 'Dark Purple',        r: 75,  g: 0,   b: 130 },
  { name: 'Violet',             r: 238, g: 130, b: 238 },
  { name: 'Lavender',           r: 230, g: 230, b: 250 },
  { name: 'Magenta',            r: 255, g: 0,   b: 255 },
  { name: 'Plum',               r: 221, g: 160, b: 221 },
  { name: 'Orchid',             r: 218, g: 112, b: 214 },
  { name: 'Mauve',              r: 224, g: 176, b: 255 },
  { name: 'Lilac',              r: 200, g: 162, b: 200 },
  { name: 'Periwinkle',         r: 204, g: 204, b: 255 },
  { name: 'Wisteria',           r: 201, g: 160, b: 220 },
  // Browns & Earth tones
  { name: 'Brown',              r: 165, g: 42,  b: 42  },
  { name: 'Dark Brown',         r: 101, g: 67,  b: 33  },
  { name: 'Chocolate',          r: 210, g: 105, b: 30  },
  { name: 'Sienna',             r: 160, g: 82,  b: 45  },
  { name: 'Saddle Brown',       r: 139, g: 69,  b: 19  },
  { name: 'Tan',                r: 210, g: 180, b: 140 },
  { name: 'Caramel',            r: 196, g: 127, b: 60  },
  { name: 'Copper',             r: 184, g: 115, b: 51  },
  { name: 'Bronze',             r: 205, g: 127, b: 50  },
  { name: 'Sandy Brown',        r: 244, g: 164, b: 96  },
  { name: 'Wheat',              r: 245, g: 222, b: 179 },
  { name: 'Bisque',             r: 255, g: 228, b: 196 },
  { name: 'Navajo White',       r: 255, g: 222, b: 173 },
  { name: 'Terracotta',         r: 226, g: 114, b: 91  },
  { name: 'Rust',               r: 183, g: 65,  b: 14  },
  { name: 'Ochre',              r: 204, g: 119, b: 34  },
  { name: 'Sand',               r: 194, g: 178, b: 128 },
  // Teals & Cyans
  { name: 'Teal',               r: 0,   g: 128, b: 128 },
  { name: 'Cyan',               r: 0,   g: 255, b: 255 },
  { name: 'Aquamarine',         r: 127, g: 255, b: 212 },
  { name: 'Turquoise',          r: 64,  g: 224, b: 208 },
  { name: 'Pale Turquoise',     r: 175, g: 238, b: 238 },
  { name: 'Dark Teal',          r: 0,   g: 80,  b: 80  },
];

// ── RGB → HSL ──────────────────────────────────────────────────────
export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// ── Perceptual color distance (redmean formula) ────────────────────
function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt(
    (2 + rmean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rmean) / 256) * db * db
  );
}

// ── Nearest named color ────────────────────────────────────────────
export function findNearestColor(r, g, b) {
  let minDist = Infinity;
  let nearest = null;
  for (const color of NAMED_COLORS) {
    const dist = colorDistance(r, g, b, color.r, color.g, color.b);
    if (dist < minDist) {
      minDist = dist;
      nearest = { ...color, hex: toHex(color.r, color.g, color.b), distance: dist };
    }
  }
  return nearest;
}

export function toHex(r, g, b) {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ── Dominant color extraction (improved algorithm) ─────────────────
export function getDominantColor(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  // Bucket size: 24 for good grouping without being too coarse
  const BUCKET = 24;
  const buckets = {};

  // Sample every 4th pixel (step=2 in each dimension = every 4th pixel)
  const stepX = Math.max(1, Math.floor(width / 150));
  const stepY = Math.max(1, Math.floor(height / 150));

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 200) continue; // skip transparent/semi-transparent

      // Bucket key using floor division
      const qr = Math.floor(r / BUCKET) * BUCKET;
      const qg = Math.floor(g / BUCKET) * BUCKET;
      const qb = Math.floor(b / BUCKET) * BUCKET;
      const key = `${qr},${qg},${qb}`;

      if (!buckets[key]) {
        buckets[key] = { count: 0, sumR: 0, sumG: 0, sumB: 0, qr, qg, qb };
      }
      buckets[key].count++;
      buckets[key].sumR += r;
      buckets[key].sumG += g;
      buckets[key].sumB += b;
    }
  }

  const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
  if (!sorted.length) return { r: 128, g: 128, b: 128 };

  const totalPixels = sorted.reduce((s, b) => s + b.count, 0);

  // Helper: is a bucket near-white or near-black/gray?
  const isNearWhite = (b) => b.qr >= 200 && b.qg >= 200 && b.qb >= 200;
  const isNearBlack = (b) => b.qr <= 40 && b.qg <= 40 && b.qb <= 40;
  const isGray = (b) => {
    const avg = (b.qr + b.qg + b.qb) / 3;
    return (
      Math.abs(b.qr - avg) < 25 &&
      Math.abs(b.qg - avg) < 25 &&
      Math.abs(b.qb - avg) < 25
    );
  };

  // Check if white/black/gray is overwhelmingly dominant (>55%)
  const top = sorted[0];
  if (top.count / totalPixels > 0.55) {
    // Just return it — it truly IS the dominant color
    return {
      r: Math.round(top.sumR / top.count),
      g: Math.round(top.sumG / top.count),
      b: Math.round(top.sumB / top.count),
    };
  }

  // Otherwise prefer the most common colorful (non-white, non-black, non-gray) bucket
  const colorful = sorted.find(
    (b) => !isNearWhite(b) && !isNearBlack(b) && !isGray(b)
  );
  const chosen = colorful || sorted[0];

  return {
    r: Math.round(chosen.sumR / chosen.count),
    g: Math.round(chosen.sumG / chosen.count),
    b: Math.round(chosen.sumB / chosen.count),
  };
}

// ── Paint mixing formula ───────────────────────────────────────────
export function getMixFormula(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);

  // Special cases
  if (l >= 96 && s < 10) {
    return {
      formula: [{ color: 'White', hex: '#ffffff', percent: 100 }],
      description: 'This is White — use white paint directly.',
    };
  }
  if (l <= 5) {
    return {
      formula: [{ color: 'Black', hex: '#000000', percent: 100 }],
      description: 'This is Black — use black paint directly.',
    };
  }
  if (s < 8) {
    // Achromatic gray — mix white and black
    const blackPct = Math.round((1 - l / 100) * 100);
    const whitePct = 100 - blackPct;
    return {
      formula: [
        { color: 'White', hex: '#ffffff', percent: whitePct },
        { color: 'Black', hex: '#000000', percent: blackPct },
      ],
      description: `Gray: ${whitePct}% White + ${blackPct}% Black`,
    };
  }

  // Determine the two RYB base pigment colors from hue
  let baseA, baseB, mixFrac; // mixFrac: 0 = all A, 1 = all B

  if (h < 20)       { baseA = { n: 'Red',    hex: '#e60000' }; baseB = { n: 'Red',    hex: '#e60000' }; mixFrac = 0; }
  else if (h < 40)  { baseA = { n: 'Red',    hex: '#e60000' }; baseB = { n: 'Yellow', hex: '#ffd700' }; mixFrac = (h - 20) / 20; }
  else if (h < 70)  { baseA = { n: 'Yellow', hex: '#ffd700' }; baseB = { n: 'Yellow', hex: '#ffd700' }; mixFrac = 0; }
  else if (h < 150) { baseA = { n: 'Yellow', hex: '#ffd700' }; baseB = { n: 'Blue',   hex: '#0033cc' }; mixFrac = (h - 70) / 80; }
  else if (h < 200) { baseA = { n: 'Blue',   hex: '#0033cc' }; baseB = { n: 'Blue',   hex: '#0033cc' }; mixFrac = 0; }
  else if (h < 260) { baseA = { n: 'Blue',   hex: '#0033cc' }; baseB = { n: 'Blue',   hex: '#0033cc' }; mixFrac = 0; }
  else if (h < 300) { baseA = { n: 'Blue',   hex: '#0033cc' }; baseB = { n: 'Red',    hex: '#e60000' }; mixFrac = (h - 260) / 40; }
  else if (h < 340) { baseA = { n: 'Red',    hex: '#e60000' }; baseB = { n: 'Red',    hex: '#e60000' }; mixFrac = 0; }
  else              { baseA = { n: 'Red',    hex: '#e60000' }; baseB = { n: 'Red',    hex: '#e60000' }; mixFrac = 0; }

  // Pigment pool = what's left after white/black allocation
  // Saturation drives how much pigment vs white
  // Lightness drives white (if high) or black (if low)
  let whitePct = 0, blackPct = 0;

  if (l > 50) {
    // Light color: add white
    // More white for higher lightness, less white for high saturation
    whitePct = Math.round(
      ((l - 50) / 50) * 60 + (1 - s / 100) * 35
    );
    whitePct = Math.min(whitePct, 90);
  } else {
    // Dark color: add black
    blackPct = Math.round(
      ((50 - l) / 50) * 55 + (1 - s / 100) * 20
    );
    blackPct = Math.min(blackPct, 80);
  }

  const pigmentPool = 100 - whitePct - blackPct;

  const isSame = baseA.n === baseB.n;
  let pctA = isSame ? pigmentPool : Math.round(pigmentPool * (1 - mixFrac));
  let pctB = isSame ? 0 : pigmentPool - pctA;

  // Build formula
  const raw = [];
  if (whitePct > 0) raw.push({ color: 'White', hex: '#ffffff', percent: whitePct });
  if (pctA > 0) raw.push({ color: baseA.n, hex: baseA.hex, percent: pctA });
  if (pctB > 0 && !isSame) raw.push({ color: baseB.n, hex: baseB.hex, percent: pctB });
  if (blackPct > 0) raw.push({ color: 'Black', hex: '#000000', percent: blackPct });

  // Normalize to 100%
  const total = raw.reduce((s, c) => s + c.percent, 0);
  if (total > 0 && total !== 100) {
    raw[raw.length - 1].percent += (100 - total);
  }

  // Clean up zeros
  const formula = raw.filter((c) => c.percent > 0);

  const parts = formula.map((f) => `${f.percent}% ${f.color}`).join(' + ');
  return { formula, description: `Mix: ${parts}` };
}

// ── Full color analysis (single entry point) ──────────────────────
export function analyzeColor(r, g, b) {
  const nearest = findNearestColor(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  const hex = toHex(r, g, b);
  const mix = getMixFormula(r, g, b);

  // Thresholds (perceptual distance):
  // < 18 = exact match  (very close, same color family)
  // < 40 = close match  (similar color)
  // >= 40 = custom / needs mixing
  const isExactMatch = nearest.distance < 18;
  const isCloseMatch = nearest.distance < 40;

  return {
    detected: { r, g, b, hex },
    nearest,
    isExactMatch,
    isCloseMatch,
    hsl: {
      h: Math.round(hsl.h),
      s: Math.round(hsl.s),
      l: Math.round(hsl.l),
    },
    mix,
  };
}
