import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStateJurisdiction, StateJurisdictionCode, STATE_METADATA_MAP } from '../../context/StateJurisdictionContext';
import { Layers, ArrowRight, CheckCircle2, Sparkles, Building, Landmark, Globe } from 'lucide-react';

export const StateSelectionGateway: React.FC = () => {
  const navigate = useNavigate();
  const { selectedState, setSelectedState } = useStateJurisdiction();

  const handleSelectState = (state: StateJurisdictionCode) => {
    setSelectedState(state);
    navigate('/select-role');
  };

  const states: StateJurisdictionCode[] = ['TS', 'KA', 'ALL'];

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-10">
      {/* Step Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Workflow Step 1 of 2: State Jurisdiction Selection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select State Land Administration System
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          GeoDhara harmonizes state-level land registries into a standardized 14-character ULPIN cadastral framework. Select your operational jurisdiction:
        </p>
      </div>

      {/* State Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {states.map((code) => {
          const meta = STATE_METADATA_MAP[code];
          const isCurrent = selectedState === code;

          return (
            <div
              key={code}
              onClick={() => handleSelectState(code)}
              className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl text-left group ${
                isCurrent
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition">
                    {meta.icon}
                  </div>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white group-hover:text-emerald-300 transition">
                    {meta.name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-400 mt-0.5">
                    {meta.portalName}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {meta.description}
                </p>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cadastral Model:</span>
                    <span className="text-slate-300 font-semibold">{meta.cadastralModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="text-slate-300 font-semibold">{meta.districtFocus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seed Parcels:</span>
                    <span className="text-emerald-400 font-bold">{meta.seedParcelsCount} Parcels</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                    isCurrent
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}
                >
                  <span>Select {meta.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper Note */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center text-xs text-slate-400 max-w-xl mx-auto">
        <span className="text-slate-300 font-semibold">Note:</span> You can switch state jurisdiction at any point from the header badge without losing your active workflow or application status.
      </div>
    </div>
  );
};
