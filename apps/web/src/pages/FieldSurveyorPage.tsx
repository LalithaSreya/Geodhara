import React, { useState, useEffect } from 'react';
import { FieldObservationStudio } from '../components/field/FieldObservationStudio';
import { Smartphone, Wifi, WifiOff, MapPin, Camera, RefreshCw } from 'lucide-react';

export const FieldSurveyorPage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
              <Smartphone className="w-3.5 h-3.5" /> Offline-First Progressive Web Application
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Field Surveyor Observation Studio
            </h1>
            <p className="text-xs text-slate-300">
              Ground truth inspection studio with IndexedDB local caching, GPS coordinate acquisition, and auto-sync.
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'ONLINE (Direct Sync)' : 'OFFLINE (Dexie Local Store)'}</span>
          </div>
        </div>
      </div>

      {/* Embedded Studio */}
      <FieldObservationStudio />
    </div>
  );
};
