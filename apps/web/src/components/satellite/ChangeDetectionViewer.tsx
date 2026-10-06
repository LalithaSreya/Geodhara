import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Satellite, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Percent, 
  ShieldAlert,
  Sparkles,
  Sliders
} from 'lucide-react';

interface ChangeDetectionViewerProps {
  onSelectParcel: (ulpin: string) => void;
}

export const ChangeDetectionViewer: React.FC<ChangeDetectionViewerProps> = ({
  onSelectParcel,
}) => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getChangeAlerts();
      setAlerts(res.data);
      if (res.data.length > 0 && !selectedAlert) {
        setSelectedAlert(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load change alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleVerify = async (action: 'VERIFY' | 'DISMISS') => {
    if (!selectedAlert) return;
    try {
      await api.verifyChangeAlert(selectedAlert.id, action, 'Verified during AI satellite change review');
      setActionMsg(`Alert marked as ${action === 'VERIFY' ? 'VERIFIED' : 'DISMISSED'}`);
      await fetchAlerts();
      const res = await api.getChangeAlerts();
      const updated = res.data.find((a: any) => a.id === selectedAlert.id);
      if (updated) setSelectedAlert(updated);
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Satellite className="w-5 h-5 text-[#0B3B60]" />
            AI Satellite Change Intelligence Hub
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Temporal Sentinel-2 & Landsat spectral differencing (NDVI vegetation loss & NDBI built-up surge).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-[#0B3B60] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
          <Sparkles className="w-4 h-4 text-[#0B3B60]" />
          <span>Automated Spectral Differencing Engine</span>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-amber-800 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Grid: Alerts List + Before/After Comparison Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Change Alert Records (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col max-h-[650px] shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-200 flex items-center justify-between">
            <span>Detected Change Alerts ({alerts.length})</span>
          </h3>

          <div className="overflow-y-auto space-y-2.5 flex-1 pt-3">
            {alerts.map((al) => {
              const isSelected = selectedAlert?.id === al.id;
              return (
                <div
                  key={al.id}
                  onClick={() => setSelectedAlert(al)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-xs text-[#0B3B60] flex items-center gap-1">
                      <Satellite className="w-3 h-3" />
                      {al.type}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      al.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : al.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {al.status}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                    {al.ulpin}
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>{al.village}, {al.mandal}</span>
                    <span className="text-emerald-700 font-bold">{(al.confidence * 100).toFixed(0)}% Conf.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Temporal Split Visualizer & Officer Decision Deck (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col max-h-[650px] overflow-y-auto shadow-sm">
          {selectedAlert ? (
            <>
              {/* Alert Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-200">
                      {selectedAlert.type}
                    </span>
                    <span className="text-xs text-slate-500">Method: {selectedAlert.detection_method}</span>
                  </div>
                  <h3 className="text-sm font-extrabold font-mono text-slate-900 mt-1 flex items-center gap-2">
                    Parcel ULPIN:
                    <button
                      onClick={() => onSelectParcel(selectedAlert.ulpin)}
                      className="text-[#0B3B60] hover:underline"
                    >
                      {selectedAlert.ulpin}
                    </button>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify('VERIFY')}
                    className="bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verify Alert
                  </button>
                  <button
                    onClick={() => handleVerify('DISMISS')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Before / After Interactive Split-Slider Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span className="flex items-center gap-1 text-[#0B3B60]">
                    <Calendar className="w-3.5 h-3.5" />
                    Before: {selectedAlert.before_date} (Baseline Cadastre)
                  </span>
                  <span className="flex items-center gap-1 text-amber-800">
                    <Calendar className="w-3.5 h-3.5" />
                    After: {selectedAlert.after_date} (Temporal Sentinel Image)
                  </span>
                </div>

                {/* Simulated Dual Satellite Split Canvas */}
                <div className="relative w-full h-72 rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-900 select-none">
                  {/* Background Image: After (Change state) */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200')`,
                      filter: 'contrast(1.2) brightness(0.9)',
                    }}
                  >
                    {/* Visual Change Heat Overlay */}
                    <div className="absolute inset-0 bg-rose-600/30 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="bg-slate-950/80 border border-rose-500/60 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 shadow-xl flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        AI Detected Spectral Anomaly Zone
                      </div>
                    </div>
                  </div>

                  {/* Foreground Image: Before (Baseline state) sliced by slider */}
                  <div
                    className="absolute inset-0 bg-cover bg-center border-r-2 border-white"
                    style={{
                      width: `${sliderPosition}%`,
                      backgroundImage: `url('https://images.unsplash.com/photo-1500076656116-558758c991c1?w=1200')`,
                    }}
                  >
                    <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-sky-300 border border-sky-500/30">
                      PRE-CAPTURE BASELINE
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-amber-300 border border-amber-500/30">
                    POST-CAPTURE SATELLITE
                  </div>
                </div>

                {/* Interactive Slider Controller */}
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0B3B60]"
                  />
                  <span className="text-xs font-mono text-slate-600 w-12 text-right">{sliderPosition}%</span>
                </div>
              </div>

              {/* Spectral Differencing Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Spectral Confidence</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {(selectedAlert.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Cloud Obscuration</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {(selectedAlert.cloud_pct * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-slate-500 text-[11px]">Detection Pipeline</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {selectedAlert.detection_method}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs">
              Select an alert from the left list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
