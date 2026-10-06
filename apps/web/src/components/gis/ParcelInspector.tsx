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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
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
  const riskBreakdown = risk_assessment?.breakdown || risk_assessment?.factors || [];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-full max-h-[750px] overflow-hidden backdrop-blur-md">
      {/* Top Header Card */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-brand-500/20 text-brand-400 font-bold px-2 py-0.5 rounded text-[11px] border border-brand-500/30">
                DEMO ULPIN
              </span>
              <span className="text-xs text-slate-400 font-medium">
                State: <strong className="text-slate-200">{parcel.state_code}</strong> ({parcel.state_name})
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">
                Version: <strong className="text-slate-200">v{parcel.version}</strong>
              </span>
            </div>

            <h2 className="text-lg font-black font-mono tracking-wider text-slate-100 flex items-center gap-2">
              {parcel.ulpin}
            </h2>

            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-brand-400" />
              <span>Survey No: <strong className="text-slate-200">{parcel.legacy_survey_no}</strong></span>
              <span className="text-slate-600">|</span>
              <span>{parcel.village}, {parcel.mandal}, {parcel.district}</span>
            </p>
          </div>

          {/* Risk Badge & Actions */}
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => setActiveSubTab('risk')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm cursor-pointer hover:opacity-90 transition-all ${
                riskScore >= 75
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : riskScore >= 50
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : riskScore >= 25
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Risk: {riskScore}/100 ({riskCategory})</span>
            </button>

            {onOpenMutationForParcel && (
              <button
                onClick={() => onOpenMutationForParcel(parcel)}
                className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-md transition-all flex items-center gap-1"
              >
                Apply Mutation
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto border-t border-slate-800/80 pt-2 text-xs">
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
                  ? 'bg-slate-800 text-brand-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
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
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
                <Compass className="w-3.5 h-3.5 text-brand-400" />
                Cadastral Spatial Geometry & Area Calculation
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Recorded Area (RoR)</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5">
                    {parcel.recorded_area_sqm.toLocaleString()} m²
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {(parcel.recorded_area_sqm / 4046.86).toFixed(3)} Acres
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">PostGIS Geodesic Area</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {parcel.geodesic_area_sqm.toLocaleString()} m²
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Calculated via ST_Area(geom::geography)
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-slate-400 text-[11px]">Area Discrepancy</div>
                  <div className={`text-sm font-bold mt-0.5 ${parcel.area_discrepancy_pct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {parcel.area_discrepancy_pct}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {parcel.area_discrepancy_pct > 5 ? '⚠️ Exceeds 5% tolerance' : '✅ Within tolerance'}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <RiskExplainer
                score={riskScore}
                level={riskCategory}
                breakdown={riskBreakdown}
              />
            </div>

            {/* Legacy System Mapping */}
            {legacy_mappings?.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <h3 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  Legacy System Ingestion & Cross-Reference
                </h3>
                {legacy_mappings.map((m: any) => (
                  <div key={m.id} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-200">{m.legacy_system}</span>
                      <span className="text-slate-400 ml-2">ID: {m.legacy_identifier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Confidence: {(m.confidence * 100).toFixed(0)}%</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${m.status === 'MATCHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
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
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
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
            <h3 className="font-bold text-slate-200 text-xs">Pattadar / Ownership Records</h3>
            {ownership?.current_owners?.map((o: any) => (
              <div key={o.id} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-400" />
                    {o.person_name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Identifier: <span className="font-mono text-slate-300">{o.person_identifier}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {o.ownership_type} • Valid From: {o.valid_from}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-brand-400 font-mono">
                    {parseFloat(o.ownership_percentage).toFixed(2)}%
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
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
            <h3 className="font-bold text-slate-200 text-xs">Record of Rights (RoR 1B / Pahani)</h3>
            {land_records?.map((r: any) => (
              <div key={r.id} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100">{r.record_type} — {r.record_number}</span>
                  <span className="bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {r.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  <strong>Source:</strong> {r.source} • <strong>Record Date:</strong> {r.record_date}
                </div>
                <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300">
                  {JSON.stringify(r.holder_info)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEEDS REGISTRATIONS */}
        {activeSubTab === 'deeds' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs">Sub-Registrar Registered Deeds</h3>
            {registrations?.map((reg: any) => (
              <div key={reg.id} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 font-mono">{reg.document_number}</span>
                  <span className="text-emerald-400 font-bold">₹{parseFloat(reg.consideration_amount).toLocaleString()}</span>
                </div>
                <div className="text-slate-300 text-[11px]">
                  <strong>Seller:</strong> {reg.seller} ➔ <strong>Buyer:</strong> {reg.buyer}
                </div>
                <div className="text-slate-500 text-[10px] flex items-center justify-between">
                  <span>Registered Area: {parseFloat(reg.registered_area_sqm).toLocaleString()} m²</span>
                  <span>Date: {reg.registration_date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ENCUMBRANCES */}
        {activeSubTab === 'encumbrance' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs">Encumbrances (Mortgages / Liens / Attachments)</h3>
            {encumbrances?.length === 0 ? (
              <p className="text-slate-400">No active encumbrances on this parcel.</p>
            ) : (
              encumbrances.map((e: any) => (
                <div key={e.id} className="bg-slate-950/70 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{e.type}</span>
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {e.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{e.description}</p>
                  <div className="text-slate-500 text-[10px]">
                    Authority: {e.authority} • Ref: {e.reference_number} • Start: {e.start_date}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* LITIGATION */}
        {activeSubTab === 'litigation' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs">Litigation Cases</h3>
            {litigation?.length === 0 ? (
              <p className="text-slate-400">No active litigation disputes on this parcel.</p>
            ) : (
              litigation.map((l: any) => (
                <div key={l.id} className="bg-slate-950/70 border border-rose-500/30 p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400">{l.case_number} ({l.case_type})</span>
                    <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {l.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{l.description}</p>
                  <div className="text-slate-500 text-[10px]">
                    Court: {l.court} • Opened: {l.opened_at}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MUTATION APPLICATIONS */}
        {activeSubTab === 'mutation' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs">Mutation Applications & Governance History</h3>
            {mutation_applications?.length === 0 ? (
              <p className="text-slate-400">No mutation applications filed for this parcel yet.</p>
            ) : (
              mutation_applications.map((m: any) => (
                <div key={m.id} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 font-mono">{m.application_number}</span>
                    <span className="bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded text-[10px] font-bold">
                      {m.status}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Applicant: {typeof m.applicant === 'string' ? JSON.parse(m.applicant).name : m.applicant?.name}
                  </div>
                  {m.blocked_reason && (
                    <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded text-rose-300 text-[11px]">
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
            <h3 className="font-bold text-slate-200 text-xs">AI Satellite Change Detections</h3>
            {satellite_change_alerts?.length === 0 ? (
              <p className="text-slate-400">No satellite change alerts detected on this parcel.</p>
            ) : (
              satellite_change_alerts.map((a: any) => (
                <div key={a.id} className="bg-slate-950/70 border border-yellow-500/30 p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-yellow-400 flex items-center gap-1.5">
                      <Satellite className="w-3.5 h-3.5" />
                      {a.type}
                    </span>
                    <span className="bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      {a.status}
                    </span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Confidence: {(a.confidence * 100).toFixed(0)}% • Method: {a.detection_method}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    Before: {a.before_date} ➔ After: {a.after_date}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* AUDIT LEDGER */}
        {activeSubTab === 'audit' && (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-400" />
              Cryptographic Audit Chain for Parcel
            </h3>
            {audit_ledger?.map((al: any) => (
              <div key={al.id} className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg space-y-1 font-mono text-[10px]">
                <div className="flex items-center justify-between text-slate-200 font-bold">
                  <span>{al.action}</span>
                  <span className="text-slate-500">{new Date(al.created_at).toLocaleString()}</span>
                </div>
                <div className="text-slate-400">Actor: {al.actor_id}</div>
                <div className="text-slate-500 truncate">Prev: {al.prev_hash}</div>
                <div className="text-emerald-400 truncate font-semibold">Hash: {al.hash}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
