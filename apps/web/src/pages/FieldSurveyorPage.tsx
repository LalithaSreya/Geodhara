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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#0B3B60] text-xs font-bold rounded-full">
              <Smartphone className="w-3.5 h-3.5" /> Offline-First Progressive Web Application
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Field Surveyor Observation Studio
            </h1>
            <p className="text-xs text-slate-600">
              Ground truth inspection studio with IndexedDB local caching, GPS coordinate acquisition, and auto-sync.
            </p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
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
