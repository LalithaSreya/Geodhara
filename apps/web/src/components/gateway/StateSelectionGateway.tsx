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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0B3B60] text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#0B3B60]" />
          <span>Workflow Step 1 of 2: State Jurisdiction Selection</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B3B60] tracking-tight">
          Select State Land Administration System
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
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
              className={`bg-white border rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg text-left group ${
                isCurrent
                  ? 'border-[#0B3B60] ring-2 ring-[#0B3B60]/20 bg-blue-50/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition">
                    {meta.icon}
                  </div>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-[#0B3B60] transition">
                    {meta.name}
                  </h3>
                  <div className="text-xs font-semibold text-[#0B3B60] mt-0.5">
                    {meta.portalName}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {meta.description}
                </p>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] font-mono text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cadastral Model:</span>
                    <span className="text-slate-800 font-semibold">{meta.cadastralModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jurisdiction:</span>
                    <span className="text-slate-800 font-semibold">{meta.districtFocus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Seed Parcels:</span>
                    <span className="text-emerald-700 font-bold">{meta.seedParcelsCount} Parcels</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                    isCurrent
                      ? 'bg-[#0B3B60] hover:bg-[#07263F] text-white'
                      : 'bg-slate-100 hover:bg-[#0B3B60] text-slate-700 hover:text-white group-hover:bg-[#0B3B60] group-hover:text-white'
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-600 max-w-xl mx-auto shadow-sm">
        <span className="text-[#0B3B60] font-semibold">Note:</span> You can switch state jurisdiction at any point from the header badge without losing your active workflow or application status.
      </div>
    </div>
  );
};
