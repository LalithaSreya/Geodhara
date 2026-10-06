import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useStateJurisdiction, StateJurisdictionCode, STATE_METADATA_MAP } from '../../context/StateJurisdictionContext';
import { 
  Layers, 
  Map, 
  Search, 
  Award, 
  UserCircle2,
  Menu,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  LayoutDashboard
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, switchDemoRole } = useAuth();
  const { selectedState, setSelectedState, currentStateMeta } = useStateJurisdiction();

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: string; roleDesc: string }[] = [
    { role: 'citizen', label: 'Citizen', icon: '👤', roleDesc: 'Landowner & Title Applicant' },
    { role: 'officer', label: 'Revenue Officer', icon: '🏛️', roleDesc: 'Tahsildar Adjudication Cockpit' },
    { role: 'field_officer', label: 'Field Surveyor', icon: '📍', roleDesc: 'Offline PWA Studio' },
    { role: 'admin', label: 'System Admin', icon: '⚡', roleDesc: 'DPI Infrastructure & Telemetry' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim().toUpperCase();
    if (clean.length === 14 && /^[A-Z0-9]{14}$/.test(clean)) {
      navigate(`/parcel/${clean}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchQuery('');
  };

  const handleStateSelect = (state: StateJurisdictionCode) => {
    setSelectedState(state);
    setIsStateDropdownOpen(false);
  };

  const handleRoleSelect = async (role: UserRole) => {
    await switchDemoRole(role);
    setIsRoleDropdownOpen(false);
    navigate('/dashboard');
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">
                GeoDhara
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PS 26014
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 hidden sm:block">
              One parcel. One identity.
            </p>
          </div>
        </Link>

        {/* Global 14-char ULPIN Quick Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 14-char ULPIN (e.g. TSQXY9QM4KNXSZ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-8 pr-16 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[10px] px-2 py-0.5 rounded-lg transition"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Dual Context Controls: Step 1 (State) & Step 2 (Role) */}
        <div className="flex items-center gap-2">
          {/* Step 1: State Jurisdiction Pill & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsStateDropdownOpen(!isStateDropdownOpen);
                setIsRoleDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-700 hover:border-emerald-500/50 text-slate-200 transition shadow-sm"
              title="Click to switch State Land Jurisdiction"
            >
              <span className="text-sm">{currentStateMeta.icon}</span>
              <span className="font-bold hidden sm:inline">{currentStateMeta.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">({selectedState})</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isStateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>Step 1: Jurisdiction</span>
                  <Link
                    to="/select-state"
                    onClick={() => setIsStateDropdownOpen(false)}
                    className="text-emerald-400 hover:underline normal-case font-sans"
                  >
                    Guided Setup
                  </Link>
                </div>
                {(['TS', 'KA', 'ALL'] as StateJurisdictionCode[]).map((st) => {
                  const meta = STATE_METADATA_MAP[st];
                  const isActive = selectedState === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStateSelect(st)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div>
                          <div className="font-bold">{meta.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{meta.portalName}</div>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Persona Role Pill & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen(!isRoleDropdownOpen);
                setIsStateDropdownOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-700 hover:border-blue-500/50 text-slate-200 transition shadow-sm"
              title="Click to switch Operational Persona"
            >
              <span className="text-sm">
                {roles.find((r) => r.role === user?.role)?.icon || '👤'}
              </span>
              <span className="font-bold hidden sm:inline">
                {roles.find((r) => r.role === user?.role)?.label || 'Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between items-center">
                  <span>Step 2: Operational Role</span>
                  <Link
                    to="/select-role"
                    onClick={() => setIsRoleDropdownOpen(false)}
                    className="text-blue-400 hover:underline normal-case font-sans"
                  >
                    Guided Setup
                  </Link>
                </div>
                {roles.map((r) => {
                  const isActive = user?.role === r.role;
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => handleRoleSelect(r.role)}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                        isActive
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.icon}</span>
                        <div>
                          <div className="font-bold">{r.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{r.roleDesc}</div>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Setup Wizard Button */}
          <Link
            to="/select-state"
            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/25 transition"
            title="Launch 2-step setup wizard"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup Funnel</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Simplified, Clean Secondary Nav Bar (Eliminating the 8 flat tabs) */}
      <nav className="border-t border-slate-800/80 bg-slate-950/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                location.pathname === '/dashboard' || location.pathname === '/'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Role Dashboard
            </Link>

            <Link
              to="/search"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                location.pathname === '/search'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Cadastral GIS Map
            </Link>

            <Link
              to="/demo-guide"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                location.pathname === '/demo-guide'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Jury Demo Guide
            </Link>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-2">
            <span>Jurisdiction:</span>
            <span className="text-slate-300 font-semibold">{currentStateMeta.name}</span>
            <span>•</span>
            <span>Role:</span>
            <span className="text-slate-300 font-semibold">{user?.role}</span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 14-char ULPIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-20 py-2 text-xs text-white placeholder-slate-400"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-emerald-600 text-white text-xs px-3 py-1 rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Mobile Quick Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link
              to="/select-state"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
            >
              <span>🏛️</span>
              <span>Step 1: State</span>
            </Link>
            <Link
              to="/select-role"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
            >
              <span>👤</span>
              <span>Step 2: Role</span>
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Role Dashboard</span>
            </Link>
            <Link
              to="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
            >
              <Map className="w-4 h-4 text-blue-400" />
              <span>Cadastral GIS</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
