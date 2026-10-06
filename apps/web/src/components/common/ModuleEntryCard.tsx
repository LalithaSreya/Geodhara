import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight, ExternalLink } from 'lucide-react';

export interface ModuleEntryCardProps {
  moduleNumber: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  category: string;
  description: string;
  icon: LucideIcon;
  badgeText: string;
  badgeStyle?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'cyan';
  primaryAction: {
    label: string;
    to: string;
  };
  secondaryAction?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
  borderHighlight?: boolean;
}

export const ModuleEntryCard: React.FC<ModuleEntryCardProps> = ({
  moduleNumber,
  title,
  category,
  description,
  icon: Icon,
  badgeText,
  badgeStyle = 'emerald',
  primaryAction,
  secondaryAction,
  borderHighlight = false,
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-[#0B3B60] border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  }[badgeStyle];

  const iconBgClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-[#0B3B60] border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  }[badgeStyle];

  return (
    <div
      className={`bg-white border rounded-xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-[#0B3B60]/40 group ${
        borderHighlight ? 'border-[#0B3B60] shadow-md ring-1 ring-[#0B3B60]/20' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="space-y-4">
        {/* Header row: Module tag & status badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Module {moduleNumber}
            </span>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              {category}
            </span>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClasses}`}>
            {badgeText}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-105 transition ${iconBgClasses}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#0B3B60] transition">
              {title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-4 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        {secondaryAction ? (
          secondaryAction.to ? (
            <Link
              to={secondaryAction.to}
              className="text-[11px] font-medium text-slate-600 hover:text-[#0B3B60] flex items-center gap-1 transition"
            >
              <span>{secondaryAction.label}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="text-[11px] font-medium text-slate-600 hover:text-[#0B3B60] flex items-center gap-1 transition"
            >
              {secondaryAction.label}
            </button>
          )
        ) : (
          <span className="text-[10px] text-slate-400 font-mono">DPI PS 26014</span>
        )}

        <Link
          to={primaryAction.to}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B3B60] hover:bg-[#07263F] text-white font-semibold text-xs rounded-lg shadow-sm transition"
        >
          <span>{primaryAction.label}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
};
