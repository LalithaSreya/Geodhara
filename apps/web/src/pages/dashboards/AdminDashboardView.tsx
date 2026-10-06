import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { ModuleEntryCard } from '../../components/common/ModuleEntryCard';
import { DpiOverview } from '../../components/stats/DpiOverview';
import { 
  Server, 
  Lock, 
  Database, 
  Map, 
  FileText, 
  ShieldAlert, 
  Satellite, 
  Smartphone, 
  Activity, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { currentStateMeta } = useStateJurisdiction();

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Admin Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold rounded-full shadow-sm">
              <Server className="w-3.5 h-3.5 text-purple-700" /> DPI System Administration & Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              GeoDhara Infrastructure Governance Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Federation Scope: <span className="font-bold text-slate-900">{currentStateMeta.name}</span> — Administrator: {user?.full_name || 'System Administrator'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/audit"
              className="px-4 py-2 bg-[#0B3B60] hover:bg-[#07263F] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Verify SHA-256 Ledger
            </Link>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Monitor platform health across PostgreSQL 16 (PostGIS EPSG:4326), Redis session and cache latency, Express REST API telemetry, and cross-state adapter schema normalization between Telangana Dharani and Karnataka Bhoomi.
        </p>
      </div>

      {/* Module Entry Cards (Admin Entitlements: Modules 1-6 + Infrastructure) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            All 6 System Modules & Infrastructure Services
          </h2>
          <span className="text-[11px] text-emerald-700 font-mono font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Superuser Control
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 6: Audit Ledger (Primary for Admin) */}
          <ModuleEntryCard
            moduleNumber={6}
            title="Cryptographic Audit Ledger"
            category="SHA-256 Hash Chain"
            description="Inspect the tamper-evident hash chain, execute mathematical rehash verification across blocks, and test concurrency advisory locks."
            icon={Lock}
            badgeText="Cryptographically Verified"
            badgeStyle="cyan"
            primaryAction={{
              label: 'Inspect Hash Chain',
              to: '/audit',
            }}
            secondaryAction={{
              label: 'Rehash Tamper Test',
              to: '/audit',
            }}
            borderHighlight={true}
          />

          {/* Module 1: State Adapters */}
          <ModuleEntryCard
            moduleNumber={1}
            title="Cross-State Adapters & GIS"
            category="Schema Federation"
            description="Examine heterogeneous schema adapters for Telangana Dharani and Karnataka Bhoomi, standardizing into national ULPIN model."
            icon={Map}
            badgeText="2 Active Adapters (TS/KA)"
            badgeStyle="emerald"
            primaryAction={{
              label: 'Explore Cadastral GIS',
              to: '/search',
            }}
            secondaryAction={{
              label: 'Inspect Seed Parcels',
              to: '/parcel/TSQXY9QM4KNXSZ',
            }}
          />

          {/* Module 2: Mutation Pipeline */}
          <ModuleEntryCard
            moduleNumber={2}
            title="Mutation Workflow SLA"
            category="Throughput & Queue"
            description="Track mutation processing latency, automated rule-engine throughput, and officer adjudication turn-around metrics."
            icon={FileText}
            badgeText="Adjudication Pipeline"
            badgeStyle="blue"
            primaryAction={{
              label: 'View Officer Queue',
              to: '/officer',
            }}
            secondaryAction={{
              label: 'Direct Form',
              to: '/mutation',
            }}
          />

          {/* Module 3: Risk Assessment Rules */}
          <ModuleEntryCard
            moduleNumber={3}
            title="Risk Rule Engine Config"
            category="Heuristic Scoring"
            description="Configured 4-tier composite risk scoring engine evaluating court stays (35 pts), mortgages (25 pts), and area mismatch (20 pts)."
            icon={ShieldAlert}
            badgeText="4-Tier Weights Active"
            badgeStyle="rose"
            primaryAction={{
              label: 'Inspect Risk Cases',
              to: '/parcel/TSSMSR2Z03QTQD',
            }}
            secondaryAction={{
              label: 'Mortgage Flag',
              to: '/parcel/TSZQ5STGR65JMU',
            }}
          />

          {/* Module 4: Satellite Pipeline */}
          <ModuleEntryCard
            moduleNumber={4}
            title="Satellite Ingestion Hub"
            category="Sentinel-2 Differencing"
            description="Temporal differencing engine computing NDVI and NDBI spectral rasters to flag rapid vegetative clearing and unauthorized buildings."
            icon={Satellite}
            badgeText="Worker Connected"
            badgeStyle="purple"
            primaryAction={{
              label: 'Open Satellite Hub',
              to: '/change-alerts',
            }}
            secondaryAction={{
              label: 'Sentinel-2 Visualizer',
              to: '/change-alerts',
            }}
          />

          {/* Module 5: Field Sync Health */}
          <ModuleEntryCard
            moduleNumber={5}
            title="Field Surveyor Sync Queue"
            category="Dexie IndexedDB PWA"
            description="Inspect client-side Dexie IndexedDB sync queues, offline observation caches, and field surveyor mobile telemetry."
            icon={Smartphone}
            badgeText="PWA Sync Online"
            badgeStyle="amber"
            primaryAction={{
              label: 'Field Surveyor Studio',
              to: '/field',
            }}
            secondaryAction={{
              label: 'Offline DB Tester',
              to: '/field',
            }}
          />
        </div>
      </div>

      {/* Embedded DPI Overview Component (Reused Existing Component) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0B3B60]" /> Platform Infrastructure Telemetry
        </h2>
        <DpiOverview />
      </div>
    </div>
  );
};
