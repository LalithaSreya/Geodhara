import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  Search,
  Filter,
  Eye,
  Building
} from 'lucide-react';

export const OfficerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div className="space-y-6">
      {/* Officer Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold text-white">
                Revenue Officer / Tahsildar Governance Portal
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Authority Dashboard: Review automated rule validations, adjudicate high-risk cases, and issue certified title mutations.
            </p>
          </div>
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-xs font-mono font-bold">
            Officer: {user?.full_name || 'Tahsildar (Medchal / Devanahalli)'}
          </div>
        </div>

        {/* Stats Strip */}
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

      {/* Queue Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['ALL', 'AUTO_VALIDATED', 'BLOCKED', 'OFFICER_REVIEW', 'FIELD_VERIFICATION', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedStatus === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={fetchMutations}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">App Number</th>
                <th className="px-5 py-3">Target ULPIN / Survey</th>
                <th className="px-5 py-3">Applicant Name</th>
                <th className="px-5 py-3">Automated Risk Score</th>
                <th className="px-5 py-3">Lifecycle State</th>
                <th className="px-5 py-3">Submission Date</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mutations.map((app) => {
                const applicant = typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant;
                return (
                  <tr key={app.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      {app.application_number}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      <Link to={`/parcel/${app.ulpin}`} className="text-emerald-400 hover:underline">
                        {app.ulpin}
                      </Link>
                      <div className="text-[11px] text-slate-400 font-sans">
                        Sy: {app.legacy_survey_no || 'N/A'} ({app.village || 'Medchal'})
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200">
                      {applicant?.name || 'Applicant'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${
                        app.risk_score >= 70 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        app.risk_score >= 30 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {app.risk_score}/100
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        app.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                        app.status === 'AUTO_VALIDATED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                        app.status === 'FIELD_VERIFICATION' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-[11px]">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => navigate(`/officer/mutation/${app.id}`)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow transition"
                      >
                        Review Cockpit <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
