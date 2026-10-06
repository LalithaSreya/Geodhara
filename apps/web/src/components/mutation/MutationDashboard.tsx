import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  CheckCircle2, 
  AlertOctagon, 
  UserCheck, 
  ArrowRight, 
  Clock, 
  PlusCircle, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  Send,
  Layers
} from 'lucide-react';

interface MutationDashboardProps {
  initialParcelForMutation?: any;
  onSelectParcel: (ulpin: string) => void;
}

export const MutationDashboard: React.FC<MutationDashboardProps> = ({
  initialParcelForMutation,
  onSelectParcel,
}) => {
  const { user } = useAuth();
  const [mutations, setMutations] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // New Application Modal
  const [showApplyModal, setShowApplyModal] = useState<boolean>(!!initialParcelForMutation);
  const [formParcelId, setFormParcelId] = useState<string>(initialParcelForMutation?.id || '');
  const [formUlpin, setFormUlpin] = useState<string>(initialParcelForMutation?.ulpin || '');
  const [applicantName, setApplicantName] = useState<string>('Vanga Nishith Reddy');
  const [applicantId, setApplicantId] = useState<string>('ID-CITIZEN-9912');
  const [applicantEmail, setApplicantEmail] = useState<string>('citizen@geodhara.demo');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchMutations = async () => {
    setIsLoading(true);
    try {
      const res = await api.listMutations(filterStatus !== 'ALL' ? filterStatus : undefined);
      setMutations(res.data);
      if (res.data.length > 0 && !selectedApp) {
        setSelectedApp(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch mutations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMutations();
  }, [filterStatus]);

  useEffect(() => {
    if (initialParcelForMutation) {
      setFormParcelId(initialParcelForMutation.id);
      setFormUlpin(initialParcelForMutation.ulpin);
      setShowApplyModal(true);
    }
  }, [initialParcelForMutation]);

  const handleCreateMutation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParcelId) {
      alert('Please specify target Parcel ID');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.submitMutation({
        parcelId: formParcelId,
        applicant: {
          name: applicantName,
          id_number: applicantId,
          email: applicantEmail,
        },
      });
      setActionMessage(`Mutation application ${res.data.application_number} submitted! Initial state: ${res.data.status}`);
      setShowApplyModal(false);
      await fetchMutations();
    } catch (err: any) {
      alert(`Submission failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (appId: string, targetStatus: string, reason: string) => {
    try {
      await api.transitionMutation(appId, targetStatus, reason);
      setActionMessage(`Application successfully transitioned to ${targetStatus}`);
      await fetchMutations();
      // Update selected app
      const updatedList = await api.listMutations();
      const updated = updatedList.data.find((m) => m.id === appId);
      if (updated) setSelectedApp(updated);
    } catch (err: any) {
      alert(`Transition error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      SUBMITTED: { bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-400', icon: Clock },
      AUTO_VALIDATED: { bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400', icon: Sparkles },
      BLOCKED: { bg: 'bg-rose-500/20 border-rose-500/30', text: 'text-rose-400', icon: AlertOctagon },
      OFFICER_REVIEW: { bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400', icon: UserCheck },
      FIELD_VERIFICATION: { bg: 'bg-purple-500/20 border-purple-500/30', text: 'text-purple-400', icon: Layers },
      APPROVED: { bg: 'bg-teal-500/20 border-teal-500/30', text: 'text-teal-400', icon: CheckCircle2 },
      RECORD_UPDATED: { bg: 'bg-emerald-500/30 border-emerald-500/50', text: 'text-emerald-300 font-extrabold', icon: CheckCircle2 },
      REJECTED: { bg: 'bg-red-500/20 border-red-500/30', text: 'text-red-400', icon: AlertOctagon },
    };
    const conf = map[status] || map.SUBMITTED;
    const Icon = conf.icon;
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border flex items-center gap-1 ${conf.bg} ${conf.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Land Mutation & Title Governance Workflow
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated rules engine, real-time risk scoring, and multi-stage revenue officer approval pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowApplyModal(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            New Mutation Application
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <span>✅ {actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Grid: Application List + Detailed Officer Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Applications List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col max-h-[650px]">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Applications ({mutations.length})
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="AUTO_VALIDATED">Auto-Validated</option>
              <option value="BLOCKED">Blocked</option>
              <option value="OFFICER_REVIEW">Officer Review</option>
              <option value="FIELD_VERIFICATION">Field Verification</option>
              <option value="RECORD_UPDATED">Record Updated</option>
            </select>
          </div>

          {/* List Items */}
          <div className="overflow-y-auto flex-1 space-y-2.5 pt-3">
            {isLoading ? (
              <div className="text-center py-10 text-slate-500 text-xs">Loading workflow queue...</div>
            ) : mutations.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No applications match selected filter.</div>
            ) : (
              mutations.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const applicantObj = typeof app.applicant === 'string' ? JSON.parse(app.applicant) : app.applicant;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-brand-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-100">
                        {app.application_number}
                      </span>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="text-xs text-slate-300 font-semibold mt-1">
                      {applicantObj.name}
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
                      <span className="font-mono text-brand-400">{app.ulpin}</span>
                      <span>Risk Score: <strong className={app.risk_score > 40 ? 'text-rose-400' : 'text-emerald-400'}>{app.risk_score}</strong>/100</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Officer Workbench & State Machine Actions (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col max-h-[650px] overflow-y-auto">
          {selectedApp ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Application Dossier</span>
                  <h3 className="text-base font-black text-slate-100 font-mono mt-0.5">{selectedApp.application_number}</h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span>Target ULPIN: <button onClick={() => onSelectParcel(selectedApp.ulpin)} className="text-brand-400 font-mono underline">{selectedApp.ulpin}</button></span>
                    <span>•</span>
                    <span>Village: {selectedApp.village}</span>
                  </div>
                </div>
                <div>{getStatusBadge(selectedApp.status)}</div>
              </div>

              {/* Risk Breakdown Card */}
              <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Automated Pre-Validation Results
                  </span>
                  <span className="text-xs font-bold text-slate-300">
                    Calculated Risk: <strong className={selectedApp.risk_score > 40 ? 'text-rose-400' : 'text-emerald-400'}>{selectedApp.risk_score}</strong>/100
                  </span>
                </div>

                {selectedApp.blocked_reason && (
                  <div className="bg-rose-950/40 border border-rose-500/40 p-2.5 rounded-lg text-rose-300 text-xs">
                    <strong>BLOCKED REASON:</strong> {selectedApp.blocked_reason}
                  </div>
                )}

                {selectedApp.risk_breakdown_json?.factors?.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {selectedApp.risk_breakdown_json.factors.map((fac: any, idx: number) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 flex items-center justify-between">
                        <span>{fac.reason || fac.description}</span>
                        <span className="text-amber-400 font-bold font-mono">+{fac.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Officer Governance Action Controls */}
              <div className="bg-slate-950/70 border border-brand-500/20 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
                  Governance Action Matrix (Revenue Officer Desk)
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedApp.status === 'AUTO_VALIDATED' && (
                    <>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'APPROVED', 'Officer verified all automated checks')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Approve Mutation
                      </button>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'FIELD_VERIFICATION', 'Officer requested on-ground spot survey')}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Dispatch Field Surveyor
                      </button>
                    </>
                  )}

                  {selectedApp.status === 'OFFICER_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'FIELD_VERIFICATION', 'Field verification dispatched to resolve flags')}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Dispatch Field Surveyor
                      </button>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'APPROVED', 'Officer manually cleared flagged risk items')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Override & Approve
                      </button>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'REJECTED', 'Application rejected due to conflicting claims')}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Reject Application
                      </button>
                    </>
                  )}

                  {selectedApp.status === 'FIELD_VERIFICATION' && (
                    <>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'APPROVED', 'Field report satisfactory, boundary confirmed')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Approve after Field Verification
                      </button>
                      <button
                        onClick={() => handleTransition(selectedApp.id, 'REJECTED', 'Field surveyor noted boundary violation')}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        Reject Application
                      </button>
                    </>
                  )}

                  {selectedApp.status === 'APPROVED' && (
                    <button
                      onClick={() => handleTransition(selectedApp.id, 'RECORD_UPDATED', 'Finalize RoR 1B record and bump parcel version')}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Finalize & Update RoR Record
                    </button>
                  )}

                  {selectedApp.status === 'RECORD_UPDATED' && (
                    <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      RoR 1B updated in database. New Pattadar title activated.
                    </div>
                  )}

                  {selectedApp.status === 'BLOCKED' && (
                    <div className="text-rose-400 font-bold text-xs flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4" />
                      Application blocked by legal restraints. Transfer cannot proceed.
                    </div>
                  )}
                </div>
              </div>

              {/* Event Transition Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Mutation Transition Audit Log</h4>
                <div className="space-y-2">
                  {selectedApp.events?.map((ev: any) => (
                    <div key={ev.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-slate-200">
                          {ev.from_status} ➔ <span className="text-brand-400">{ev.to_status}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">{ev.reason}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">Actor: {ev.actor_id}</div>
                      </div>
                      <span className="text-slate-500 text-[10px] whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select an application from the list to review details.
            </div>
          )}
        </div>
      </div>

      {/* New Mutation Submission Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Submit New Mutation Application
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMutation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Parcel ULPIN</label>
                <input
                  type="text"
                  placeholder="Enter 14-char ULPIN (e.g. TS7A2K91M4P6X8)"
                  value={formUlpin}
                  onChange={(e) => setFormUlpin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 font-mono text-slate-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Applicant Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Citizen ID (Aadhaar / PAN)</label>
                  <input
                    type="text"
                    value={applicantId}
                    onChange={(e) => setApplicantId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
                Upon submission, the GeoDhara rule engine will automatically verify encumbrances, active litigation, registered deed parity, and satellite alerts.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Evaluating Rules...' : 'Submit Mutation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
