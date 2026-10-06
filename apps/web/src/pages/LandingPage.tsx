import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Layers, 
  Map, 
  Search, 
  ShieldCheck, 
  Satellite, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Smartphone,
  Lock,
  GitBranch,
  Building,
  Database
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim().toUpperCase();
    if (clean.length === 14 && /^[A-Z0-9]{14}$/.test(clean)) {
      navigate(`/parcel/${clean}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sampleParcels = [
    { ulpin: 'TSQXY9QM4KNXSZ', state: 'TS', desc: 'Clean Title (Medchal 101/1)', tag: 'CLEAN', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { ulpin: 'TSZQ5STGR65JMU', state: 'TS', desc: 'Encumbered (SBI Mortgage)', tag: 'MORTGAGE', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { ulpin: 'TSSMSR2Z03QTQD', state: 'TS', desc: 'Litigated (Court Stay Granted)', tag: 'STAY ORDER', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
    { ulpin: 'KAQMWVSBJHWXC7', state: 'KA', desc: 'Karnataka Bhoomi RTC (Devanahalli)', tag: 'BHOOMI RTC', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
    { ulpin: 'TSHUK8ZNXG7QVJ', state: 'TS', desc: 'Satellite Alert (Vegetation Loss)', tag: 'AI ALERT', color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Smart India Hackathon 2026 — Problem Statement 26014</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            GeoDhara
          </h1>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            “One parcel. One identity.”
          </p>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            A unified GIS-based digital public infrastructure for transparent, interoperable, and citizen-centric land governance across state boundaries.
          </p>
        </div>

        {/* Global Hero Search Box */}
        <div className="max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter 14-char ULPIN, Survey Number, Owner Name, or Village..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 shrink-0"
            >
              Lookup Parcel <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Planted Case Fast Buttons */}
        <div className="space-y-2 pt-2">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Explore Pre-Planted Competition Demo Cases:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sampleParcels.map((p) => (
              <button
                key={p.ulpin}
                onClick={() => navigate(`/parcel/${p.ulpin}`)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 hover:scale-105 transition shadow-sm ${p.color}`}
              >
                <span>{p.ulpin}</span>
                <span className="text-[10px] font-sans opacity-80">({p.tag})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars Grid */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Unified Digital Public Infrastructure Architecture</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            From fragmented state silos to an interoperable, transparent, and mathematically auditable cadastral backbone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">ULPIN-Centric GIS Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every parcel receives an immutable 14-character unique identifier tied to high-precision PostGIS EPSG:4326 polygons with geodesic geodesic calculations.
            </p>
            <Link to="/search" className="text-xs text-emerald-400 font-bold flex items-center gap-1 hover:underline">
              Explore Cadastral GIS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-blue-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Rule-Engine Automated Mutation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated 4-tier risk validation catches court stays, mortgage liens, and double registrations before ownership is transferred.
            </p>
            <Link to="/mutation" className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:underline">
              View Mutation Workflow <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-purple-500/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition">
              <Satellite className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Satellite & Offline Field Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continuous NDVI/NDBI satellite differencing detects encroachment and land-use shifts, triggering offline surveyor ground inspections.
            </p>
            <Link to="/change-alerts" className="text-xs text-purple-400 font-bold flex items-center gap-1 hover:underline">
              Satellite Change Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-State Interoperability & Cryptographic Trust */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center shadow-2xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-full">
              <Database className="w-3.5 h-3.5" /> Cross-State Heterogeneous Adapters
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              Bridging Telangana Dharani & Karnataka Bhoomi
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              GeoDhara standardizes legacy state terminology (Pattadar, Khatedar, Hissa, RTC, Khata) into a single national domain model without replacing state backend systems.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                Open GIS Cadastral Map
              </Link>
              <Link
                to="/audit"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700 transition"
              >
                Inspect Hash Chain
              </Link>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 p-6 rounded-2xl space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
              <span>LEDGER INTEGRITY SUMMARY</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-4 h-4" /> VERIFIED
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Hash Algorithm:</span>
                <span className="text-slate-300 font-bold">SHA-256 (Canonical JSON)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Concurrency Lock:</span>
                <span className="text-slate-300 font-bold">pg_advisory_xact_lock(42001)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Test Parcels:</span>
                <span className="text-emerald-400 font-bold">64 (36 TS / 28 KA)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamper Detection:</span>
                <span className="text-emerald-400 font-bold">Mathematical Rehash (Pass)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
