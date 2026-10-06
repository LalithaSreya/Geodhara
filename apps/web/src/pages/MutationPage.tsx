import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Search,
  User,
  FileCheck
} from 'lucide-react';

export const MutationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ulpinInput, setUlpinInput] = useState(searchParams.get('ulpin') || 'TSQXY9QM4KNXSZ');
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [isLoadingParcel, setIsLoadingParcel] = useState(false);

  // Form Fields
  const [applicantName, setApplicantName] = useState('Vanga Nishith Reddy');
  const [applicantId, setApplicantId] = useState('AADHAAR-8891-2309');
  const [applicantPhone, setApplicantPhone] = useState('+91 98490 12345');
  const [applicantEmail, setApplicantEmail] = useState(user?.email || 'citizen@geodhara.demo');
  const [selectedDeedId, setSelectedDeedId] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('Registered_Sale_Deed_Scan.pdf');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch target parcel details when ulpinInput changes
  const fetchParcelDetails = async (ulpinToFetch: string) => {
    setIsLoadingParcel(true);
    setError(null);
    try {
      const res = await api.getParcel360(ulpinToFetch.trim());
      setSelectedParcel(res.data);
      if (res.data.registrations && res.data.registrations.length > 0) {
        setSelectedDeedId(res.data.registrations[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Parcel not found');
      setSelectedParcel(null);
    } finally {
      setIsLoadingParcel(false);
    }
  };

  useEffect(() => {
    if (ulpinInput) {
      fetchParcelDetails(ulpinInput);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcel) {
      alert('Please resolve a valid target parcel first.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.submitMutation({
        parcelId: selectedParcel.parcel.id,
        registrationId: selectedDeedId || null,
        applicant: {
          name: applicantName.trim(),
          id_number: applicantId.trim(),
          phone: applicantPhone.trim(),
          email: applicantEmail.trim(),
        },
      });

      setSubmittedApp(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit mutation application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#0B3B60] text-xs font-bold rounded-full shadow-sm">
          <FileText className="w-3.5 h-3.5 text-[#0B3B60]" /> Citizen Title Mutation Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Apply for Digital Land Title Mutation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
          Submit registered deed particulars for automated cadastral rule validation and official transfer in the Record of Rights.
        </p>
      </div>

      {/* Submission Success View */}
      {submittedApp && (
        <div className="bg-white border border-emerald-300 rounded-2xl p-8 shadow-sm space-y-6 animate-in zoom-in-95">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Mutation Application Submitted Successfully!
              </h2>
              <p className="text-xs font-mono text-[#0B3B60] font-bold">
                Application Number: {submittedApp.application_number}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase">Target ULPIN</span>
              <span className="font-bold text-slate-900 text-sm">{selectedParcel.parcel.ulpin}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase">Automated Rule Status</span>
              <span className={`font-bold text-sm ${
                submittedApp.status === 'BLOCKED' ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                {submittedApp.status}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase">Evaluated Risk Score</span>
              <span className="font-bold text-slate-900 text-sm">{submittedApp.risk_score}/100</span>
            </div>
          </div>

          {submittedApp.blocked_reason && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              <div className="font-bold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Automated Rule Block Reason:
              </div>
              <p>{submittedApp.blocked_reason}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <Link
              to={`/parcel/${selectedParcel.parcel.ulpin}`}
              className="px-4 py-2.5 bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs rounded-xl shadow-sm transition"
            >
              View 360° Parcel Record
            </Link>
            <button
              onClick={() => {
                setSubmittedApp(null);
                setUlpinInput('TSQXY9QM4KNXSZ');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      )}

      {/* Main Application Form */}
      {!submittedApp && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Target Parcel Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Step 1: Target Parcel Selection (14-char ULPIN)
              </h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">REQUIRED</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={ulpinInput}
                onChange={(e) => setUlpinInput(e.target.value.toUpperCase())}
                placeholder="Enter 14-char ULPIN (e.g. TSQXY9QM4KNXSZ)..."
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
              />
              <button
                type="button"
                onClick={() => fetchParcelDetails(ulpinInput)}
                className="px-4 py-2 bg-[#0B3B60] hover:bg-[#07263F] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                {isLoadingParcel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Verify Parcel
              </button>
            </div>

            {selectedParcel && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans shadow-sm">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Survey No</span>
                  <span className="font-bold text-slate-900">{selectedParcel.parcel.legacy_survey_no}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Location</span>
                  <span className="text-slate-700">{selectedParcel.parcel.village}, {selectedParcel.parcel.mandal}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Area Extent</span>
                  <span className="text-emerald-700 font-mono font-bold">{selectedParcel.parcel.recorded_area_sqm} m²</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Current Pattadar</span>
                  <span className="text-slate-800 font-bold">{selectedParcel.ownership?.current_owners[0]?.person_name || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Registered Deed Document */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Step 2: SRO Registered Deed Linkage
              </h3>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">REQUIRED</span>
            </div>

            {selectedParcel?.registrations && selectedParcel.registrations.length > 0 ? (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Select Registered Deed Document:</label>
                <select
                  value={selectedDeedId}
                  onChange={(e) => setSelectedDeedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B3B60] font-mono"
                >
                  {selectedParcel.registrations.map((reg: any) => (
                    <option key={reg.id} value={reg.id}>
                      Doc: {reg.document_number} — Buyer: {reg.buyer} (Registered: {reg.registration_date})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
                No recent SRO deed found. System will create a digital direct application.
              </div>
            )}

            {/* Synthetic File Uploader */}
            <div className="border-2 border-dashed border-slate-300 hover:border-[#0B3B60] rounded-xl p-6 text-center space-y-2 bg-slate-50/50 transition cursor-pointer">
              <UploadCloud className="w-8 h-8 text-[#0B3B60] mx-auto" />
              <div className="text-xs font-bold text-slate-900">Upload Certified Sale Deed Scan / Encumbrance Certificate</div>
              <p className="text-[11px] text-slate-500">PDF, JPG, or TIFF up to 10MB (Demo document will be simulated)</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-emerald-700 text-xs font-mono font-bold shadow-sm">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> {uploadedFileName}
              </div>
            </div>
          </div>

          {/* Step 3: Applicant Particulars */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-3">
              Step 3: New Transferee (Applicant) Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Government ID (Aadhaar / Voter ID)</label>
                <input
                  type="text"
                  value={applicantId}
                  onChange={(e) => setApplicantId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Phone (for SMS alerts)</label>
                <input
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#0B3B60] focus:ring-1 focus:ring-[#0B3B60]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !selectedParcel}
              className="px-8 py-3 bg-[#0B3B60] hover:bg-[#07263F] disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Submit Mutation Application
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
