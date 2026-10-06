import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useStateJurisdiction } from '../../context/StateJurisdictionContext';
import { ModuleEntryCard } from '../../components/common/ModuleEntryCard';
import { 
  Building, 
  Map, 
  FileText, 
  ShieldAlert, 
  Satellite, 
  Smartphone, 
  Lock, 
  RefreshCw, 
  Filter, 
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const OfficerDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentStateMeta } = useStateJurisdiction();

  const [mutations, setMutations] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMutations = async () => {
    setIsLoading(true);
    try {
      const res = await api.listMutations(selectedStatus !== 'ALL' ? selectedStatus : undefined);
      setMutations(res.data || []);
    } catch {
      setMutations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMutations();
  }, [selectedStatus]);

  const stats = {
    total: mutations.length,
    auto_validated: mutations.filter((m) => m.status === 'AUTO_VALIDATED').length,
    blocked: mutations.filter((m) => m.status === 'BLOCKED').length,
    field_req: mutations.filter((m) => m.status === 'FIELD_VERIFICATION').length,
    officer_review: mutations.filter((m) => m.status === 'OFFICER_REVIEW').length,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Officer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full">
              <Building className="w-3.5 h-3.5" /> Revenue Officer Adjudication Cockpit
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Tahsildar & Sub-Registrar Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Jurisdiction: <span className="font-bold text-white">{currentStateMeta.name}</span> ({currentStateMeta.portalName}) — Adjudicating officer: {user?.full_name || 'Tahsildar'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMutations}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Queue
            </button>
            <Link
              to="/search"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Map className="w-3.5 h-3.5" /> GIS Map
            </Link>
          </div>
        </div>

        {/* Live Queue Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Queue</span>
            <span className="text-xl font-bold font-mono text-white">{stats.total}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Auto-Validated (0 Risk)</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{stats.auto_validated}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 text-center">
            <span className="text-[10px] font-bold text-rose-400 uppercase block">Blocked (Legal Stays)</span>
            <span className="text-xl font-bold font-mono text-rose-400">{stats.blocked}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-amber-900/40 text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Field Verification</span>
            <span className="text-xl font-bold font-mono text-amber-400">{stats.field_req}</span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-blue-900/40 text-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase block">Pending Adjudication</span>
            <span className="text-xl font-bold font-mono text-blue-400">{stats.officer_review}</span>
          </div>
        </div>
      </div>

      {/* Complete Module Entry Cards (Officer Entitlements: Modules 1-6) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            All 6 Operational Governance Modules
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Full administrative access granted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1 */}
          <ModuleEntryCard
            moduleNumber={1}
            title="Unified Parcel Identity"
            category="Cadastral GIS"
            description="High-precision PostGIS cadastral polygon explorer, cross-state Dharani/Bhoomi schema adapters, and geodesic area verification."
            icon={Map}
            badgeText={`${currentStateMeta.seedParcelsCount} Cadastral Parcels`}
            badgeStyle="emerald"
            primaryAction={{
              label: 'Open GIS Map',
              to: '/search',
            }}
            secondaryAction={{
              label: 'State Adapters View',
              to: '/search',
            }}
          />

          {/* Module 2 */}
          <ModuleEntryCard
            moduleNumber={2}
            title="Mutation Workflow"
            category="Adjudication Cockpit"
            description="Execute official revenue approvals, examine SRO deed registrations, and issue cryptographically verifiable title mutation orders."
            icon={FileText}
            badgeText={`${stats.officer_review + stats.auto_validated} Pending Actions`}
            badgeStyle="blue"
            primaryAction={{
              label: 'Review Queue',
              to: '/officer',
            }}
            secondaryAction={{
              label: 'Direct Filing',
              to: '/mutation',
            }}
            borderHighlight={true}
          />

          {/* Module 3 */}
          <ModuleEntryCard
            moduleNumber={3}
            title="Risk Assessment"
            category="Rule Engine"
            description="Automated 4-tier risk evaluations flagging civil court stays, bank mortgages, area discrepancies, and high-risk flags."
            icon={ShieldAlert}
            badgeText={`${stats.blocked} High-Risk Flags`}
            badgeStyle="rose"
            primaryAction={{
              label: 'Examine Stays',
              to: '/parcel/TSSMSR2Z03QTQD',
            }}
            secondaryAction={{
              label: 'Mortgage Checks',
              to: '/parcel/TSZQ5STGR65JMU',
            }}
          />

          {/* Module 4 */}
          <ModuleEntryCard
            moduleNumber={4}
            title="Satellite Change Detection"
            category="AI Differencing"
            description="Sentinel-2 temporal NDVI/NDBI diffing detecting vegetation clearings, new unauthorized structures, and boundary encroachments."
            icon={Satellite}
            badgeText="Temporal Alerts Active"
            badgeStyle="purple"
            primaryAction={{
              label: 'Open Satellite Hub',
              to: '/change-alerts',
            }}
            secondaryAction={{
              label: 'Vegetation Loss Alert',
              to: '/parcel/TSHUK8ZNXG7QVJ',
            }}
          />

          {/* Module 5 */}
          <ModuleEntryCard
            moduleNumber={5}
            title="Field Verification"
            category="Ground Truth"
            description="Review ground-truth survey reports, geo-tagged inspection photos, and GPS boundary captures submitted by field surveyors."
            icon={Smartphone}
            badgeText={`${stats.field_req} Survey Orders`}
            badgeStyle="amber"
            primaryAction={{
              label: 'Field Surveyor Studio',
              to: '/field',
            }}
            secondaryAction={{
              label: 'Inspect Offline Mode',
              to: '/field',
            }}
          />

          {/* Module 6 */}
          <ModuleEntryCard
            moduleNumber={6}
            title="Cryptographic Audit Ledger"
            category="SHA-256 Chain"
            description="Verify the immutable audit hash-chain, execute mathematical rehash tamper tests, and inspect advisory transaction locks."
            icon={Lock}
            badgeText="SHA-256 Tamper-Free"
            badgeStyle="cyan"
            primaryAction={{
              label: 'Inspect Hash Chain',
              to: '/audit',
            }}
            secondaryAction={{
              label: 'Admin Telemetry',
              to: '/admin',
            }}
          />
        </div>
      </div>

      {/* Actionable Adjudication Queue Table (Reusing existing table logic) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Pending Mutation Applications Queue
            </h2>
            <p className="text-xs text-slate-400">
              Filter by lifecycle state and click 'Review Cockpit' to adjudicate or view parcel intelligence.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['ALL', 'AUTO_VALIDATED', 'BLOCKED', 'OFFICER_REVIEW', 'FIELD_VERIFICATION'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedStatus === st
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Target ULPIN / Survey</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Lifecycle State</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Adjudication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No applications matching current status filter.
                  </td>
                </tr>
              ) : (
                mutations.map((app) => {
                  const applicant = typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant;
                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-white">
                        {app.application_number}
                      </td>
                      <td className="px-4 py-3.5 font-mono">
                        <Link to={`/parcel/${app.ulpin}`} className="text-emerald-400 hover:underline">
                          {app.ulpin}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-sans">
                          Sy: {app.legacy_survey_no || 'N/A'} ({app.village || 'Medchal'})
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-200">
                        {applicant?.name || 'Applicant'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                          app.risk_score >= 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                          app.risk_score >= 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {app.risk_score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          app.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                          app.status === 'AUTO_VALIDATED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                          app.status === 'FIELD_VERIFICATION' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => navigate(`/officer/mutation/${app.id}`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow transition"
                        >
                          Review Cockpit <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
