import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  FileText, 
  RefreshCw,
  Sparkles,
  MapPin,
  Send,
  Lock,
  Layers,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { RiskExplainer } from '../components/common/RiskExplainer';

export const OfficerMutationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState<any>(null);
  const [parcel, setParcel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetails = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      if (!id) return;
      const res = await api.getMutationById(id);
      if (res.data) {
        setApplication(res.data);
        const pRes = await api.getParcel360(res.data.ulpin);
        setParcel(pRes.data);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to load mutation application');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this mutation and transfer official cadastral ownership in RoR?')) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      // 1. Transition to APPROVED with optimistic concurrency check
      await api.transitionMutation(
        id!,
        'APPROVED',
        'Tahsildar approved mutation title transfer following statutory verification.',
        application.version
      );
      // 2. Finalize to RECORD_UPDATED
      await api.transitionMutation(
        id!,
        'RECORD_UPDATED',
        'Ownership updated in cadastral registry and certified Record of Rights issued.',
        application.version + 1
      );
      setActionSuccess('Mutation successfully approved! Ownership has been updated in the Record of Rights.');
      await fetchDetails();
    } catch (err: any) {
      if (err.code === 'VERSION_CONFLICT') {
        setActionError('Optimistic Concurrency Conflict: Record was modified by another session. Refreshed latest state.');
        await fetchDetails();
      } else {
        setActionError(err.message || 'Approval failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter statutory reason for refusal.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.transitionMutation(
        id!,
        'REJECTED',
        rejectReason.trim(),
        application.version
      );
      setShowRejectModal(false);
      setActionSuccess('Application rejected with official refusal notice.');
      await fetchDetails();
    } catch (err: any) {
      setActionError(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestField = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.transitionMutation(
        id!,
        'FIELD_VERIFICATION',
        'Officer requested mandatory ground inspection and boundary verification.',
        application.version
      );
      setActionSuccess('Dispatched ground surveyor verification request.');
      await fetchDetails();
    } catch (err: any) {
      setActionError(err.message || 'Field request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnToReview = async () => {
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.transitionMutation(
        id!,
        'OFFICER_REVIEW',
        'Returned to Officer Review for manual adjudication and verification review.',
        application.version
      );
      setActionSuccess('Application moved to Officer Review queue.');
      await fetchDetails();
    } catch (err: any) {
      setActionError(err.message || 'Return to review failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-400" />
        <span className="text-xs font-semibold text-slate-300">Loading adjudication dossier & validation checks...</span>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Application Not Found</h2>
        <Link to="/officer" className="text-xs text-blue-400 hover:underline">
          Return to Officer Queue
        </Link>
      </div>
    );
  }

  const applicant = typeof application.applicant === 'string' ? JSON.parse(application.applicant) : application.applicant;
  const checks = application.live_validation_evaluation?.checks || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link */}
      <Link to="/officer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0B3B60] transition">
        <ArrowLeft className="w-4 h-4" /> Back to Officer Queue
      </Link>

      {/* Cockpit Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-[#0B3B60]" />
              <h1 className="text-xl font-bold text-slate-900">
                Mutation Adjudication Cockpit: {application.application_number}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authority Dashboard: Review automated 11-rule validation checks, adjudicate title disputes, and approve Record of Rights transfer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              v{application.version}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              application.status === 'BLOCKED' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              application.status === 'REJECTED' ? 'bg-rose-100 text-rose-900 border-rose-300' :
              application.status === 'APPROVED' || application.status === 'RECORD_UPDATED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              application.status === 'FIELD_VERIFICATION' ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-blue-50 text-[#0B3B60] border-blue-200'
            }`}>
              {application.status}
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
            <Link
              to="/audit"
              className="px-4 py-1.5 bg-[#0B3B60] hover:bg-[#07263F] text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Cryptographic Audit Ledger →</span>
            </Link>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 6-Stage Visual Timeline */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase mb-3 flex items-center justify-between">
            <span>Statutory Lifecycle Progression</span>
            <span className="text-[10px] text-slate-500 lowercase font-normal">
              (BLOCKED = automated rule stop, REJECTED = officer refusal)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            {[
              { key: 'SUBMITTED', label: '1. Submitted' },
              { key: 'AUTO_VALIDATED', label: '2. Rule Check' },
              { key: 'OFFICER_REVIEW', label: '3. Adjudication' },
              { key: 'FIELD_VERIFICATION', label: '4. Field Survey' },
              { key: 'APPROVED', label: '5. Approved' },
              { key: 'RECORD_UPDATED', label: '6. RoR Updated' },
            ].map((step, idx) => {
              const isCurrent = application.status === step.key;
              const isBlocked = application.status === 'BLOCKED' && idx === 1;
              const isRejected = application.status === 'REJECTED' && idx === 2;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border text-[11px] font-semibold transition ${
                    isBlocked ? 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm' :
                    isRejected ? 'bg-rose-100 text-rose-900 border-rose-300 shadow-sm' :
                    isCurrent ? 'bg-[#0B3B60] text-white border-[#0B3B60] shadow-sm' :
                    'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {isBlocked ? '🛑 2. BLOCKED' : isRejected ? '❌ 3. REJECTED' : step.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 11 Automated Validation Rules Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Automated 11-Rule Governance Engine Evaluation
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
              application.risk_score >= 70 ? 'bg-rose-50 text-rose-800 border-rose-200' :
              application.risk_score >= 25 ? 'bg-amber-50 text-amber-800 border-amber-200' :
              'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              Composite Risk: {application.risk_score}/100
            </span>
          </div>
        </div>

        {application.blocked_reason && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-1">AUTOMATED SYSTEM BLOCK IDENTIFIED:</span>
              <p>{application.blocked_reason}</p>
            </div>
          </div>
        )}

        {/* Explainable Risk Engine Component */}
        <RiskExplainer
          score={application.risk_score || 0}
          breakdown={
            application.validation_results?.risk_factors?.map((f: any) => ({
              rule: f.factor || f.rule || 'RISK_FACTOR',
              points: f.score || f.points || 0,
              reason: f.reason || f.description || '',
              evidence: f.evidence || null,
              severity: f.severity || (f.score >= 30 ? 'HIGH' : f.score >= 15 ? 'MEDIUM' : 'LOW'),
            })) || []
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {checks.map((c: any) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl border text-xs space-y-1 transition ${
                c.status === 'FAIL'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : c.status === 'WARNING'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{c.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                    c.status === 'FAIL'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : c.status === 'WARNING'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">{c.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Adjudication Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applicant & Proposed Transfer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Applicant & Registered Deed Particulars
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Transferee / Applicant:</span>
              <span className="font-bold text-slate-900">{applicant?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Citizen ID:</span>
              <span className="font-mono text-slate-700">{applicant?.id_number || 'ID-CITIZEN'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Target ULPIN:</span>
              <Link to={`/parcel/${application.ulpin}`} className="font-mono text-[#0B3B60] font-bold hover:underline">
                {application.ulpin}
              </Link>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Survey Location:</span>
              <span className="text-slate-700">{application.village}, {application.mandal} ({application.state_code})</span>
            </div>
            {application.registration && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Linked Deed Doc:</span>
                <span className="font-mono text-[#0B3B60] font-bold">{application.registration.document_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Verified Title Holders */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Current Verified Pattadar / Title Holders
          </h3>
          <div className="space-y-2 text-xs">
            {application.current_owners && application.current_owners.length > 0 ? (
              application.current_owners.map((owner: any) => (
                <div key={owner.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{owner.person_name}</span>
                    <span className="text-emerald-700 font-mono">{owner.ownership_percentage}% Share</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>{owner.person_identifier}</span>
                    <span>Type: {owner.ownership_type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                No active ownership records found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Decision Cockpit Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Statutory Revenue Officer Actions</span>
          <span className="text-[11px] text-slate-500">
            All approvals execute transactionally with atomic ownership updates and SHA-256 audit chaining.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {application.status === 'BLOCKED' && (
            <button
              onClick={handleReturnToReview}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-[#0B3B60]" /> Move to Review
            </button>
          )}

          <button
            onClick={handleRequestField}
            disabled={actionLoading || application.status === 'RECORD_UPDATED' || application.status === 'REJECTED'}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" /> Request Field Survey
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading || application.status === 'RECORD_UPDATED' || application.status === 'REJECTED'}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <XCircle className="w-4 h-4" /> Refuse / Reject
          </button>

          <button
            onClick={handleApprove}
            disabled={actionLoading || application.status === 'RECORD_UPDATED' || application.status === 'REJECTED' || application.status === 'BLOCKED'}
            className="px-5 py-2.5 bg-[#0B3B60] hover:bg-[#07263F] disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve & Update RoR
          </button>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">Record Statutory Rejection Grounds</h3>
            <p className="text-xs text-slate-500">
              Provide formal reasons for statutory refusal under Section 5 of the Land Revenue Act.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="State reason for rejecting title transfer (e.g. Unresolved title dispute / Fraudulent deed)..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

