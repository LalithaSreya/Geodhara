import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RefreshCw, ArrowRight, ShieldCheck, Database, Layers, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface MockAdaptersViewProps {
  onSelectParcel: (ulpin: string) => void;
}

export const MockAdaptersView: React.FC<MockAdaptersViewProps> = ({ onSelectParcel }) => {
  const [selectedState, setSelectedState] = useState<'TS' | 'KA'>('TS');
  const [identifierInput, setIdentifierInput] = useState<string>('101/1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load comparison schema info on mount
  useEffect(() => {
    api.getAdapterComparison().then(setComparison).catch(() => {});
  }, []);

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifierInput.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchMockAdapter(selectedState, identifierInput.trim());
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch record from mock state adapter');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (state: 'TS' | 'KA', id: string) => {
    setSelectedState(state);
    setIdentifierInput(id);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0B3B60]" />
            <h2 className="text-lg font-bold text-slate-900">Mock State Adapters & Schema Normalization</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Simulates heterogeneous legacy state land portals (Telangana Dharani vs Karnataka Bhoomi RTC) normalizing into standard GeoDhara ULPIN records.
          </p>
        </div>
        <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-semibold">
          Mock State Adapter (Synthetic Demo)
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-600">Quick Test Records:</span>
        <button
          type="button"
          onClick={() => { setPreset('TS', '101/1'); }}
          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0B3B60] border border-blue-200 rounded-lg text-xs font-mono transition"
        >
          TS: Survey 101/1 (Pattadar)
        </button>
        <button
          type="button"
          onClick={() => { setPreset('TS', 'TS-LEG-1004'); }}
          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0B3B60] border border-blue-200 rounded-lg text-xs font-mono transition"
        >
          TS: Legacy TS-LEG-1004
        </button>
        <button
          type="button"
          onClick={() => { setPreset('KA', 'Sy-87/1'); }}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono transition"
        >
          KA: Sy-87/1 (Khatedar)
        </button>
        <button
          type="button"
          onClick={() => { setPreset('KA', 'KA-LEG-1049'); }}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono transition"
        >
          KA: Legacy KA-LEG-1049
        </button>
      </div>

      {/* Query Form */}
      <form onSubmit={handleResolve} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Select State System</label>
          <select
            value={selectedState}
            onChange={(e) => {
              const val = e.target.value as 'TS' | 'KA';
              setSelectedState(val);
              setIdentifierInput(val === 'TS' ? '101/1' : 'Sy-87/1');
            }}
            className="w-full bg-white text-xs text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0B3B60]"
          >
            <option value="TS">Telangana — Dharani Land Portal</option>
            <option value="KA">Karnataka — Bhoomi RTC System</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">Survey No / Legacy Identifier</label>
          <input
            type="text"
            value={identifierInput}
            onChange={(e) => setIdentifierInput(e.target.value)}
            placeholder="e.g. 101/1 or Sy-87/1"
            className="w-full bg-white text-xs text-slate-900 border border-slate-300 rounded-lg p-2 font-mono focus:ring-1 focus:ring-[#0B3B60]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B3B60] hover:bg-[#07263F] disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Normalize Record
          </button>
        </div>
      </form>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Side-by-Side Schema Comparison */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Raw Legacy Schema */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-amber-800 font-mono">1. Raw State Legacy Schema</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold border border-slate-200">{result.mock_adapter}</span>
            </div>
            <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg text-amber-200 overflow-x-auto max-h-72">
              {JSON.stringify(result.raw_state_schema, null, 2)}
            </pre>
          </div>

          {/* Right: Normalized GeoDhara Standard Schema */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-[#0B3B60] font-mono">2. Normalized GeoDhara Standard Schema</span>
              <button
                onClick={() => onSelectParcel(result.normalized_geodhara_schema.standard_ulpin)}
                className="text-[10px] font-bold px-2 py-0.5 bg-[#0B3B60] hover:bg-[#07263F] text-white rounded shadow flex items-center gap-1 transition"
              >
                Inspect 360° <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg text-emerald-400 overflow-x-auto max-h-72">
              {JSON.stringify(result.normalized_geodhara_schema, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
