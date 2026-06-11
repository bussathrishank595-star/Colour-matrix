import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Sparkles, Palette, FlaskConical, CheckCircle,
  AlertTriangle, RefreshCw, ChevronRight, Zap, Star, Info,
  Beaker, Layers, Lightbulb, ArrowRight, Clock, TestTube
} from 'lucide-react';
import api from '../../lib/axios';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function isLight(hex = '#888') {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

/** Resize + compress image to base64 for API */
async function fileToBase64(file, maxPx = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────
// Pie Chart
// ─────────────────────────────────────────────────────────────────
function PieChart({ formula }) {
  const SIZE = 170, CX = 85, CY = 85, R = 68;
  let angle = -90;

  function polar(deg) {
    const rad = (deg * Math.PI) / 180;
    return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
  }

  const slices = formula.map((f) => {
    const sweep = (f.percent / 100) * 360;
    const end = angle + sweep;
    const s = polar(angle);
    const e = polar(end);
    const mid = polar(angle + sweep / 2);
    const d = `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${sweep > 180 ? 1 : 0} 1 ${e.x} ${e.y} Z`;
    angle = end;
    return { ...f, d, mid };
  });

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.d} fill={s.hex} stroke="#fff" strokeWidth="2.5" />
          {s.percent >= 8 && (
            <text x={s.mid.x} y={s.mid.y}
              textAnchor="middle" dominantBaseline="middle"
              fill={isLight(s.hex) ? '#222' : '#fff'}
              fontSize="10" fontWeight="800">
              {s.percent}%
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Step card
// ─────────────────────────────────────────────────────────────────
function MixingStep({ step, total }) {
  const isFinal = !step.colorUsed;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (step.step - 1) * 0.08 }}
      className={`flex gap-4 p-4 rounded-2xl border ${
        isFinal
          ? 'bg-blue-50 border-blue-200'
          : 'bg-[var(--surface)] border-[var(--border)]'
      }`}
    >
      {/* Step number circle */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${
            isFinal
              ? 'bg-blue-500 text-white'
              : 'text-white'
          }`}
          style={!isFinal && step.hex
            ? { background: step.hex, boxShadow: `0 2px 8px ${step.hex}55` }
            : {}
          }
        >
          {isFinal ? <TestTube size={16} /> : step.step}
        </div>
        {step.step < total && (
          <div className="w-0.5 h-5 bg-[var(--border)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {!isFinal ? (
            <>
              <span className="font-bold text-sm text-[var(--text-primary)]">
                Step {step.step}: Add {step.colorUsed}
              </span>
              {step.ml && (
                <span
                  className="text-xs font-black px-2.5 py-1 rounded-full text-white shadow-sm"
                  style={{ background: step.hex || '#555' }}
                >
                  {step.ml} ml
                </span>
              )}
              {step.step === 1 && (
                <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">
                  BASE — Start Here
                </span>
              )}
              {step.step === total - 1 && !isFinal && (
                <span className="text-[10px] bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-semibold">
                  Add Last
                </span>
              )}
            </>
          ) : (
            <span className="font-bold text-sm text-blue-800">
              Final Step: Test the Colour
            </span>
          )}
        </div>
        <p className={`text-sm leading-relaxed ${isFinal ? 'text-blue-700' : 'text-[var(--text-secondary)]'}`}>
          {step.instruction}
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Confidence badge
// ─────────────────────────────────────────────────────────────────
function ConfidenceBadge({ level }) {
  const map = {
    high:   { cls: 'bg-green-100 text-green-700 border-green-200', icon: <Star size={10} />, label: 'High Confidence' },
    medium: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Info size={10} />, label: 'Medium Confidence' },
    low:    { cls: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle size={10} />, label: 'Low Confidence' },
  };
  const cfg = map[level?.toLowerCase()] || map.medium;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Full Result Panel
// ─────────────────────────────────────────────────────────────────
function AIResultPanel({ result }) {
  const {
    colorName, hexCode, rgb, isStandardColor, confidence,
    description, availableDirectly, mixingFormula, mixingSteps,
    proTips, mixingTip, paintCategory, totalVolume,
  } = result;

  const [activeTab, setActiveTab] = useState('formula'); // 'formula' | 'steps'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-4"
    >
      {/* ── Colour Identity Card ── */}
      <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        {/* Colour bar */}
        <div
          className="h-28 w-full relative flex items-end p-4"
          style={{ background: hexCode || '#888' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="relative z-10">
            <p className="text-2xl font-black leading-tight"
              style={{ color: isLight(hexCode) ? '#111' : '#fff' }}>
              {colorName}
            </p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs font-mono opacity-80"
                style={{ color: isLight(hexCode) ? '#333' : '#ddd' }}>
                {hexCode?.toUpperCase()}
              </span>
              {rgb && (
                <span className="text-xs font-mono opacity-70"
                  style={{ color: isLight(hexCode) ? '#444' : '#ccc' }}>
                  R{rgb.r} G{rgb.g} B{rgb.b}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-4 py-3 bg-[var(--surface)] flex flex-wrap items-center gap-2 border-b border-[var(--border)]">
          <ConfidenceBadge level={confidence} />
          {paintCategory && (
            <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border)]">
              🖌 {paintCategory}
            </span>
          )}
          {totalVolume && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              🧪 {totalVolume}
            </span>
          )}
        </div>

        {description && (
          <div className="px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
          </div>
        )}
      </div>

      {/* ── Status banner ── */}
      {availableDirectly ? (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-800">Available Directly — No Mixing Needed!</p>
            <p className="text-sm text-green-700 mt-0.5">
              <strong>{colorName}</strong> is a standard paint colour. Order it by name from any paint shop.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <FlaskConical size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Custom Colour — Follow the Mixing Formula Below</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Mix the exact amounts shown. Total batch = <strong>{totalVolume || '1000ml (1 Litre)'}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Mixing section (only for non-standard colours) ── */}
      {!availableDirectly && mixingFormula?.length > 0 && (
        <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="font-bold text-sm">AI Paint Mixing Formula</span>
              </div>
              <span className="text-[10px] bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 px-2 py-0.5 rounded-full font-semibold">
                Gemini 2.5 Flash ✦
              </span>
            </div>
            <p className="text-white/60 text-xs mt-1">
              Exact amounts for 1 Litre batch · Follow the step order carefully
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)]">
            {[
              { id: 'formula', icon: <Beaker size={13} />, label: 'Formula & Amounts' },
              { id: 'steps',   icon: <Layers size={13} />, label: 'Step-by-Step Guide' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--surface)] text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Formula ── */}
          <AnimatePresence mode="wait">
            {activeTab === 'formula' && (
              <motion.div
                key="formula"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Pie */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <PieChart formula={mixingFormula} />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 text-center font-medium">
                      Colour proportions
                    </p>
                    <div className="mt-2 space-y-1">
                      {mixingFormula.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: f.hex }} />
                          {f.color}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amounts table */}
                  <div className="flex-1 space-y-2.5">
                    {mixingFormula.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="rounded-xl border border-[var(--border)] overflow-hidden"
                      >
                        <div className="flex items-center gap-3 p-3">
                          {/* Colour swatch */}
                          <div
                            className="w-10 h-10 rounded-lg flex-shrink-0 border-2 border-white shadow"
                            style={{ background: item.hex, boxShadow: `0 2px 8px ${item.hex}44` }}
                          />
                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-[var(--text-primary)]">{item.color}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[var(--text-muted)]">{item.percent}%</span>
                              <span className="text-[var(--text-muted)] text-xs">·</span>
                              <span
                                className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                                style={{ background: item.hex }}
                              >
                                {item.ml} ml
                              </span>
                            </div>
                          </div>
                          {/* Bar */}
                          <div className="w-24 flex-shrink-0">
                            <div className="h-2.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percent}%` }}
                                transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background: item.hex }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Total */}
                    <div className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] mt-3">
                      <div className="flex items-center gap-2">
                        <Beaker size={15} className="text-[var(--brand-primary)]" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">Total Batch</span>
                      </div>
                      <span className="text-sm font-black text-[var(--brand-primary)]">
                        {totalVolume || '1000 ml (1 Litre)'}
                      </span>
                    </div>

                    {/* Target swatch */}
                    <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                      <p className="text-xs text-[var(--text-muted)] mb-2 font-semibold">Target Colour Result</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow"
                          style={{ background: hexCode }} />
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{colorName}</p>
                          <p className="text-xs font-mono text-[var(--text-muted)]">{hexCode?.toUpperCase()}</p>
                        </div>
                        <ArrowRight size={14} className="text-[var(--text-muted)] ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Tab: Steps ── */}
            {activeTab === 'steps' && (
              <motion.div
                key="steps"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-5"
              >
                {mixingSteps?.length > 0 ? (
                  <div className="space-y-3">
                    {/* Quick summary chips */}
                    <div className="flex flex-wrap gap-2 pb-2 mb-1">
                      {mixingFormula.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border text-[var(--text-primary)] bg-[var(--surface-2)]" style={{ borderColor: f.hex }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: f.hex }} />
                          <span className="font-semibold">{f.color}</span>
                          <span className="font-black text-[var(--brand-primary)]">{f.ml}ml</span>
                        </div>
                      ))}
                    </div>

                    {mixingSteps.map((step, i) => (
                      <MixingStep key={i} step={step} total={mixingSteps.length} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] text-center py-6">
                    No step-by-step guide available. Check the Formula tab.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key mixing tip */}
          {mixingTip && (
            <div className="mx-4 mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2">
              <Lightbulb size={15} className="text-indigo-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-800 leading-relaxed">
                <span className="font-bold">Key Tip: </span>{mixingTip}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Pro Tips ── */}
      {proTips?.length > 0 && (
        <div className="border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Lightbulb size={12} /> Pro Tips from the Paint Chemist
          </p>
          <ul className="space-y-2">
            {proTips.map((tip, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
              >
                <span className="text-[var(--brand-primary)] font-black mt-0.5 flex-shrink-0">
                  {i + 1}.
                </span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page (Admin Only)
// ─────────────────────────────────────────────────────────────────
export default function ColorAnalyzerPage() {
  const fileInputRef   = useRef(null);
  const fileInput2Ref  = useRef(null);

  const [imageSrc,  setImageSrc]  = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging,setIsDragging]= useState(false);
  const [history,   setHistory]   = useState([]);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // ── Load image file ──────────────────────────────────────────
  const loadFile = useCallback((file) => {
    if (!file?.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    setResult(null);
    setError('');
    setApiKeyMissing(false);
    setImageFile(file);
    setImageSrc(URL.createObjectURL(file));
  }, []);

  const handleFileInput = (e) => { loadFile(e.target.files?.[0]); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); loadFile(e.dataTransfer.files?.[0]); };

  // ── Send to Gemini AI ────────────────────────────────────────
  const analyzeWithAI = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const base64 = await fileToBase64(imageFile);
      const { data } = await api.post('/ai/analyze-color', { image: base64 });

      if (data.success) {
        setResult(data.analysis);
        setHistory(h => [
          { ...data.analysis, time: new Date().toLocaleTimeString() },
          ...h.slice(0, 4),
        ]);
      } else {
        setError(data.message || 'Analysis failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Connection error.';
      if (msg.includes('GEMINI_API_KEY') || msg.includes('not configured')) setApiKeyMissing(true);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setImageSrc(null);
    setImageFile(null);
    setResult(null);
    setError('');
    setApiKeyMissing(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-[var(--brand-primary)] flex items-center justify-center shadow-lg">
            <TestTube size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-[var(--text-primary)] font-['Outfit']">
                AI Colour Mixer
              </h1>
              <span className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-2.5 py-1 rounded-full shadow">
                Gemini 2.5 Flash
              </span>
              <span className="text-xs font-bold bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                🔒 Admin Only
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              Upload any colour photo → AI identifies the colour → get exact ML mixing formula with step-by-step instructions
            </p>
          </div>
        </div>
      </div>

      {/* ── API key missing banner ── */}
      <AnimatePresence>
        {apiKeyMissing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-5 p-4 bg-amber-50 border border-amber-300 rounded-2xl">
            <p className="font-bold text-amber-800 flex items-center gap-2 mb-1">
              <AlertTriangle size={15} /> Gemini API Key Not Set
            </p>
            <p className="text-sm text-amber-700">
              Open <code className="bg-amber-100 px-1 rounded">backend/.env</code> and set{' '}
              <code className="bg-amber-100 px-1 rounded">GEMINI_API_KEY</code> with your key from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
                className="underline font-semibold">aistudio.google.com</a> (free).
              Then restart the backend.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ══════════════════════════════════════════════════════
            LEFT — Upload panel
            ══════════════════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Upload zone */}
          {!imageSrc ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-purple-500 bg-purple-50 scale-[1.01]'
                  : 'border-[var(--border)] hover:border-purple-400 hover:bg-[var(--surface-2)]'
              }`}
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />

              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-[var(--brand-primary)] rounded-2xl flex items-center justify-center mb-5 shadow-xl">
                <Camera size={28} className="text-white" />
              </div>

              <p className="font-bold text-[var(--text-primary)] text-lg mb-1">
                Upload a Colour Photo
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                Take or upload a photo of any paint colour sample,<br />
                colour chip, or coloured surface
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {[
                  '🎨 Paint colour chips',
                  '🖼 Colour swatches',
                  '🪣 Paint tin sample',
                  '📸 Any colour photo',
                ].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[var(--text-muted)]">
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-4 py-2 rounded-xl border border-[var(--border)]">
                <Sparkles size={12} className="text-purple-500" />
                AI will calculate exact ML amounts to mix that colour
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-md">
                <img
                  src={imageSrc}
                  alt="Colour sample"
                  className="w-full block max-h-72 object-cover"
                  draggable={false}
                />
                {result && (
                  <div
                    className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shadow"
                    style={{
                      background: result.hexCode,
                      color: isLight(result.hexCode) ? '#111' : '#fff',
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                    {result.colorName}
                  </div>
                )}
                <button onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 text-white rounded-xl flex items-center justify-center hover:bg-black/80 transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Analyse button */}
              <motion.button
                onClick={analyzeWithAI}
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isLoading
                    ? '#555'
                    : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #e94560 100%)',
                  boxShadow: isLoading ? 'none' : '0 4px 24px rgba(124,58,237,0.45)',
                }}
              >
                {isLoading ? (
                  <><RefreshCw size={18} className="animate-spin" /> AI is analysing your colour…</>
                ) : (
                  <>
                    <Sparkles size={18} /> Analyse Colour with AI
                    <Zap size={13} className="text-yellow-300" />
                  </>
                )}
              </motion.button>

              {/* Change photo */}
              <button
                onClick={() => fileInput2Ref.current?.click()}
                className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <input ref={fileInput2Ref} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
                ↑ Upload a different colour photo
              </button>
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && !apiKeyMissing && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History */}
          {history.length > 0 && (
            <div className="border border-[var(--border)] rounded-xl p-4">
              <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                Recent Analyses
              </p>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setResult(h)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--surface-2)] text-left transition-colors group">
                    <div className="w-9 h-9 rounded-xl border border-[var(--border)] flex-shrink-0 shadow-sm"
                      style={{ background: h.hexCode }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{h.colorName}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {h.availableDirectly ? '✅ Direct' : `🧪 ${h.mixingFormula?.length} colours to mix`} · {h.time}
                      </p>
                    </div>
                    <ChevronRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--brand-primary)] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* How it works box */}
          {!imageSrc && (
            <div className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--surface-2)]">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Sparkles size={12} className="text-purple-500" /> How It Works
              </p>
              <div className="space-y-2.5">
                {[
                  { n: '1', icon: <Camera size={14} />, text: 'Upload a photo of any colour you want to match' },
                  { n: '2', icon: <Sparkles size={14} />, text: 'Gemini AI identifies the exact colour from the photo' },
                  { n: '3', icon: <Beaker size={14} />, text: 'Get exact ML amounts for a 1 Litre batch' },
                  { n: '4', icon: <Layers size={14} />, text: 'Follow step-by-step mixing order for perfect result' },
                ].map(s => (
                  <div key={s.n} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      {s.n}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-[var(--brand-primary)] mt-0.5">{s.icon}</span>
                      {s.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT — AI Result
            ══════════════════════════════════════════════════════ */}
        <div>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl">
                    <TestTube size={32} className="text-white" />
                  </div>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      className="absolute inset-0 rounded-full border-2 border-purple-400"
                      animate={{ scale: [1, 1.8 + i * 0.4], opacity: [0.5, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }} />
                  ))}
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] mb-1">
                  Gemini AI is analysing the colour…
                </p>
                <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
                  Identifying colour, calculating exact ML amounts, and preparing your step-by-step mixing guide
                </p>
                <div className="mt-5 flex gap-1.5">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }} />
                  ))}
                </div>
              </motion.div>

            ) : result ? (
              <motion.div key={result.colorName} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AIResultPanel result={result} />
              </motion.div>

            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--surface-2)] to-[var(--border)] flex items-center justify-center mb-5">
                  <Palette size={38} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {imageSrc ? 'Click "Analyse Colour with AI"' : 'Upload a Colour Photo to Begin'}
                </p>
                <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed">
                  {imageSrc
                    ? 'Press the button and Gemini AI will identify your colour and give exact ML mixing instructions.'
                    : 'Upload a photo of any colour — paint chip, colour swatch, or colour sample — and get a precise mixing formula.'}
                </p>

                {!imageSrc && (
                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs w-full text-left">
                    {[
                      { icon: '🎨', title: 'Colour Name', desc: 'AI identifies the exact paint name' },
                      { icon: '🧪', title: 'ML Formula', desc: 'Precise amounts for 1 Litre batch' },
                      { icon: '📋', title: 'Step-by-Step', desc: 'Which colour to mix first & last' },
                      { icon: '💡', title: 'Pro Tips', desc: 'Expert advice for perfect result' },
                    ].map(f => (
                      <div key={f.title} className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                        <p className="text-xl mb-1">{f.icon}</p>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{f.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
