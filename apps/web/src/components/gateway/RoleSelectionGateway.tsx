import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { 
  User, 
  Building, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  CheckCircle2,
  FileText,
  Map,
  Lock,
  Satellite
} from 'lucide-react';

export const RoleSelectionGateway: React.FC = () => {
  const navigate = useNavigate();
  const { user, switchDemoRole } = useAuth();
  const { currentStateMeta } = useStateJurisdiction();

  const handleSelectRole = async (role: UserRole) => {
    await switchDemoRole(role);
    navigate('/dashboard');
  };

  const roleDefinitions = [
    {
      role: 'citizen' as UserRole,
      title: 'Citizen Landowner',
      subtitle: 'Landholder, Buyer & Transferee',
      icon: User,
      iconEmoji: '👤',
      accent: 'emerald',
      description: 'Search land holdings, inspect title health, download certified RoR PDFs, and file digital mutation applications.',
      modules: ['Module 1: Unified Parcel Identity', 'Module 2: Mutation Workflow', 'Module 3: Risk Assessment'],
      kpi: 'Public & Citizen Access',
    },
    {
      role: 'officer' as UserRole,
      title: 'Revenue Officer / Tahsildar',
      subtitle: 'Adjudication Authority & SRO',
      icon: Building,
      iconEmoji: '🏛️',
      accent: 'blue',
      description: 'Adjudicate mutation queue, evaluate composite title risk, review satellite alerts, and issue certified title orders.',
      modules: [
        'Module 1: Cadastral GIS', 
        'Module 2: Mutation Cockpit', 
        'Module 3: Risk Engine', 
        'Module 4: Satellite Alerts', 
        'Module 5: Field Dossiers', 
        'Module 6: Audit Chain'
      ],
      kpi: 'Full Governance Queue',
    },
    {
      role: 'field_officer' as UserRole,
      title: 'Field Surveyor',
      subtitle: 'Ground Truth & Inspection PWA',
      icon: Smartphone,
      iconEmoji: '📍',
      accent: 'amber',
      description: 'Offline-first PWA studio for GPS boundary verification, geo-tagged photo evidence capture, and ground truth logging.',
      modules: [
        'Module 5: Field Observation Studio', 
        'Module 1: Cadastral Boundary Check', 
        'Module 4: Satellite Target Diff'
      ],
      kpi: 'Offline IndexedDB Studio',
    },
    {
      role: 'admin' as UserRole,
      title: 'System Administrator',
      subtitle: 'DPI Governance & Infrastructure',
      icon: ShieldCheck,
      iconEmoji: '⚡',
      accent: 'purple',
      description: 'Monitor PostgreSQL/PostGIS connection status, Redis latency, cross-state adapters, and SHA-256 hash ledger rehash validation.',
      modules: [
        'Module 6: Cryptographic Audit Ledger',
        'Module 1: State Adapters',
        'Module 2: Mutation SLA',
        'Module 3: Risk Rules',
        'Module 4: Satellite Pipeline',
        'Module 5: Sync Telemetry'
      ],
      kpi: 'Platform Telemetry & Audit',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 space-y-10">
      {/* Step Header */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Workflow Step 2 of 2: Operational Persona Selection</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400">Selected State Jurisdiction:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold font-mono">
            <span>{currentStateMeta.icon}</span>
            <span>{currentStateMeta.name}</span>
            <span className="text-emerald-400 text-[11px]">({currentStateMeta.portalName})</span>
          </span>
          <Link
            to="/select-state"
            className="text-xs text-slate-400 hover:text-emerald-400 underline transition ml-1"
          >
            Change State
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Select Your Operational Role
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          To reduce cognitive overload, each portal presents only the modules and actionable workflows relevant to that persona:
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roleDefinitions.map((item) => {
          const Icon = item.icon;
          const isCurrent = user?.role === item.role;

          return (
            <div
              key={item.role}
              onClick={() => handleSelectRole(item.role)}
              className={`bg-slate-900 border rounded-3xl p-6 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl text-left group ${
                isCurrent
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition">
                      {item.iconEmoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                        {item.title}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                    {item.kpi}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Enabled Modules List */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Active Entitled Modules ({item.modules.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.modules.map((m) => (
                      <span
                        key={m}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800/80"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md ${
                    isCurrent
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 group-hover:bg-emerald-600 group-hover:text-white'
                  }`}
                >
                  <span>Enter as {item.title}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4">
        <Link
          to="/select-state"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to State Selection
        </Link>
        <span className="text-xs text-slate-500 font-mono">
          GeoDhara DPI Architecture — SIH 2026
        </span>
      </div>
    </div>
  );
};
