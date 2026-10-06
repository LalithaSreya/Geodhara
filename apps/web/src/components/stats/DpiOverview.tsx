import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  BarChart3, 
  Layers, 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  ExternalLink, 
  Map, 
  FileText, 
  Lock, 
  Smartphone, 
  Satellite, 
  Cpu, 
  Users
} from 'lucide-react';

export const DpiOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, hRes] = await Promise.all([
          api.getAdminMetrics(),
          api.checkHealth(),
        ]);
        setMetrics(mRes.data);
        setHealth(hRes);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { label: 'Synthetic Parcels', val: metrics?.tables?.parcels || 64, icon: Map, color: 'text-brand-400' },
    { label: 'Pattadar Owners', val: metrics?.tables?.parcel_owners || 72, icon: Users, color: 'text-sky-400' },
    { label: 'Deed Registrations', val: metrics?.tables?.registrations || 66, icon: FileText, color: 'text-emerald-400' },
    { label: 'Active Encumbrances', val: metrics?.tables?.encumbrances || 3, icon: ShieldCheck, color: 'text-amber-400' },
    { label: 'Litigation Disputes', val: metrics?.tables?.litigation_cases || 2, icon: ShieldCheck, color: 'text-rose-400' },
    { label: 'Satellite Change Alerts', val: metrics?.tables?.change_alerts || 3, icon: Satellite, color: 'text-yellow-400' },
    { label: 'Field Observations', val: metrics?.tables?.field_observations || 2, icon: Smartphone, color: 'text-purple-400' },
    { label: 'Hash Audit Blocks', val: metrics?.tables?.audit_log || 11, icon: Lock, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 border border-brand-500/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold border border-brand-500/20">
            <span>SIH 2026 Prototype PS 26014</span>
            <span>•</span>
            <span>Digital Public Infrastructure</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            GeoDhara: An Integrated GIS-based Land Governance DPI
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            GeoDhara unifies fragmented cadastral geometry, Record of Rights (RoR), deed registrations, encumbrances, litigation, satellite spectral changes, and field surveys into an authoritative 14-character ULPIN-centric digital ledger.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-400" />
              <span>PostgreSQL 16 + PostGIS 3.4 Spatial Engine</span>
            </div>
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>ST_Area(geom::geography) Geodesic Math</span>
            </div>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 px-3 py-1.5 rounded-xl border border-brand-500/30 flex items-center gap-1.5 font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              OpenAPI Swagger Docs (/docs)
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-slate-100 font-mono">
                  {s.val}
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core DPI Pillars: 1 PARCEL -> 1 IDENTITY -> 1 GIS VIEW -> 1 GOVERNANCE WORKFLOW */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-400" />
          The GeoDhara Architectural Philosophy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-extrabold text-slate-200 text-sm">ONE PARCEL</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Authoritative PostGIS cadastral polygon bounding box with geodesic EPSG:4326 area computation.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-extrabold text-slate-200 text-sm">ONE IDENTITY</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              14-character alphanumeric opaque ULPIN acting as the single digital public anchor across all government silos.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-extrabold text-slate-200 text-sm">ONE GIS VIEW</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Unified 360° inspector merging RoR, deed registrations, active stays, and AI satellite change heatmaps.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="font-extrabold text-slate-200 text-sm">ONE WORKFLOW</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated rules validation, risk calculation, offline mobile field sync, and SHA-256 audit chaining.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Credentials & Walkthrough Guide */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-3">
        <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" />
          Pre-Configured Demo Personas (Safe Evaluation Credentials)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Citizen Persona</div>
            <div className="text-slate-300 font-mono">citizen@geodhara.demo</div>
            <div className="text-slate-500">Pass: DemoCitizen@123</div>
            <div className="text-[10px] text-slate-400 pt-1">Apply for online title mutation</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-sky-400">Revenue Officer (Tahsildar)</div>
            <div className="text-slate-300 font-mono">officer@geodhara.demo</div>
            <div className="text-slate-500">Pass: DemoOfficer@123</div>
            <div className="text-[10px] text-slate-400 pt-1">Review risk flags & update RoR</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-purple-400">Field Surveyor</div>
            <div className="text-slate-300 font-mono">field@geodhara.demo</div>
            <div className="text-slate-500">Pass: DemoField@123</div>
            <div className="text-[10px] text-slate-400 pt-1">Offline PWA GPS geotagging</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-amber-400">System Admin</div>
            <div className="text-slate-300 font-mono">admin@geodhara.demo</div>
            <div className="text-slate-500">Pass: DemoAdmin@123</div>
            <div className="text-[10px] text-slate-400 pt-1">Audit verification & DPI stats</div>
          </div>
        </div>
      </div>
    </div>
  );
};
