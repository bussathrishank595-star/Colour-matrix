import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, RotateCcw, Eye, Sliders, Paintbrush, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PAINT_COLORS = [
  { name: 'Crimson Red', hex: '#c0392b', rgb: [192, 57, 43] },
  { name: 'Ocean Blue', hex: '#2980b9', rgb: [41, 128, 185] },
  { name: 'Forest Green', hex: '#27ae60', rgb: [39, 174, 96] },
  { name: 'Sunshine Yellow', hex: '#f1c40f', rgb: [241, 196, 15] },
  { name: 'Pure White', hex: '#f8f9fa', rgb: [248, 249, 250] },
  { name: 'Warm Cream', hex: '#fdf6e3', rgb: [253, 246, 227] },
  { name: 'Sunset Orange', hex: '#e67e22', rgb: [230, 126, 34] },
  { name: 'Slate Grey', hex: '#7f8c8d', rgb: [127, 140, 141] },
  { name: 'Earthy Brown', hex: '#795548', rgb: [121, 85, 72] },
  { name: 'Royal Purple', hex: '#8e44ad', rgb: [142, 68, 173] },
];

function applyColorToCanvas(sourceCanvas, destCanvas, color, opacity = 0.65) {
  const ctx = destCanvas.getContext('2d');
  destCanvas.width = sourceCanvas.width;
  destCanvas.height = sourceCanvas.height;

  // Draw original image
  ctx.drawImage(sourceCanvas, 0, 0);

  // Get pixel data to detect wall/background areas (light-colored regions)
  const imgData = ctx.getImageData(0, 0, destCanvas.width, destCanvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    // Calculate brightness
    const brightness = (r + g + b) / 3;
    // Apply color to medium-to-bright areas (walls are usually lighter)
    if (brightness > 100) {
      const blend = opacity * (brightness / 255);
      data[i] = Math.round(r * (1 - blend) + color.rgb[0] * blend);
      data[i+1] = Math.round(g * (1 - blend) + color.rgb[1] * blend);
      data[i+2] = Math.round(b * (1 - blend) + color.rgb[2] * blend);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

// Drag handle for the before/after slider
function BeforeAfterSlider({ originalUrl, processedUrl }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl cursor-ew-resize select-none"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={(e) => isDragging.current && handleMove(e.clientX)}
      onMouseDown={() => isDragging.current = true}
      onMouseUp={() => isDragging.current = false}
      onMouseLeave={() => isDragging.current = false}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
    >
      {/* After (full) */}
      <img src={processedUrl} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img src={originalUrl} alt="Before" className="absolute inset-0 h-full object-cover" style={{ width: `${10000 / sliderPos}%` }} />
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center">
          <Sliders size={16} className="text-gray-700" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-semibold">
        BEFORE
      </div>
      <div className="absolute top-4 right-4 bg-[var(--brand-primary)] text-white text-xs px-3 py-1.5 rounded-full font-semibold">
        AFTER
      </div>
    </div>
  );
}

export default function VisualizerPage() {
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [opacity, setOpacity] = useState(65);
  const [showComparison, setShowComparison] = useState(false);

  const sourceCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setProcessedImage(null);
    setSelectedColor(null);
    setShowComparison(false);

    // Load image into hidden canvas
    const img = new Image();
    img.onload = () => {
      const canvas = sourceCanvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
    };
    img.src = url;
    toast.success('Image uploaded! Now select a color 🎨');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  const handleColorSelect = (color) => {
    if (!originalImage) {
      toast.error('Please upload an image first!');
      return;
    }
    setSelectedColor(color);
    applyColor(color);
  };

  const applyColor = (color) => {
    setIsProcessing(true);
    try {
      const outputCanvas = outputCanvasRef.current;
      applyColorToCanvas(sourceCanvasRef.current, outputCanvas, color, opacity / 100);
      const dataUrl = outputCanvas.toDataURL('image/jpeg', 0.92);
      setProcessedImage(dataUrl);
      setShowComparison(false);
      toast.success(`${color.name} applied! ✨`);
    } catch (err) {
      toast.error('Failed to apply color. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpacityChange = (val) => {
    setOpacity(val);
    if (selectedColor && originalImage) {
      applyColor(selectedColor);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `smartpaint-${selectedColor?.name.replace(/\s+/g, '-').toLowerCase()}-preview.jpg`;
    a.click();
    toast.success('Image downloaded!');
  };

  const handleReset = () => {
    setProcessedImage(null);
    setSelectedColor(null);
    setShowComparison(false);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-2)] py-8">
      {/* Hidden canvases for image processing */}
      <canvas ref={sourceCanvasRef} className="hidden" />
      <canvas ref={outputCanvasRef} className="hidden" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 text-[var(--brand-primary)] text-sm font-semibold px-4 py-2 rounded-full mb-4">
            <Paintbrush size={16} /> AI-Powered Paint Visualizer
          </span>
          <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-['Outfit'] mb-4">
            Visualize Your Perfect Color
          </h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Upload a photo of your room or wall, select a paint color, and see the transformation instantly with our AI-powered tool.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Upload + Controls */}
          <div className="space-y-6">
            {/* Step 1: Upload */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6"
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">1</span>
                Upload Your Image
              </h3>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--brand-primary)] hover:bg-[var(--surface-2)]'
                }`}
                id="image-upload-zone"
              >
                <input {...getInputProps()} />
                {originalImage ? (
                  <div>
                    <img src={originalImage} alt="Uploaded" className="w-full h-32 object-cover rounded-lg mb-3" />
                    <p className="text-sm text-[var(--brand-primary)] font-medium">✅ Image loaded</p>
                    <p className="text-xs text-[var(--text-muted)]">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">JPG, PNG, WEBP up to 10MB</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Step 2: Select Color */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">2</span>
                Choose Paint Color
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {PAINT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => handleColorSelect(color)}
                    title={color.name}
                    id={`color-${color.name.replace(/\s+/g, '-').toLowerCase()}`}
                    className={`group relative aspect-square rounded-xl border-2 transition-all hover:scale-110 ${
                      selectedColor?.name === color.name
                        ? 'border-[var(--brand-primary)] scale-110 shadow-lg'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selectedColor?.name === color.name && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle2 size={16} className="text-white drop-shadow" />
                      </div>
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-[var(--text-muted)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
              {selectedColor && (
                <div className="mt-6 p-3 bg-[var(--surface-2)] rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-[var(--border)]" style={{ backgroundColor: selectedColor.hex }} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedColor.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{selectedColor.hex}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Step 3: Adjust */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
                Adjust Intensity
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Color Intensity</span>
                  <span className="text-[var(--brand-primary)] font-bold">{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(Number(e.target.value))}
                  disabled={!selectedColor}
                  className="w-full accent-[var(--brand-primary)] cursor-pointer disabled:opacity-40"
                  id="opacity-slider"
                />
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>Subtle</span>
                  <span>Strong</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-[var(--text-primary)] text-lg">Preview</h3>
                {processedImage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowComparison(!showComparison)}
                      className={`btn-ghost text-sm py-2 ${showComparison ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]' : ''}`}
                      id="toggle-comparison"
                    >
                      <Eye size={16} />
                      {showComparison ? 'Single View' : 'Compare'}
                    </button>
                    <button onClick={handleReset} className="btn-ghost text-sm py-2">
                      <RotateCcw size={16} /> Reset
                    </button>
                    <button onClick={handleDownload} className="btn-primary text-sm py-2 px-4">
                      <Download size={16} /> Download
                    </button>
                  </div>
                )}
              </div>

              {/* Preview area */}
              <div className="rounded-2xl overflow-hidden bg-[var(--surface-2)] min-h-[400px] flex items-center justify-center">
                {!originalImage ? (
                  <div className="text-center p-12">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-[var(--text-secondary)] font-medium mb-2">No image uploaded yet</p>
                    <p className="text-[var(--text-muted)] text-sm">Upload a photo to get started</p>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center p-12">
                    <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">Applying color...</p>
                  </div>
                ) : showComparison && processedImage ? (
                  <BeforeAfterSlider originalUrl={originalImage} processedUrl={processedImage} />
                ) : processedImage ? (
                  <div className="w-full">
                    <img src={processedImage} alt="Color preview" className="w-full object-contain max-h-[500px] rounded-xl" />
                    {selectedColor && (
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ backgroundColor: selectedColor.hex }} />
                        <p className="text-[var(--text-secondary)] text-sm">
                          Painted in <strong className="text-[var(--text-primary)]">{selectedColor.name}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <img src={originalImage} alt="Original" className="w-full object-contain max-h-[500px] rounded-xl" />
                    <p className="text-center text-[var(--text-muted)] text-sm mt-3">← Select a color from the left panel</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recommended Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="font-bold text-[var(--text-primary)] mb-4">
                🛍️ Recommended Products
                {selectedColor && (
                  <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">for {selectedColor.name}</span>
                )}
              </h3>
              {selectedColor ? (
                <div className="space-y-3">
                  {[
                    { name: `${selectedColor.name} Interior Emulsion`, price: 'From ₹850', type: 'Premium Paint', emoji: '🎨' },
                    { name: `${selectedColor.name} Exterior Weather Coat`, price: 'From ₹1,250', type: 'Exterior Paint', emoji: '🏠' },
                    { name: 'Wall Putty (White Base)', price: 'From ₹450', type: 'Primer', emoji: '🪣' },
                  ].map((product, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-[var(--surface-2)] rounded-xl hover:bg-[var(--surface)] transition-colors">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: selectedColor.hex + '30' }}
                      >
                        {product.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] text-sm truncate">{product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{product.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--brand-primary)] font-bold text-sm">{product.price}</p>
                        <Link to={`/products?search=${encodeURIComponent(product.type)}`} className="text-xs text-[var(--text-muted)] hover:underline">
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                  <Link
                    to={`/products?category=paints`}
                    className="btn-primary w-full justify-center mt-2"
                  >
                    Shop All Paints
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-[var(--text-muted)]">
                  <Paintbrush size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Select a color to see matching products</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
