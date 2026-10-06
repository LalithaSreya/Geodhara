import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { ModuleEntryCard } from '../../components/common/ModuleEntryCard';
import { 
  User, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Layers,
  Map,
  ShieldAlert,
  Download,
  CheckCircle2
} from 'lucide-react';

export const CitizenDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { currentStateMeta } = useStateJurisdiction();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-planted citizen land holdings
  const citizenParcels = [
    { ulpin: 'TSQXY9QM4KNXSZ', village: 'Medchal', survey: '101/1', area: '14,500 m²', status: 'CLEAN', share: '60%', state: 'TS' },
    { ulpin: 'TS1EZQMU38RE38', village: 'Medchal', survey: '106/2', area: '8,200 m²', status: 'CLEAN', share: '100%', state: 'TS' },
    { ulpin: 'KAQMWVSBJHWXC7', village: 'Devanahalli', survey: '87/1', area: '9,800 m²', status: 'CLEAN', share: '100%', state: 'KA' },
  ].filter(p => currentStateMeta.code === 'ALL' || p.state === currentStateMeta.code);

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim().toUpperCase();
    if (clean.length === 14 && /^[A-Z0-9]{14}$/.test(clean)) {
      navigate(`/parcel/${clean}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#0B3B60] text-xs font-bold rounded-full shadow-sm">
              <User className="w-3.5 h-3.5 text-[#0B3B60]" /> Citizen Landowner Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome, {user?.full_name || 'Citizen User'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Active Jurisdiction: <span className="font-bold text-slate-900">{currentStateMeta.name}</span> ({currentStateMeta.portalName}) — {currentStateMeta.cadastralModel}
            </p>
          </div>

          <Link
            to="/mutation"
            className="px-4 py-2.5 bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Apply for Mutation
          </Link>
        </div>

        {/* Global 14-char ULPIN Quick Search */}
        <form onSubmit={handleQuickLookup} className="pt-2">
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Instant 14-character ULPIN or Survey Number Search:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter 14-char ULPIN (e.g. TSQXY9QM4KNXSZ) or Survey Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0B3B60] hover:bg-[#07263F] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Search className="w-4 h-4" /> Lookup
            </button>
          </div>
        </form>
      </div>

      {/* Relevant Module Entry Cards (Citizen Entitlements: Modules 1, 2, 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>Citizen Workspace Modules (3 Active)</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Internal officer & administration modules filtered out
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Module 1: Unified Parcel Identity */}
          <ModuleEntryCard
            moduleNumber={1}
            title="Unified Parcel Identity"
            category="Cadastral GIS"
            description="Access your digital land records, view high-precision PostGIS cadastral boundary polygons, and download certified Record of Rights (RoR) PDFs."
            icon={Map}
            badgeText={`${citizenParcels.length} Verified Holdings`}
            badgeStyle="emerald"
            primaryAction={{
              label: 'Open Cadastral GIS',
              to: '/search',
            }}
            secondaryAction={{
              label: 'Sample Parcel 360°',
              to: citizenParcels[0] ? `/parcel/${citizenParcels[0].ulpin}` : '/search',
            }}
            borderHighlight={true}
          />

          {/* Module 2: Mutation Workflow */}
          <ModuleEntryCard
            moduleNumber={2}
            title="Mutation Workflow"
            category="Title Transfer"
            description="Submit digital ownership mutation applications, link registered Sub-Registrar Office deeds, and track automated rule-engine validation progress."
            icon={FileText}
            badgeText="Online Application"
            badgeStyle="blue"
            primaryAction={{
              label: 'Apply for Mutation',
              to: '/mutation',
            }}
            secondaryAction={{
              label: 'Track Status',
              to: '/mutation',
            }}
          />

          {/* Module 3: Risk Assessment */}
          <ModuleEntryCard
            moduleNumber={3}
            title="Title Risk Assessment"
            category="Legal Verification"
            description="Transparent title verification reporting mortgage liens, civil court stay orders, and cadastral survey area discrepancies before buying or selling."
            icon={ShieldCheck}
            badgeText="Clearance Health"
            badgeStyle="amber"
            primaryAction={{
              label: 'Inspect Title Health',
              to: '/parcel/TSQXY9QM4KNXSZ',
            }}
            secondaryAction={{
              label: 'View Litigated Case',
              to: '/parcel/TSSMSR2Z03QTQD',
            }}
          />
        </div>
      </div>

      {/* Citizen Verified Land Holdings Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0B3B60]" /> Your Registered Land Holdings ({citizenParcels.length})
          </h2>
          <span className="text-[11px] text-emerald-700 font-mono font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citizenParcels.map((p) => (
            <div
              key={p.ulpin}
              className="bg-slate-50 border border-slate-200 hover:border-[#0B3B60] rounded-xl p-5 space-y-3 transition shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#0B3B60]">{p.ulpin}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {p.status}
                </span>
              </div>

              <div className="text-xs text-slate-700">
                Survey Number: <span className="font-bold text-slate-900">{p.survey}</span> ({p.village})
              </div>

              <div className="text-xs text-slate-600 flex items-center justify-between font-mono">
                <span>Extent: {p.area}</span>
                <span className="text-[#0B3B60] font-bold">Ownership: {p.share}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <Link
                  to={`/parcel/${p.ulpin}`}
                  className="text-xs font-semibold text-slate-700 hover:text-[#0B3B60] flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-[#0B3B60]" /> RoR PDF
                </Link>
                <Link
                  to={`/parcel/${p.ulpin}`}
                  className="text-xs font-bold text-[#0B3B60] hover:text-[#07263F] flex items-center gap-1"
                >
                  View 360° Record <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
