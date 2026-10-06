import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Sparkles,
  CheckCircle2,
  FileText,
  Activity,
  SlidersHorizontal
} from 'lucide-react';

export interface RiskRuleItem {
  rule: string;
  points: number;
  reason: string;
  evidence: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskExplainerProps {
  score: number;
  level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown?: RiskRuleItem[];
  evaluatedAt?: string;
  compact?: boolean;
}

export const RiskExplainer: React.FC<RiskExplainerProps> = ({
  score,
  level: propLevel,
  breakdown = [],
  evaluatedAt,
  compact = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Compute level if not explicitly provided
  const level = propLevel || (
    score >= 75 ? 'CRITICAL' :
    score >= 50 ? 'HIGH' :
    score >= 25 ? 'MEDIUM' : 'LOW'
  );

  const levelColor = {
    LOW: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      label: 'LOW RISK (CLEAR TITLE)',
    },
    MEDIUM: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bar: 'bg-amber-500',
      label: 'MEDIUM RISK (VERIFICATION ADVISED)',
    },
    HIGH: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      bar: 'bg-orange-500',
      label: 'HIGH RISK (RESTRICTIONS PRESENT)',
    },
    CRITICAL: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bar: 'bg-rose-500',
      label: 'CRITICAL RISK (LEGAL RESTRAINT / BLOCK)',
    },
  }[level];

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Score Meter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Transparent & Explainable Risk Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic rule-driven evaluation. No black-box AI — every point is backed by statutory evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-extrabold font-mono text-white">
              {score}
              <span className="text-xs text-slate-500 font-sans">/100</span>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
              {level} LEVEL
            </span>
          </div>
        </div>
      </div>

      {/* Visual Risk Gauge Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0 (CLEAN)</span>
          <span>25 (MEDIUM)</span>
          <span>50 (HIGH)</span>
          <span>75+ (CRITICAL)</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
          <div
            className={`h-full rounded-full transition-all duration-500 ${levelColor.bar}`}
            style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
          />
        </div>
      </div>

      {/* "Why is this risky?" Explainability Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-400" />
            Why is this {level.toLowerCase()} risk? ({breakdown.length} rule factors triggered)
          </span>
          {evaluatedAt && (
            <span className="text-[10px] font-mono text-slate-500">
              Evaluated: {new Date(evaluatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {breakdown.length === 0 ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block">Clean Title Verified</span>
              <p className="text-[11px] text-emerald-300/80">
                0 encumbrances, 0 litigation disputes, valid cadastral survey geometry, and clean registration history.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {breakdown.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              const severityBadge = {
                CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                LOW: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
              }[item.severity || 'LOW'];

              return (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full p-3 text-left flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          item.severity === 'CRITICAL' ? 'text-rose-400' :
                          item.severity === 'HIGH' ? 'text-orange-400' :
                          item.severity === 'MEDIUM' ? 'text-amber-400' : 'text-blue-400'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{item.rule}</span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase border ${severityBadge}`}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 bg-slate-900 text-amber-400 font-mono font-bold text-xs rounded-lg border border-slate-800">
                        +{item.points} pts
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Evidence Data */}
                  {isExpanded && item.evidence && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-900 bg-slate-900/50 text-[11px] font-mono space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Underlying Database Evidence:
                      </span>
                      <pre className="p-2.5 bg-slate-950 rounded-lg text-slate-300 overflow-x-auto text-[10px] border border-slate-800">
                        {JSON.stringify(item.evidence, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
