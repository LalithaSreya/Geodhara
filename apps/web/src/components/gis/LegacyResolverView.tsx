import React, { useState } from 'react';
import { api } from '../../api/client';
import { Search, ArrowDown, ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2, FileText, User } from 'lucide-react';

interface LegacyResolverViewProps {
  onSelectParcel: (ulpin: string) => void;
}

export const LegacyResolverView: React.FC<LegacyResolverViewProps> = ({ onSelectParcel }) => {
  const [queryTerm, setQueryTerm] = useState<string>('TS-LEG-1000');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resolveData, setResolveData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.resolveLegacy({
        legacy_identifier: queryTerm.trim(),
        state: selectedState !== 'ALL' ? selectedState : undefined,
      });
      setResolveData(data);
    } catch (err: any) {
      setError(err.message || 'No legacy mapping found for this identifier');
      setResolveData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setSample = (term: string, state: string) => {
    setQueryTerm(term);
    setSelectedState(state);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Legacy → ULPIN Mapping Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualizes the deterministic transition: Legacy State Identifier ↓ Mapped 14-char ULPIN ↓ 360° Unified Parcel Record.
          </p>
        </div>
      </div>

      {/* Preset samples */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Planted Demo Scenarios:</span>
        <button
          type="button"
          onClick={() => setSample('TS-LEG-1000', 'TS')}
          className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-700/50 rounded-lg text-xs font-mono transition"
        >
          Exact Match: TS-LEG-1000 (101/1)
        </button>
        <button
          type="button"
          onClick={() => setSample('TS-LEG-1010', 'TS')}
          className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-700/50 rounded-lg text-xs font-mono transition"
        >
          Mismatch Flagged: TS-LEG-1010
        </button>
        <button
          type="button"
          onClick={() => setSample('KA-LEG-1036', 'KA')}
          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-mono transition"
        >
          Karnataka Bhoomi: KA-LEG-1036
        </button>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleResolve} className="flex gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={queryTerm}
            onChange={(e) => setQueryTerm(e.target.value)}
            placeholder="Enter legacy identifier (e.g. TS-LEG-1000, KA-LEG-1036) or survey number..."
            className="w-full bg-slate-900 text-xs text-white pl-9 pr-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-2 shadow transition shrink-0"
        >
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Resolve Flow
        </button>
      </form>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* 3-Step Visual Flow */}
      {resolveData && resolveData.results && resolveData.results.map((item: any, idx: number) => {
        const flow = item.flow;
        return (
          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Resolution Pipeline: Match {idx + 1} of {resolveData.results.length}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Step 1 */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Step 1: Legacy Identifier</div>
                <div className="text-base font-bold font-mono text-amber-300">{flow.step_1_legacy_identifier.identifier}</div>
                <div className="text-xs text-slate-300">Survey No: <span className="font-semibold">{flow.step_1_legacy_identifier.survey_no}</span></div>
                <div className="text-[11px] text-slate-400">System: {flow.step_1_legacy_identifier.source_system} ({flow.step_1_legacy_identifier.state})</div>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex justify-center text-emerald-400">
                <ArrowRight className="w-6 h-6 animate-pulse" />
              </div>

              {/* Step 2 */}
              <div className={`border rounded-xl p-4 space-y-2 ${
                flow.step_2_mapped_ulpin.is_ambiguous ? 'bg-amber-950/30 border-amber-600/50' : 'bg-slate-900 border-emerald-800/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Step 2: Mapped ULPIN</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    flow.step_2_mapped_ulpin.is_ambiguous ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {flow.step_2_mapped_ulpin.match_status}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-emerald-400">{flow.step_2_mapped_ulpin.ulpin}</div>
                <div className="text-xs text-slate-300">
                  Confidence Score: <span className="font-bold">{(flow.step_2_mapped_ulpin.mapping_confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Vertical Flow to Step 3 */}
            <div className="flex justify-center text-emerald-400">
              <ArrowDown className="w-6 h-6 animate-bounce" />
            </div>

            {/* Step 3: Unified Parcel Card */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950/40 border border-emerald-700/60 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Step 3: Unified Parcel Identity
                </div>
                <div className="text-lg font-bold text-white font-mono">{flow.step_3_unified_parcel.ulpin}</div>
                <div className="text-xs text-slate-300">
                  {flow.step_3_unified_parcel.location.village}, {flow.step_3_unified_parcel.location.mandal}, {flow.step_3_unified_parcel.location.district} ({flow.step_3_unified_parcel.state_name})
                </div>
                <div className="text-xs text-emerald-400 font-semibold">
                  Cadastral Area: {flow.step_3_unified_parcel.recorded_area_sqm} m² | Geodesic: {flow.step_3_unified_parcel.geodesic_area_sqm} m²
                </div>
              </div>

              <button
                onClick={() => onSelectParcel(flow.step_3_unified_parcel.ulpin)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                Inspect 360° Dossier <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
