import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  X, 
  Maximize2, 
  Minimize2,
  MapPin,
  FileText,
  Building,
  ShieldAlert,
  Satellite,
  Smartphone,
  Lock,
  Search
} from 'lucide-react';

export interface TourStep {
  id: number;
  label: string;
  shortDesc: string;
  path: string;
  role?: 'citizen' | 'officer' | 'field_officer' | 'admin';
  icon: any;
  targetUlpin?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    label: 'STATE SELECTION',
    shortDesc: 'Choose state cadastral framework (Telangana / Karnataka / All)',
    path: '/select-state',
    icon: Layers,
  },
  {
    id: 2,
    label: 'ROLE SELECTION',
    shortDesc: 'Choose persona (Citizen / Officer / Field / Admin)',
    path: '/select-role',
    icon: Sparkles,
  },
  {
    id: 3,
    label: 'SEARCH PARCEL',
    shortDesc: 'Unified cross-state search by 14-char ULPIN or Survey No',
    path: '/search',
    icon: Search,
  },
  {
    id: 4,
    label: 'VIEW UNIFIED PARCEL',
    shortDesc: '360° Parcel Intelligence: Boundary, RoR, Deeds, Risk meter',
    path: '/parcel/TSQXY9QM4KNXSZ',
    targetUlpin: 'TSQXY9QM4KNXSZ',
    icon: MapPin,
  },
  {
    id: 5,
    label: 'APPLY MUTATION',
    shortDesc: 'Citizen files title mutation linking registered SRO deed',
    path: '/mutation?ulpin=TSQXY9QM4KNXSZ',
    targetUlpin: 'TSQXY9QM4KNXSZ',
    role: 'citizen',
    icon: FileText,
  },
  {
    id: 6,
    label: 'AUTO VALIDATION',
    shortDesc: 'Automated 11-rule engine validates encumbrance & boundaries',
    path: '/mutation',
    role: 'citizen',
    icon: CheckCircle2,
  },
  {
    id: 7,
    label: 'OFFICER REVIEW',
    shortDesc: 'Tahsildar adjudication cockpit examines application queue',
    path: '/officer/mutation/mut-app-1',
    role: 'officer',
    icon: Building,
  },
  {
    id: 8,
    label: 'RISK ANALYSIS',
    shortDesc: 'Visual risk explainability score (Stays, Mortgages, Area delta)',
    path: '/parcel/TSSMSR2Z03QTQD',
    targetUlpin: 'TSSMSR2Z03QTQD',
    icon: ShieldAlert,
  },
  {
    id: 9,
    label: 'SATELLITE CHANGE ALERT',
    shortDesc: 'Sentinel-2 before/after diffing detects vegetation loss & encroachment',
    path: '/change-alerts',
    icon: Satellite,
  },
  {
    id: 10,
    label: 'FIELD VERIFICATION',
    shortDesc: 'Field Surveyor PWA: Offline Dexie IndexedDB + GPS + photo evidence',
    path: '/field?ulpin=TSHUK8ZNXG7QVJ',
    targetUlpin: 'TSHUK8ZNXG7QVJ',
    role: 'field_officer',
    icon: Smartphone,
  },
  {
    id: 11,
    label: 'APPROVAL',
    shortDesc: 'Official statutory approval updates Record of Rights (RoR)',
    path: '/officer/mutation/mut-app-1',
    role: 'officer',
    icon: CheckCircle2,
  },
  {
    id: 12,
    label: 'AUDIT VERIFICATION',
    shortDesc: 'SHA-256 tamper-evident hash chain verification of all blocks',
    path: '/audit',
    icon: Lock,
  },
];

export const DemoTourNavigator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { switchDemoRole } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Synchronize current step index with active pathname
  useEffect(() => {
    const idx = TOUR_STEPS.findIndex((s) => location.pathname === s.path.split('?')[0]);
    if (idx !== -1) {
      setCurrentStepIdx(idx);
    }
  }, [location.pathname]);

  const handleGoToStep = async (stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex];
    if (!step) return;

    setCurrentStepIdx(stepIndex);
    if (step.role) {
      await switchDemoRole(step.role);
    }
    navigate(step.path);
  };

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      handleGoToStep(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      handleGoToStep(currentStepIdx - 1);
    }
  };

  const currentStep = TOUR_STEPS[currentStepIdx] || TOUR_STEPS[0];

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      <div className="fixed bottom-4 right-4 z-50 print:hidden flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl transition-all duration-200 border cursor-pointer ${
            isOpen
              ? 'bg-[#07263F] text-amber-300 border-amber-400'
              : 'bg-[#0B3B60] hover:bg-[#07263F] text-white border-amber-400 hover:scale-105'
          }`}
          title="Open SIH 2026 2-Minute Demo Navigator"
        >
          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{isOpen ? 'Close Demo Tour' : 'Start Demo (2-Min Flow)'}</span>
          <span className="bg-amber-400 text-[#0B3B60] font-mono px-1.5 py-0.2 rounded-full text-[10px]">
            {currentStepIdx + 1}/12
          </span>
        </button>
      </div>

      {/* Slide-Up Interactive Tour Controller Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 left-4 sm:left-auto sm:w-[540px] z-50 bg-white border-2 border-[#0B3B60] rounded-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4 text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-[#0B3B60] flex items-center justify-center font-bold text-xs">
                🎬
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B3B60]">
                  SIH 2026 Jury Demonstration Flow
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Exact 2-Minute Click-by-Click Evaluation Journey
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Step Active Card */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-[#0B3B60] text-white px-2 py-0.5 rounded-full">
                STEP {currentStep.id} OF 12
              </span>
              <span className="text-[10px] font-bold text-[#0B3B60] uppercase">
                {currentStep.label}
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium">
              {currentStep.shortDesc}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-blue-200/60 text-[11px] font-mono text-slate-500">
              <span>Target: {currentStep.path}</span>
              {currentStep.targetUlpin && (
                <span className="font-bold text-[#0B3B60]">ULPIN: {currentStep.targetUlpin}</span>
              )}
            </div>
          </div>

          {/* Navigation Controls: Prev / Next */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Step</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentStepIdx === TOUR_STEPS.length - 1}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B3B60] hover:bg-[#07263F] disabled:opacity-40 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mini 12-Step Progress Dots & Jump Grid */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              1-Click Jump to Any Demonstration Step:
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 text-center">
              {TOUR_STEPS.map((s, idx) => {
                const isCurrent = currentStepIdx === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleGoToStep(idx)}
                    className={`p-1.5 rounded-lg text-[10px] font-mono font-bold transition truncate border ${
                      isCurrent
                        ? 'bg-[#0B3B60] text-white border-[#0B3B60] shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title={`${s.id}. ${s.label}: ${s.shortDesc}`}
                  >
                    {s.id}. {s.label.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Seed Scenarios Quick Jump (Phase 10 Guarantee) */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Core SIH Scenarios (Direct 1-Click):
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => handleGoToStep(3)} // Step 4: Clean
                className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-left font-medium transition"
              >
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Scenario A: Clean Title
                </div>
                <div className="text-[10px] font-mono text-emerald-700">TSQXY9QM4KNXSZ (0 Risk)</div>
              </button>

              <button
                onClick={() => handleGoToStep(7)} // Step 8: Stay
                className="p-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-left font-medium transition"
              >
                <div className="font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-600" /> Scenario B: Court Stay
                </div>
                <div className="text-[10px] font-mono text-rose-700">TSSMSR2Z03QTQD (Risk: 95)</div>
              </button>

              <button
                onClick={() => handleGoToStep(8)} // Step 9: Satellite
                className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 text-left font-medium transition"
              >
                <div className="font-bold flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-purple-600" /> Scenario C: Satellite Anomaly
                </div>
                <div className="text-[10px] font-mono text-purple-700">TSHUK8ZNXG7QVJ (Veg Loss)</div>
              </button>

              <button
                onClick={() => handleGoToStep(9)} // Step 10: Field
                className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-left font-medium transition"
              >
                <div className="font-bold flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-amber-600" /> Scenario D: Field Survey PWA
                </div>
                <div className="text-[10px] font-mono text-amber-700">Offline Dexie + GPS</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
