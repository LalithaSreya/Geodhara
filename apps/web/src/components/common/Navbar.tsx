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
  LayoutDashboard,
  Play
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
    <header className="bg-[#0B3B60] text-white shadow-md sticky top-0 z-40">
      {/* Primary Government Masthead */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand & National DPI Identity */}
        <Link to="/dashboard" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-white text-[#0B3B60] shadow-md flex items-center justify-center border-2 border-amber-400/80 group-hover:scale-105 transition">
            <Layers className="w-6 h-6 text-[#0B3B60]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                GeoDhara
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-[#0B3B60] shadow-xs">
                PS 26014
              </span>
            </div>
            <p className="text-[10px] font-medium text-blue-100 hidden sm:block tracking-wide">
              राष्ट्रीय भू-अभिलेख एकीकृत मंच | National Land Governance DPI
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
              className="w-full bg-white border border-blue-200 rounded-xl pl-8 pr-16 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#07263F] hover:bg-[#041726] text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs"
              title="Click to switch State Land Jurisdiction"
            >
              <span className="text-sm">{currentStateMeta.icon}</span>
              <span className="font-bold hidden sm:inline">{currentStateMeta.name}</span>
              <span className="text-[10px] text-amber-300 font-mono">({selectedState})</span>
              <ChevronDown className="w-3 h-3 text-blue-200 ml-0.5" />
            </button>

            {isStateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex justify-between items-center">
                  <span>Step 1: Jurisdiction</span>
                  <Link
                    to="/select-state"
                    onClick={() => setIsStateDropdownOpen(false)}
                    className="text-[#0B3B60] hover:underline normal-case font-sans font-bold"
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
                          ? 'bg-blue-50 text-[#0B3B60] border-l-4 border-[#0B3B60] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.icon}</span>
                        <div>
                          <div className="font-bold">{meta.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{meta.portalName}</div>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-[#0B3B60]" />}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/25 transition shadow-xs"
              title="Click to switch Operational Persona"
            >
              <span className="text-sm">
                {roles.find((r) => r.role === user?.role)?.icon || '👤'}
              </span>
              <span className="font-bold hidden sm:inline">
                {roles.find((r) => r.role === user?.role)?.label || 'Role'}
              </span>
              <ChevronDown className="w-3 h-3 text-blue-200 ml-0.5" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 flex justify-between items-center">
                  <span>Step 2: Operational Role</span>
                  <Link
                    to="/select-role"
                    onClick={() => setIsRoleDropdownOpen(false)}
                    className="text-[#0B3B60] hover:underline normal-case font-sans font-bold"
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
                          ? 'bg-blue-50 text-[#0B3B60] border-l-4 border-[#0B3B60] font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.icon}</span>
                        <div>
                          <div className="font-bold">{r.label}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{r.roleDesc}</div>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-[#0B3B60]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Start Demo Button (Phase 11 Requirement) */}
          <Link
            to="/select-state"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-[#0B3B60] shadow-xs transition"
            title="Start SIH 2026 Evaluation 2-Minute Demonstration Flow"
          >
            <Play className="w-3.5 h-3.5 fill-[#0B3B60]" />
            <span>Start Demo</span>
          </Link>

          {/* Quick Setup Wizard Button */}
          <Link
            to="/select-state"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition"
            title="Launch 2-step setup wizard"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Setup Funnel</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Official Clean White Secondary Navigation Bar */}
      <nav className="border-t border-blue-900/30 bg-white px-4 text-slate-700 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                location.pathname === '/dashboard' || location.pathname === '/'
                  ? 'bg-blue-50 text-[#0B3B60] border-b-2 border-[#0B3B60]'
                  : 'text-slate-600 hover:text-[#0B3B60] hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Role Dashboard
            </Link>

            <Link
              to="/search"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                location.pathname === '/search'
                  ? 'bg-blue-50 text-[#0B3B60] border-b-2 border-[#0B3B60]'
                  : 'text-slate-600 hover:text-[#0B3B60] hover:bg-slate-50'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Cadastral GIS Map
            </Link>

            <Link
              to="/demo-guide"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                location.pathname === '/demo-guide'
                  ? 'bg-blue-50 text-[#0B3B60] border-b-2 border-[#0B3B60]'
                  : 'text-slate-600 hover:text-[#0B3B60] hover:bg-slate-50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Jury Demo Guide
            </Link>
          </div>

          <div className="text-[11px] font-sans text-slate-500 hidden sm:flex items-center gap-2">
            <span>Jurisdiction:</span>
            <span className="text-[#0B3B60] font-bold">{currentStateMeta.name}</span>
            <span>•</span>
            <span>Active Persona:</span>
            <span className="text-[#0B3B60] font-bold capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 14-char ULPIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-20 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60]"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#0B3B60] hover:bg-[#07263F] text-white text-xs px-3 py-1 rounded-lg transition"
            >
              Search
            </button>
          </form>

          {/* Mobile Quick Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link
              to="/select-state"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B3B60] hover:bg-slate-100 flex items-center gap-2 transition"
            >
              <span>🏛️</span>
              <span>Step 1: State</span>
            </Link>
            <Link
              to="/select-role"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B3B60] hover:bg-slate-100 flex items-center gap-2 transition"
            >
              <span>👤</span>
              <span>Step 2: Role</span>
            </Link>
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B3B60] hover:bg-slate-100 flex items-center gap-2 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-[#0B3B60]" />
              <span>Role Dashboard</span>
            </Link>
            <Link
              to="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-[#0B3B60] hover:bg-slate-100 flex items-center gap-2 transition"
            >
              <Map className="w-4 h-4 text-[#0B3B60]" />
              <span>Cadastral GIS</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
