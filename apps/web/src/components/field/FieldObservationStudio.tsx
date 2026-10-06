import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { offlineDb, OfflineObservation } from '../../db/offlineDb';
import { useAuth } from '../../context/AuthContext';
import { 
  Smartphone, 
  MapPin, 
  Camera, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Save,
  Wifi,
  WifiOff,
  Navigation
} from 'lucide-react';

export const FieldObservationStudio: React.FC = () => {
  const { user } = useAuth();
  const [offlineQueue, setOfflineQueue] = useState<OfflineObservation[]>([]);
  const [syncedObservations, setSyncedObservations] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Form State
  const [targetUlpin, setTargetUlpin] = useState<string>('TS7A2K91M4P6X8');
  const [notes, setNotes] = useState<string>('Ground boundary stones verified. No unauthorized structures observed.');
  const [gpsLat, setGpsLat] = useState<number>(17.589201);
  const [gpsLng, setGpsLng] = useState<number>(78.487502);
  const [photoUrl, setPhotoUrl] = useState<string>('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Load IndexedDB queued observations & server observations
  const loadData = async () => {
    try {
      const local = await offlineDb.observations.toArray();
      setOfflineQueue(local);
      const serverRes = await api.getFieldObservations();
      setSyncedObservations(serverRes.data);
    } catch (err) {
      console.error('Failed to load observations:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSimulateGPS = () => {
    // Generate slight realistic GPS variation around Medchal region
    const randomLat = 17.585 + Math.random() * 0.05;
    const randomLng = 78.485 + Math.random() * 0.05;
    setGpsLat(Number(randomLat.toFixed(6)));
    setGpsLng(Number(randomLng.toFixed(6)));
  };

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();

    const newObs: OfflineObservation = {
      client_uuid: `FIELD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      parcel_id: '00000000-0000-0000-0000-000000000000', // resolved or placeholder
      ulpin: targetUlpin.trim().toUpperCase(),
      notes,
      photo_reference: photoUrl,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      observed_at: new Date().toISOString(),
      device_timestamp: new Date().toISOString(),
      parcel_version: 1,
      sync_status: 'PENDING_SYNC',
    };

    // 1. Save to Dexie IndexedDB
    await offlineDb.observations.add(newObs);
    setSyncStatusMsg('Observation saved locally in IndexedDB offline queue.');

    // 2. If online, attempt immediate sync
    if (isOnline) {
      await syncAllPending();
    } else {
      await loadData();
    }
  };

  const syncAllPending = async () => {
    setIsSyncing(true);
    try {
      const pending = await offlineDb.observations.where('sync_status').equals('PENDING_SYNC').toArray();
      if (pending.length === 0) {
        setSyncStatusMsg('No pending observations to sync.');
        return;
      }

      // First resolve real parcel_id from backend for the ULPINs
      const payload = [];
      for (const item of pending) {
        try {
          const parcelInfo = await api.getParcel360(item.ulpin);
          payload.push({
            client_uuid: item.client_uuid,
            parcel_id: parcelInfo.data.parcel.id,
            ulpin: item.ulpin,
            notes: item.notes,
            photo_reference: item.photo_reference,
            gps_lat: item.gps_lat,
            gps_lng: item.gps_lng,
            observed_at: item.observed_at,
            device_timestamp: item.device_timestamp,
            parcel_version: parcelInfo.data.parcel.version,
          });
        } catch {
          // If ULPIN not found
        }
      }

      if (payload.length > 0) {
        const syncRes = await api.syncFieldBatch(payload);
        // Mark as synced in Dexie
        for (const item of pending) {
          if (item.id) {
            await offlineDb.observations.update(item.id, { sync_status: 'SYNCED' });
          }
        }
        setSyncStatusMsg(`Successfully synchronized ${payload.length} observation(s) with central server!`);
      }
      await loadData();
    } catch (err: any) {
      setSyncStatusMsg(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#0B3B60]" />
              Field Surveyor Mobile PWA Studio
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'ONLINE (Direct Sync)' : 'OFFLINE MODE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            IndexedDB offline queue, geotagged observation capture, and optimistic concurrency sync.
          </p>
        </div>

        <button
          onClick={syncAllPending}
          disabled={isSyncing}
          className="bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Local Queue ({offlineQueue.filter((o) => o.sync_status === 'PENDING_SYNC').length})
        </button>
      </div>

      {syncStatusMsg && (
        <div className="bg-blue-50 border border-blue-200 text-[#0B3B60] px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <span>{syncStatusMsg}</span>
          <button onClick={() => setSyncStatusMsg(null)} className="text-[#0B3B60] font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Form & Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Field Observation Capture Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-[#0B3B60]" />
            Log On-Ground Field Observation
          </h3>

          <form onSubmit={handleSaveObservation} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Target Parcel ULPIN</label>
              <input
                type="text"
                value={targetUlpin}
                onChange={(e) => setTargetUlpin(e.target.value)}
                placeholder="14-char ULPIN (e.g. TS7A2K91M4P6X8)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none focus:border-[#0B3B60] focus:bg-white"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">GPS Coordinates</label>
                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  className="text-[#0B3B60] hover:underline font-semibold text-[11px] flex items-center gap-1"
                >
                  <Navigation className="w-3 h-3" />
                  Simulate GPS Fix
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.000001"
                  value={gpsLat}
                  onChange={(e) => setGpsLat(parseFloat(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:border-[#0B3B60] focus:bg-white"
                  placeholder="Latitude"
                  required
                />
                <input
                  type="number"
                  step="0.000001"
                  value={gpsLng}
                  onChange={(e) => setGpsLng(parseFloat(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:border-[#0B3B60] focus:bg-white"
                  placeholder="Longitude"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Observation Ground Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#0B3B60] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Geotagged Photo Simulation URL</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-700 text-[11px] focus:outline-none focus:border-[#0B3B60] focus:bg-white"
              />
              {photoUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                  <img src={photoUrl} alt="Geotagged Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold p-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              Save Observation (Offline-Ready)
            </button>
          </form>
        </div>

        {/* Right: Synced Logs & Offline Queue (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col max-h-[600px] shadow-sm">
          <h3 className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span>Observation History & Dexie Sync Status</span>
            <span className="text-[11px] text-slate-500 font-normal">Total: {syncedObservations.length + offlineQueue.length} records</span>
          </h3>

          <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
            {/* Offline Pending Items */}
            {offlineQueue
              .filter((o) => o.sync_status === 'PENDING_SYNC')
              .map((obs) => (
                <div key={obs.client_uuid} className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-900">{obs.ulpin}</span>
                    <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      IN LOCAL QUEUE (IndexedDB)
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{obs.notes}</p>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>GPS: {obs.gps_lat}, {obs.gps_lng}</span>
                    <span>UUID: {obs.client_uuid}</span>
                  </div>
                </div>
              ))}

            {/* Server Synced Items */}
            {syncedObservations.map((obs) => (
              <div key={obs.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0B3B60]">{obs.ulpin}</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    SYNCED TO SERVER
                  </span>
                </div>
                <p className="text-slate-700 text-[11px]">{obs.notes}</p>
                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>GPS: {obs.gps_lat}, {obs.gps_lng}</span>
                  <span>Officer: {obs.field_officer_id}</span>
                  <span>{new Date(obs.observed_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
