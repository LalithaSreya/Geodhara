import React from 'react';
import { AlertTriangle, ShieldCheck, Landmark } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  return (
    <div className="w-full">
      {/* Official Government Tricolor Top Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* Official Top Ministry Masthead Strip */}
      <aside aria-label="Demo environment notice" className="bg-slate-100 border-b border-slate-200 px-4 py-1.5 text-xs text-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Government of India & Ministry Brand */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-800">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="text-base leading-none">🏛️</span>
              <span>भारत सरकार | Government of India</span>
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-600 hidden sm:inline">
              Ministry of Rural Development • Department of Land Resources (DoLR)
            </span>
          </div>

          {/* Prototype & Synthetic Simulation Badge */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] tracking-wide border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>SIH 2026 PROTOTYPE (PS 26014)</span>
            </span>
            <span className="text-slate-500 hidden md:inline">• Synthetic Demo Data</span>
            <span className="text-slate-500 hidden md:inline">• ULPIN Standard Compliant</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

