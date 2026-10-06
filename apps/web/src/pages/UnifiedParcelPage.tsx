import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { CadastralMap } from '../components/gis/CadastralMap';
import { ParcelInspector } from '../components/gis/ParcelInspector';
import { RoRPdfModal } from '../components/common/RoRPdfModal';
import { 
  MapPin, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  ArrowLeft, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  GitBranch
} from 'lucide-react';

export const UnifiedParcelPage: React.FC = () => {
  const { ulpin } = useParams<{ ulpin: string }>();
  const navigate = useNavigate();

  const [parcelData, setParcelData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRorModal, setShowRorModal] = useState<boolean>(false);

  const fetchParcel = async (targetUlpin: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getParcel360(targetUlpin);
      setParcelData(res.data);
    } catch (err: any) {
      setError(err.message || `Parcel with ULPIN '${targetUlpin}' could not be resolved`);
      setParcelData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ulpin) {
      fetchParcel(ulpin);
    }
  }, [ulpin]);

  const handleSelectParcel = (newUlpin: string) => {
    navigate(`/parcel/${newUlpin}`);
  };

  const handleOpenMutation = (parcel: any) => {
    navigate(`/mutation?ulpin=${parcel.ulpin}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold text-slate-300">
          Resolving Unified 360° Parcel Intelligence for {ulpin}...
        </p>
      </div>
    );
  }

  if (error || !parcelData) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Parcel Resolution Error</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Cadastral Search
        </Link>
      </div>
    );
  }

  const { parcel, risk_assessment, ownership, land_records } = parcelData;
  const riskCategory = risk_assessment?.category || risk_assessment?.level || 'LOW';
  const riskScore = risk_assessment?.score || 0;

  return (
    <div className="space-y-6">
      {/* 360° Header Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/search" className="text-slate-500 hover:text-[#0B3B60] transition">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Unified Digital Public Record
              </span>
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-[#0B3B60] text-[10px] font-bold rounded-full">
                SYNTHETIC DEMO
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-tight">
                {parcel.ulpin}
              </h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                riskCategory === 'CRITICAL' || riskCategory === 'HIGH'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : riskCategory === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                RISK SCORE: {riskScore}/100 ({riskCategory})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowRorModal(true)}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-2 shadow-sm transition"
            >
              <Download className="w-4 h-4 text-[#0B3B60]" />
              Download Demo RoR PDF
            </button>

            <button
              onClick={() => handleOpenMutation(parcel)}
              className="px-4 py-2 bg-[#0B3B60] hover:bg-[#07263F] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
            >
              <FileText className="w-4 h-4" />
              Initiate Mutation
            </button>
          </div>
        </div>

        {/* Location & Area Quick Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Survey / Hissa</span>
            <span className="font-bold text-slate-900 text-sm">{parcel.legacy_survey_no}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Jurisdiction</span>
            <span className="font-medium text-slate-600">{parcel.village}, {parcel.mandal} ({parcel.state_code})</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Cadastral Survey Area</span>
            <span className="font-mono text-emerald-700 font-bold">{parcel.recorded_area_sqm} m²</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">PostGIS Geodesic Area</span>
            <span className="font-mono text-[#0B3B60] font-bold">{parcel.geodesic_area_sqm} m² ({parcel.area_discrepancy_pct}% diff)</span>
          </div>
        </div>
      </div>

      {/* Main 360° Dossier Layout: Map & Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
        {/* Cadastral Map */}
        <div className="lg:col-span-6 h-[720px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <CadastralMap
            onSelectParcel={handleSelectParcel}
            selectedUlpin={parcel.ulpin}
          />
        </div>

        {/* 360° Inspector Tabs */}
        <div className="lg:col-span-6 h-[720px]">
          <ParcelInspector
            data={parcelData}
            onOpenMutationForParcel={handleOpenMutation}
            onClose={() => navigate('/search')}
          />
        </div>
      </div>

      {/* RoR Printable Modal */}
      {showRorModal && (
        <RoRPdfModal
          parcel={parcel}
          owners={ownership?.current_owners || []}
          landRecord={land_records?.[0] || {}}
          onClose={() => setShowRorModal(false)}
        />
      )}
    </div>
  );
};
