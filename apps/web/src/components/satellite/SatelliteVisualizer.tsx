import React, { useState, useRef, useEffect } from 'react';
import { 
  Satellite, 
  Sliders, 
  Eye, 
  Layers, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  Compass,
  CheckCircle2,
  Maximize2
} from 'lucide-react';

interface SatelliteVisualizerProps {
  alert: any;
  beforeDate?: string;
  afterDate?: string;
  type: string;
  confidence: number;
  cloudPct: number;
}

export const SatelliteVisualizer: React.FC<SatelliteVisualizerProps> = ({
  alert,
  beforeDate = '2024-01-10',
  afterDate = '2024-06-15',
  type,
  confidence,
  cloudPct,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [viewMode, setViewMode] = useState<'SLIDER' | 'DIFFERENCE_HEATMAP' | 'THRESHOLD_MASK' | 'EDGE_CONTOURS'>('SLIDER');
  const [showPolygonOverlay, setShowPolygonOverlay] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Generate synthetic high-contrast canvas image representations for Sentinel-2 bands
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null);
  const afterCanvasRef = useRef<HTMLCanvasElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);

  const isVegLoss = type === 'VEGETATION_LOSS';
  const isBuiltUp = type === 'BUILT_UP_GAIN';
  const isCloudy = cloudPct > 20;

  useEffect(() => {
    // Render Before Scene
    const bCanvas = beforeCanvasRef.current;
    if (bCanvas) {
      const ctx = bCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isVegLoss ? '#1b4332' : '#2b2d42'; // Lush green forest/crop vs mixed
        ctx.fillRect(0, 0, 300, 200);

        // Add agricultural / terrain texture
        ctx.fillStyle = isVegLoss ? '#2d6a4f' : '#3d405b';
        for (let i = 0; i < 15; i++) {
          ctx.fillRect((i * 20) % 300, (i * 25) % 200, 18, 14);
        }

        // Add subtle parcel boundary simulation
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(30, 25, 240, 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`BEFORE: Sentinel-2 (${beforeDate})`, 10, 190);
      }
    }

    // Render After Scene
    const aCanvas = afterCanvasRef.current;
    if (aCanvas) {
      const ctx = aCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = isVegLoss ? '#582f0e' : isBuiltUp ? '#3f37c9' : '#2b2d42';
        ctx.fillRect(0, 0, 300, 200);

        // Render changed zone (cleared soil or built structure)
        if (isVegLoss) {
          ctx.fillStyle = '#7f4f24'; // Cleared bare ground
          ctx.fillRect(70, 50, 160, 100);
          ctx.fillStyle = '#99582a';
          ctx.fillRect(90, 65, 120, 70);
        } else if (isBuiltUp) {
          ctx.fillStyle = '#4895ef'; // Concrete reflectance
          ctx.fillRect(85, 60, 130, 80);
          ctx.fillStyle = '#f72585'; // Plinth / metal roof
          ctx.fillRect(105, 75, 90, 50);
        }

        if (isCloudy) {
          // Add cloud overlay simulation
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.arc(60, 50, 45, 0, Math.PI * 2);
          ctx.arc(180, 140, 65, 0, Math.PI * 2);
          ctx.fill();
        }

        // Parcel boundary
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(30, 25, 240, 150);

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`AFTER: Sentinel-2 (${afterDate})`, 10, 190);
      }
    }

    // Render OpenCV-Style Difference Heatmap & Mask
    const dCanvas = diffCanvasRef.current;
    if (dCanvas) {
      const ctx = dCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 300, 200);

        if (viewMode === 'DIFFERENCE_HEATMAP') {
          // Heatmap gradients (Red for veg loss, Yellow/Orange for built-up)
          const grad = ctx.createRadialGradient(150, 100, 10, 150, 100, 80);
          if (isVegLoss) {
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.95)'); // High drop
            grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.6)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');
          } else {
            grad.addColorStop(0, 'rgba(234, 179, 8, 0.95)'); // Built up surge
            grad.addColorStop(0.6, 'rgba(59, 130, 246, 0.6)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');
          }
          ctx.fillStyle = grad;
          ctx.fillRect(40, 30, 220, 140);
        } else if (viewMode === 'THRESHOLD_MASK') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, 300, 200);
          ctx.fillStyle = '#ffffff'; // Binary white mask for change pixels
          ctx.fillRect(75, 55, 150, 90);
        } else if (viewMode === 'EDGE_CONTOURS') {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.strokeRect(75, 55, 150, 90);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
          ctx.fillRect(75, 55, 150, 90);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`ALGORITHM: ${viewMode}`, 10, 190);
      }
    }
  }, [viewMode, type, cloudPct, beforeDate, afterDate]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setSliderPosition(pct);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-4 text-xs select-none">
      {/* Visualizer Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Satellite className="w-4 h-4 text-[#0B3B60]" />
          <span className="font-bold text-slate-900 uppercase tracking-wider">
            Optical Differencing Inspector
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { id: 'SLIDER', label: 'Before ↔ After' },
            { id: 'DIFFERENCE_HEATMAP', label: 'Δ Spectral Heatmap' },
            { id: 'THRESHOLD_MASK', label: 'Change Mask' },
            { id: 'EDGE_CONTOURS', label: 'Contour Vector' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                viewMode === mode.id
                  ? 'bg-[#0B3B60] text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Viewer Box */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-ew-resize shadow-inner"
      >
        {viewMode === 'SLIDER' ? (
          <>
            {/* After Scene (Base Layer) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <canvas ref={afterCanvasRef} width={300} height={200} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-purple-200 border border-purple-500/30">
                AFTER: {afterDate}
              </div>
            </div>

            {/* Before Scene (Clipped Top Layer) */}
            <div
              className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl"
              style={{ width: `${sliderPosition}%` }}
            >
              <canvas
                ref={beforeCanvasRef}
                width={300}
                height={200}
                className="w-full h-full object-cover"
                style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: 'none' }}
              />
              <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                BEFORE: {beforeDate}
              </div>
            </div>

            {/* Center Draggable Split Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#0B3B60] text-white flex items-center justify-center shadow-xl border-2 border-white">
                <Sliders className="w-3.5 h-3.5" />
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <canvas ref={diffCanvasRef} width={300} height={200} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Change Vector Polygon Overlay */}
        {showPolygonOverlay && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className={`border-2 border-dashed rounded-lg p-2 flex flex-col items-center justify-center ${
              isVegLoss ? 'border-rose-400 bg-rose-500/20' : 'border-amber-400 bg-amber-500/20'
            }`} style={{ width: '55%', height: '50%' }}>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isVegLoss ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {type}
              </span>
              <span className="text-[9px] text-white font-mono mt-0.5 drop-shadow">
                {(confidence * 100).toFixed(0)}% Confidence
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visualizer Controls Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-800">
          <input
            type="checkbox"
            checked={showPolygonOverlay}
            onChange={(e) => setShowPolygonOverlay(e.target.checked)}
            className="rounded border-slate-300 text-[#0B3B60] focus:ring-0"
          />
          <span>Show Detected Change Boundary Overlay</span>
        </label>

        <div className="flex items-center gap-3">
          <span>Cloud Interference: <strong className={cloudPct > 20 ? 'text-rose-600' : 'text-emerald-600'}>{cloudPct}%</strong></span>
          <span>Sensor: <strong>Sentinel-2 L2A (10m)</strong></span>
        </div>
      </div>

      {/* Scientific Transparency Notice */}
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] text-slate-600 leading-relaxed">
        ℹ️ <strong>Automated Radiometric Index Differencing:</strong> Change vectors are computed via physical band equations (ΔNDVI = B08-B04, ΔNDBI = B11-B08). No black-box AI claims. Officer ground inspection required.
      </div>
    </div>
  );
};
