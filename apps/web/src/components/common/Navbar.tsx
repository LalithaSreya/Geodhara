import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { 
  Layers, 
  Map, 
  Search, 
  FileText, 
  Building, 
  Smartphone, 
  Satellite, 
  Lock, 
  Award, 
  UserCircle2,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, switchDemoRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roles: { role: UserRole; label: string; icon: string }[] = [
    { role: 'officer', label: 'Tahsildar (Officer)', icon: '🏛️' },
    { role: 'citizen', label: 'Citizen', icon: '👤' },
    { role: 'field_officer', label: 'Field Surveyor', icon: '📍' },
    { role: 'admin', label: 'Admin', icon: '⚡' },
  ];

  const navLinks = [
    { path: '/', label: 'Home', icon: Sparkles },
    { path: '/search', label: 'Cadastral GIS & Search', icon: Map },
    { path: '/mutation', label: 'Mutation Workflow', icon: FileText },
    { path: '/officer', label: 'Officer Portal', icon: Building },
    { path: '/field', label: 'Field Surveyor PWA', icon: Smartphone },
    { path: '/change-alerts', label: 'AI Satellite Hub', icon: Satellite },
    { path: '/audit', label: 'Audit Hash Chain', icon: Lock },
    { path: '/demo-guide', label: 'Demo Guide', icon: Award },
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

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                GeoDhara
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PS 26014
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              One parcel. One identity.
            </p>
          </div>
        </Link>

        {/* Global 14-char ULPIN Quick Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 14-char ULPIN (e.g. TSQXY9QM4KNXSZ) or Survey #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-9 pr-24 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] px-2.5 py-1 rounded-lg transition"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Persona Switcher & Mobile Menu Button */}
        <div className="flex items-center gap-2">
          {/* Persona Switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
              <UserCircle2 className="w-3.5 h-3.5 text-slate-400" /> Persona:
            </span>
            {roles.map((r) => {
              const isActive = user?.role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => switchDemoRole(r.role)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Nav Tabs Bar */}
      <nav className="border-t border-slate-800/80 bg-slate-950/80 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ULPIN or Survey..."
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

          {/* Mobile Personas */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Switch Persona:</span>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchDemoRole(r.role);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-xs p-2 rounded-xl border text-left flex items-center gap-2 ${
                    user?.role === r.role ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
