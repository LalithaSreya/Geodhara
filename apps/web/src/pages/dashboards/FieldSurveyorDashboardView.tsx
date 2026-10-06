import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { ModuleEntryCard } from '../../components/common/ModuleEntryCard';
import { FieldObservationStudio } from '../../components/field/FieldObservationStudio';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Map, 
  Satellite, 
  MapPin, 
  Camera, 
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const FieldSurveyorDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { currentStateMeta } = useStateJurisdiction();
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
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Field Surveyor Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full shadow-sm">
              <Smartphone className="w-3.5 h-3.5 text-amber-700" /> Field Surveyor Ground Truth Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Cadastral Inspection Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Surveyor: <span className="font-bold text-slate-900">{user?.full_name || 'K. Suresh'}</span> — Operational Zone: {currentStateMeta.name} ({currentStateMeta.districtFocus})
            </p>
          </div>

          {/* Online/Offline Status Indicator */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-sm ${
            isOnline 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
            <span>{isOnline ? 'ONLINE (Direct Cloud Sync)' : 'OFFLINE (IndexedDB Local Store)'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          This studio is an offline-capable Progressive Web Application (PWA). You can record GPS ground observations, snap geotagged photo evidence, and inspect physical boundaries in remote rural tracts without cellular connectivity.
        </p>
      </div>

      {/* Relevant Module Entry Cards (Field Surveyor Entitlements: Modules 5, 1, 4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Field Officer Modules (3 Active)
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Desktop judicial & mutation transfer tools filtered out
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 5: Field Verification (Primary) */}
          <ModuleEntryCard
            moduleNumber={5}
            title="Field Verification"
            category="Offline PWA Studio"
            description="Capture offline field observations with Dexie.js IndexedDB local storage, device GPS coordinates, and camera photo attachments."
            icon={Smartphone}
            badgeText={isOnline ? "Cloud Sync Ready" : "Local IndexedDB"}
            badgeStyle="amber"
            primaryAction={{
              label: 'Launch Field Studio',
              to: '/field',
            }}
            secondaryAction={{
              label: 'Check Local Cache',
              to: '/field',
            }}
            borderHighlight={true}
          />

          {/* Module 1: Unified Parcel Identity */}
          <ModuleEntryCard
            moduleNumber={1}
            title="Cadastral Boundary GIS"
            category="Spatial Verification"
            description="Compare physical ground survey markers against official PostGIS EPSG:4326 cadastral boundaries to spot boundary shifts."
            icon={Map}
            badgeText={`${currentStateMeta.seedParcelsCount} Boundary Layers`}
            badgeStyle="emerald"
            primaryAction={{
              label: 'Inspect GIS Map',
              to: '/search',
            }}
            secondaryAction={{
              label: 'View Test Plot',
              to: '/parcel/TSQXY9QM4KNXSZ',
            }}
          />

          {/* Module 4: Satellite Change Detection */}
          <ModuleEntryCard
            moduleNumber={4}
            title="Satellite Anomaly Targets"
            category="Target Ground Truth"
            description="Inspect Sentinel-2 NDVI/NDBI anomaly polygons flagged for vegetation clearing, new construction, or illegal encroachment."
            icon={Satellite}
            badgeText="3 Ground Targets"
            badgeStyle="purple"
            primaryAction={{
              label: 'Target Anomalies',
              to: '/change-alerts',
            }}
            secondaryAction={{
              label: 'Anomaly Parcel',
              to: '/parcel/TSHUK8ZNXG7QVJ',
            }}
          />
        </div>
      </div>

      {/* Embedded Field Observation Studio (Reused Existing Component) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#0B3B60]" /> Active Ground Truth Observation Workspace
        </h2>
        <FieldObservationStudio />
      </div>
    </div>
  );
};
