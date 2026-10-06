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
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  }[badgeStyle];

  const iconBgClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  }[badgeStyle];

  return (
    <div
      className={`bg-slate-900/90 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:translate-y-[-2px] group ${
        borderHighlight ? 'border-emerald-500/50 shadow-emerald-950/30 shadow-lg' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-4">
        {/* Header row: Module tag & status badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
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
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition ${iconBgClasses}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="pt-5 mt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        {secondaryAction ? (
          secondaryAction.to ? (
            <Link
              to={secondaryAction.to}
              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>{secondaryAction.label}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              {secondaryAction.label}
            </button>
          )
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">DPI PS 26014</span>
        )}

        <Link
          to={primaryAction.to}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition group-hover:shadow-emerald-600/20"
        >
          <span>{primaryAction.label}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>
    </div>
  );
};
