import React from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { 
  Map, 
  Layers, 
  FileText, 
  Smartphone, 
  Satellite, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  UserCircle2,
  CheckCircle2,
  Lock
} from 'lucide-react';

export type ActiveTab = 'gis' | 'legacy' | 'adapters' | 'mutation' | 'field' | 'satellite' | 'audit' | 'overview';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
}) => {
  const { user, switchDemoRole } = useAuth();

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'officer', label: 'Revenue Officer', icon: '🏛️' },
    { role: 'citizen', label: 'Citizen', icon: '👤' },
    { role: 'field_officer', label: 'Field Surveyor', icon: '📍' },
    { role: 'admin', label: 'Administrator', icon: '⚡' },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('gis')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-300 bg-clip-text text-transparent">
                GeoDhara
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PS 26014
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              One parcel. One identity.
            </p>
          </div>
        </div>

        {/* Global 14-char ULPIN Search Bar */}
        <form onSubmit={onSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 14-char ULPIN (e.g. TS7A2K91M4P6X8) or Village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg pl-9 pr-24 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] px-2.5 py-1 rounded-md transition-colors"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Role Persona Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
              Role:
            </span>
            {roles.map((r) => {
              const isActive = user?.role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => switchDemoRole(r.role)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span className="hidden sm:inline">{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav aria-label="Main Navigation" className="border-t border-slate-800/80 bg-slate-950/60 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('gis')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'gis'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Cadastral GIS Map & 360° Inspector
          </button>

          <button
            onClick={() => setActiveTab('legacy')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'legacy'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Legacy → ULPIN Resolver
          </button>

          <button
            onClick={() => setActiveTab('adapters')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'adapters'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Mock State Adapters (TS / KA)
          </button>

          <button
            onClick={() => setActiveTab('mutation')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'mutation'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Mutation & Governance Workflow
          </button>

          <button
            onClick={() => setActiveTab('field')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'field'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Field Surveyor (Offline PWA)
          </button>

          <button
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'satellite'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            AI Satellite Change Hub
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Tamper-Evident Hash Chain
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            DPI Overview & Architecture
          </button>
        </div>
      </nav>
    </header>
  );
};
