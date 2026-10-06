import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  FileText, 
  Scale, 
  Activity, 
  Clock, 
  Compass, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Satellite, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { RiskExplainer } from '../common/RiskExplainer';

interface ParcelInspectorProps {
  data: any;
  onClose: () => void;
  onOpenMutationForParcel?: (parcel: any) => void;
}

export const ParcelInspector: React.FC<ParcelInspectorProps> = ({
  data,
  onClose,
  onOpenMutationForParcel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'risk' | 'owners' | 'ror' | 'deeds' | 'encumbrance' | 'litigation' | 'mutation' | 'satellite' | 'audit'
  >('overview');

  if (!data || !data.parcel) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
        <p>No parcel selected. Click any parcel on the GIS map or enter a 14-char ULPIN.</p>
      </div>
    );
  }

  const {
    parcel,
    risk_assessment,
    ownership,
    land_records,
    registrations,
    encumbrances,
    litigation,
    land_use,
    mutation_applications,
    satellite_change_alerts,
    field_observations,
    legacy_mappings,
    audit_ledger,
  } = data;

  const riskScore = risk_assessment?.score || 0;
  const riskCategory = risk_assessment?.level || risk_assessment?.category || 'LOW';
  const rawBreakdown = risk_assessment?.breakdown || risk_assessment?.factors || [];
  const riskBreakdown = Array.isArray(rawBreakdown)
    ? rawBreakdown.map((item: any) => ({
        rule: item.rule || item.factor || 'RISK_FACTOR',
        points: item.points ?? item.score ?? 0,
        reason: item.reason || item.description || '',
        severity: item.severity || (item.points >= 30 ? 'HIGH' : item.points >= 15 ? 'MEDIUM' : 'LOW'),
        evidence: item.evidence || {},
      }))
    : rawBreakdown;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full max-h-[750px] overflow-hidden">
      {/* Top Header Card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-50 text-[#0B3B60] font-bold px-2 py-0.5 rounded text-[11px] border border-blue-200">
                DEMO ULPIN
              </span>
              <span className="text-xs text-slate-500 font-medium">
                State: <strong className="text-slate-800">{parcel.state_code}</strong> ({parcel.state_name || (parcel.state_code === 'KA' ? 'Karnataka' : 'Telangana')})
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Version: <strong className="text-slate-800">v{parcel.version || 1}</strong>
              </span>
            </div>

            <h2 className="text-lg font-black font-mono tracking-wider text-slate-900 flex items-center gap-2">
              {parcel.ulpin}
            </h2>

            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#0B3B60]" />
              <span>Survey No: <strong className="text-slate-800">{parcel.legacy_survey_no}</strong></span>
              <span className="text-slate-400">|</span>
              <span>{parcel.village}, {parcel.mandal}, {parcel.district}</span>
            </p>
          </div>

          {/* Risk Badge & Actions */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setActiveSubTab('risk')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm cursor-pointer hover:opacity-90 transition-all ${
                riskScore >= 75
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : riskScore >= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : riskScore >= 25
                  ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Risk: {riskScore}/100 ({riskCategory})</span>
            </button>

            {onOpenMutationForParcel && (
              <button
                onClick={() => onOpenMutationForParcel(parcel)}
                className="bg-[#0B3B60] hover:bg-[#07263F] text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1"
              >
                Apply Mutation
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto border-t border-slate-200 pt-2 text-xs">
          {[
            { id: 'overview', label: '360° Overview' },
            { id: 'risk', label: `Risk Engine (${riskScore}/100)` },
            { id: 'owners', label: `Owners (${ownership?.current_owners?.length || 0})` },
            { id: 'ror', label: `RoR (${land_records?.length || 0})` },
            { id: 'deeds', label: `Deeds (${registrations?.length || 0})` },
            { id: 'encumbrance', label: `Encumbrances (${encumbrances?.length || 0})` },
            { id: 'litigation', label: `Litigation (${litigation?.length || 0})` },
            { id: 'mutation', label: `Mutations (${mutation_applications?.length || 0})` },
            { id: 'satellite', label: `Satellite AI (${satellite_change_alerts?.length || 0})` },
            { id: 'audit', label: 'Hash Ledger' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#0B3B60] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
        {/* OVERVIEW TAB */}
        {activeSubTab === 'overview' && (
          <div className="space-y-4">
            {/* Geodesic Spatial Area Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                <Compass className="w-3.5 h-3.5 text-[#0B3B60]" />
                Cadastral Spatial Geometry & Area Calculation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-[11px]">Recorded Area (RoR)</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {parcel.recorded_area_sqm != null ? Number(parcel.recorded_area_sqm).toLocaleString() : 'N/A'} m²
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {(Number(parcel.recorded_area_sqm || 0) / 4046.86).toFixed(3)} Acres
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
                  <div className="text-slate-500 text-[11px]">PostGIS Geodesic Area</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {parcel.geodesic_area_sqm != null ? Number(parcel.geodesic_area_sqm).toLocaleString() : 'N/A'} m²
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Calculated via ST_Area(geom::geography)
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-slate-500 text-[11px]">Area Discrepancy</div>
                  <div className={`text-sm font-bold mt-0.5 ${(parcel.area_discrepancy_pct || 0) > 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {parcel.area_discrepancy_pct ?? 0}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {(parcel.area_discrepancy_pct || 0) > 5 ? '⚠️ Exceeds 5% tolerance' : '✅ Within tolerance'}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <RiskExplainer
                score={riskScore}
                level={riskCategory}
                breakdown={riskBreakdown}
              />
            </div>

            {/* Legacy System Mapping */}
            {legacy_mappings?.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-[#0B3B60]" />
                  Legacy System Ingestion & Cross-Reference
                </h3>
                {legacy_mappings.map((m: any) => (
                  <div key={m.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-900">{m.legacy_system}</span>
                      <span className="text-slate-500 ml-2">ID: {m.legacy_identifier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.status === 'MATCHED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DEDICATED RISK TAB */}
        {activeSubTab === 'risk' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <RiskExplainer
                score={riskScore}
                level={riskCategory}
                breakdown={riskBreakdown}
              />
            </div>
          </div>
        )}

        {/* OWNERS TAB */}
        {activeSubTab === 'owners' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Pattadar / Ownership Records</h3>
            {ownership?.current_owners?.map((o: any) => (
              <div key={o.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0B3B60]" />
                    {o.person_name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Identifier: <span className="font-mono text-slate-800">{o.person_identifier}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {o.ownership_type} • Valid From: {o.valid_from}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-[#0B3B60] font-mono">
                    {parseFloat(o.ownership_percentage || o.share_percentage || 100).toFixed(2)}%
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    Active Owner
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROR LAND RECORDS */}
        {activeSubTab === 'ror' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Record of Rights (RoR 1B / Pahani)</h3>
            {land_records?.map((r: any) => (
              <div key={r.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{r.record_type} — {r.record_number}</span>
                  <span className="bg-blue-50 text-[#0B3B60] border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {r.status || 'VERIFIED'}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  <strong>Source:</strong> {r.source || 'Revenue Registry'} • <strong>Record Date:</strong> {r.record_date || 'N/A'}
                </div>
                <div className="bg-white p-2 rounded text-[11px] font-mono text-slate-800 border border-slate-200">
                  {JSON.stringify(r.holder_info)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEEDS REGISTRATIONS */}
        {activeSubTab === 'deeds' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Sub-Registrar Registered Deeds</h3>
            {registrations?.map((reg: any) => (
              <div key={reg.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 font-mono">{reg.document_number}</span>
                  <span className="text-emerald-700 font-bold">₹{parseFloat(reg.consideration_amount || 0).toLocaleString()}</span>
                </div>
                <div className="text-slate-700 text-[11px]">
                  <strong>Seller:</strong> {reg.seller} ➔ <strong>Buyer:</strong> {reg.buyer}
                </div>
                <div className="text-slate-500 text-[10px] flex items-center justify-between">
                  <span>Registered Area: {parseFloat(reg.registered_area_sqm || 0).toLocaleString()} m²</span>
                  <span>Date: {reg.registration_date || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ENCUMBRANCES */}
        {activeSubTab === 'encumbrance' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Encumbrances (Mortgages / Liens / Attachments)</h3>
            {encumbrances?.length === 0 ? (
              <p className="text-slate-500">No active encumbrances on this parcel.</p>
            ) : (
              encumbrances.map((e: any) => (
                <div key={e.id} className="bg-amber-50/50 border border-amber-200 p-3 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800">{e.type || e.encumbrance_type || 'ENCUMBRANCE'}</span>
                    <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                      {e.status || 'ACTIVE_LIEN'}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{e.description || 'Statutory encumbrance recorded on land title.'}</p>
                  <div className="text-slate-500 text-[10px]">
                    Authority: {e.authority || e.financial_institution || 'Financial Institution'} • Ref: {e.reference_number || 'N/A'} • Start: {e.start_date || e.registered_date || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LITIGATION */}
        {activeSubTab === 'litigation' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Litigation Cases</h3>
            {litigation?.length === 0 ? (
              <p className="text-slate-500">No active litigation disputes on this parcel.</p>
            ) : (
              litigation.map((l: any) => (
                <div key={l.id} className="bg-rose-50/50 border border-rose-200 p-3 rounded-xl space-y-1 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800">{l.case_number} ({l.case_type || 'CIVIL_SUIT'})</span>
                    <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                      {l.status}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{l.description || l.prohibition_summary || 'Judicial injunction recorded.'}</p>
                  <div className="text-slate-500 text-[10px]">
                    Court: {l.court || l.court_name || 'Senior Civil Court'} • Opened: {l.opened_at || l.stay_order_date || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MUTATION APPLICATIONS */}
        {activeSubTab === 'mutation' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">Mutation Applications & Governance History</h3>
            {mutation_applications?.length === 0 ? (
              <p className="text-slate-500">No mutation applications filed for this parcel yet.</p>
            ) : (
              mutation_applications.map((m: any) => (
                <div key={m.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{m.application_number}</span>
                    <span className="bg-blue-50 text-[#0B3B60] border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {m.status}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    Applicant: {typeof m.applicant === 'string' ? JSON.parse(m.applicant).name : m.applicant?.name}
                  </div>
                  {m.blocked_reason && (
                    <div className="bg-rose-50 border border-rose-200 p-2 rounded text-rose-800 text-[11px]">
                      {m.blocked_reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* SATELLITE AI CHANGES */}
        {activeSubTab === 'satellite' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs">AI Satellite Change Detections</h3>
            {satellite_change_alerts?.length === 0 ? (
              <p className="text-slate-500">No satellite change alerts detected on this parcel.</p>
            ) : (
              satellite_change_alerts.map((a: any) => (
                <div key={a.id} className="bg-yellow-50/50 border border-yellow-200 p-3 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-900 flex items-center gap-1.5">
                      <Satellite className="w-3.5 h-3.5 text-yellow-700" />
                      {a.type || a.change_type || 'SPECTRAL_ALERT'}
                    </span>
                    <span className="bg-yellow-100 text-yellow-900 px-1.5 py-0.5 rounded text-[10px] font-bold border border-yellow-200">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    Confidence: {(((a.confidence || a.confidence_score) ?? 0.85) * 100).toFixed(0)}% • Method: {a.detection_method || 'SENTINEL_2'}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Before: {a.before_date || 'N/A'} ➔ After: {a.after_date || 'N/A'}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AUDIT LEDGER */}
        {activeSubTab === 'audit' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0B3B60]" />
              Cryptographic Audit Chain for Parcel
            </h3>
            {audit_ledger?.map((al: any) => (
              <div key={al.id} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-1 font-mono text-[10px] shadow-sm">
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <span>{al.action}</span>
                  <span className="text-slate-500">{new Date(al.created_at).toLocaleString()}</span>
                </div>
                <div className="text-slate-600">Actor: {al.actor_id}</div>
                <div className="text-slate-500 truncate">Prev: {al.prev_hash}</div>
                <div className="text-emerald-700 truncate font-semibold">Hash: {al.hash}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
