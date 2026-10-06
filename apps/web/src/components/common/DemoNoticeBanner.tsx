import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DemoNoticeBanner: React.FC = () => {
  return (
    <aside aria-label="Demo environment notice" className="bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] tracking-wide border border-amber-500/30">
            DEMO ENVIRONMENT
          </span>
          <span className="font-semibold text-amber-100">
            All data is synthetic. Government integrations are represented by mock adapters.
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-amber-300/80 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            ULPIN: 14-char Opaque Identifiers
          </span>
          <span>•</span>
          <span>SIH 2026 Prototype — PS 26014</span>
        </div>
      </div>
    </aside>
  );
};
