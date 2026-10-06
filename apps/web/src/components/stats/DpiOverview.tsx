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
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0B3B60] text-xs font-bold border border-blue-200">
            <span>SIH 2026 Prototype PS 26014</span>
            <span>•</span>
            <span>Digital Public Infrastructure</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            GeoDhara: An Integrated GIS-based Land Governance DPI
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            GeoDhara unifies fragmented cadastral geometry, Record of Rights (RoR), deed registrations, encumbrances, litigation, satellite spectral changes, and field surveys into an authoritative 14-character ULPIN-centric digital ledger.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#0B3B60]" />
              <span>PostgreSQL 16 + PostGIS 3.4 Spatial Engine</span>
            </div>
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>ST_Area(geom::geography) Geodesic Math</span>
            </div>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="bg-blue-50 hover:bg-blue-100 text-[#0B3B60] px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 font-bold transition-colors"
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
            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Icon className={`w-5 h-5 ${s.color.replace('text-brand-400', 'text-[#0B3B60]').replace('-400', '-600')}`} />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  {s.val}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Core DPI Pillars: 1 PARCEL -> 1 IDENTITY -> 1 GIS VIEW -> 1 GOVERNANCE WORKFLOW */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#0B3B60]" />
          The GeoDhara Architectural Philosophy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">ONE PARCEL</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Authoritative PostGIS cadastral polygon bounding box with geodesic EPSG:4326 area computation.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0B3B60] flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">ONE IDENTITY</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              14-character alphanumeric opaque ULPIN acting as the single digital public anchor across all government silos.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">ONE GIS VIEW</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Unified 360° inspector merging RoR, deed registrations, active stays, and AI satellite change heatmaps.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm">ONE WORKFLOW</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Automated rules validation, risk calculation, offline mobile field sync, and SHA-256 audit chaining.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Credentials & Walkthrough Guide */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-3 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0B3B60]" />
          Pre-Configured Demo Personas (Safe Evaluation Credentials)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1">
            <div className="font-bold text-emerald-900">Citizen Persona</div>
            <div className="text-slate-700 font-mono text-[11px]">citizen@geodhara.demo</div>
            <div className="text-slate-500 text-[11px]">Pass: DemoCitizen@123</div>
            <div className="text-[10px] text-emerald-800 pt-1 font-medium">Apply for online title mutation</div>
          </div>

          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-1">
            <div className="font-bold text-[#0B3B60]">Revenue Officer (Tahsildar)</div>
            <div className="text-slate-700 font-mono text-[11px]">officer@geodhara.demo</div>
            <div className="text-slate-500 text-[11px]">Pass: DemoOfficer@123</div>
            <div className="text-[10px] text-[#0B3B60] pt-1 font-medium">Review risk flags & update RoR</div>
          </div>

          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-1">
            <div className="font-bold text-purple-900">Field Surveyor</div>
            <div className="text-slate-700 font-mono text-[11px]">field@geodhara.demo</div>
            <div className="text-slate-500 text-[11px]">Pass: DemoField@123</div>
            <div className="text-[10px] text-purple-800 pt-1 font-medium">Offline PWA GPS geotagging</div>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-1">
            <div className="font-bold text-amber-900">System Admin</div>
            <div className="text-slate-700 font-mono text-[11px]">admin@geodhara.demo</div>
            <div className="text-slate-500 text-[11px]">Pass: DemoAdmin@123</div>
            <div className="text-[10px] text-amber-800 pt-1 font-medium">Audit verification & DPI stats</div>
          </div>
        </div>
      </div>
    </div>
  );
};
