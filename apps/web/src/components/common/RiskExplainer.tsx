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
  evidence?: Record<string, any>;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RiskExplainerProps {
  score: number;
  level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown?: RiskRuleItem[] | Record<string, any>;
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

  // Defensively normalize breakdown whether it is an array of RiskRuleItem or a record object
  const normalizedBreakdown: RiskRuleItem[] = Array.isArray(breakdown)
    ? breakdown
    : breakdown && typeof breakdown === 'object'
    ? Object.entries(breakdown)
        .filter(([_, val]) => typeof val === 'number' && (val as number) > 0)
        .map(([key, val]) => ({
          rule: key.toUpperCase().replace(/_/g, ' ') + '_FACTOR',
          points: Number(val),
          reason: `Risk score elevated due to ${key.replace(/_/g, ' ')} factor assessment.`,
          evidence: { [key]: val },
          severity:
            Number(val) >= 50
              ? 'CRITICAL'
              : Number(val) >= 30
              ? 'HIGH'
              : Number(val) >= 15
              ? 'MEDIUM'
              : 'LOW',
        }))
    : [];

  // Compute level if not explicitly provided
  const level = propLevel || (
    score >= 75 ? 'CRITICAL' :
    score >= 50 ? 'HIGH' :
    score >= 25 ? 'MEDIUM' : 'LOW'
  );

  const levelColor = {
    LOW: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      bar: 'bg-emerald-600',
      label: 'LOW RISK (CLEAR TITLE)',
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      bar: 'bg-amber-500',
      label: 'MEDIUM RISK (VERIFICATION ADVISED)',
    },
    HIGH: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      bar: 'bg-orange-500',
      label: 'HIGH RISK (RESTRICTIONS PRESENT)',
    },
    CRITICAL: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      bar: 'bg-rose-600',
      label: 'CRITICAL RISK (LEGAL RESTRAINT / BLOCK)',
    },
  }[level];

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header & Score Meter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0B3B60]" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Transparent & Explainable Risk Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rule-driven evaluation. No black-box AI — every point is backed by statutory evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {score}
              <span className="text-xs text-slate-400 font-sans">/100</span>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${levelColor.bg} ${levelColor.text} ${levelColor.border}`}>
              {level} LEVEL
            </span>
          </div>
        </div>
      </div>

      {/* Visual Risk Gauge Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>0 (CLEAN)</span>
          <span>25 (MEDIUM)</span>
          <span>50 (HIGH)</span>
          <span>75+ (CRITICAL)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 flex">
          <div
            className={`h-full rounded-full transition-all duration-500 ${levelColor.bar}`}
            style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
          />
        </div>
      </div>

      {/* "Why is this risky?" Explainability Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#0B3B60]" />
            Why is this {level.toLowerCase()} risk? ({normalizedBreakdown.length} rule factors triggered)
          </span>
          {evaluatedAt && (
            <span className="text-[10px] font-mono text-slate-500">
              Evaluated: {new Date(evaluatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        {normalizedBreakdown.length === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Clean Title Verified</span>
              <p className="text-[11px] text-emerald-700">
                0 encumbrances, 0 litigation disputes, valid cadastral survey geometry, and clean registration history.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {normalizedBreakdown.map((item, idx) => {
              const isExpanded = expandedIndex === idx;
              const severityBadge = {
                CRITICAL: 'bg-rose-50 text-rose-800 border-rose-200',
                HIGH: 'bg-orange-50 text-orange-800 border-orange-200',
                MEDIUM: 'bg-amber-50 text-amber-800 border-amber-200',
                LOW: 'bg-blue-50 text-[#0B3B60] border-blue-200',
              }[item.severity || 'LOW'];

              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden transition hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full p-3 text-left flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          item.severity === 'CRITICAL' ? 'text-rose-600' :
                          item.severity === 'HIGH' ? 'text-orange-600' :
                          item.severity === 'MEDIUM' ? 'text-amber-600' : 'text-blue-600'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{item.rule}</span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase border ${severityBadge}`}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">{item.reason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-1 bg-white text-slate-800 font-mono font-bold text-xs rounded-lg border border-slate-200 shadow-sm">
                        +{item.points} pts
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </button>

                  {/* Expandable Evidence Data */}
                  {isExpanded && item.evidence && (
                    <div className="px-4 pb-3 pt-2 border-t border-slate-200 bg-white text-[11px] font-mono space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Underlying Database Evidence:
                      </span>
                      <pre className="p-2.5 bg-slate-50 rounded-lg text-slate-700 overflow-x-auto text-[10px] border border-slate-200">
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
