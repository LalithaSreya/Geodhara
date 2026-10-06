import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { 
  Award, 
  Sparkles, 
  Map, 
  FileText, 
  Lock, 
  Satellite, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Database,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const DemoGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);

  const mutationScenarios = [
    {
      id: 'SCENARIO_A',
      title: 'Scenario A: Clean Mutation Workflow',
      tag: 'PASS → AUTO_VALIDATED → OFFICER APPROVAL',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      desc: 'Simulates a clear title parcel with 0 encumbrances, 0 litigation, matching seller, and clean area. Automatically passes 11 rules and transitions cleanly to Record of Rights update.',
      ulpin: 'TSQXY9QM4KNXSZ',
      actionText: 'Execute Clean Workflow Demo',
      run: async () => {
        setRunningScenario('SCENARIO_A');
        try {
          const parcelRes = await api.getParcel360('TSQXY9QM4KNXSZ');
          const p = parcelRes.data.parcel;
          const regRes = await api.createRegistration({
            parcelId: p.id,
            documentNumber: `DOC-SALE-${Date.now().toString().slice(-4)}`,
            seller: parcelRes.data.ownership.current_owners[0]?.person_name || 'Ramesh Kumar',
            buyer: 'Vanga Nishith Reddy',
            buyerIdNumber: 'ID-CIT-8899',
            registeredAreaSqm: parseFloat(p.area_sqm),
            considerationAmount: 4500000,
          });
          const app = regRes.data.mutation_application;
          setScenarioResult({
            id: 'SCENARIO_A',
            title: 'Scenario A: Clean Title Mutation Executed',
            appNumber: app.application_number,
            status: app.status,
            riskScore: app.risk_score,
            message: 'Registration created & auto-validated with 0 risk. Ready for Tahsildar approval.',
            link: `/officer/mutation/${app.id}`,
          });
        } catch (err: any) {
          alert(`Scenario error: ${err.message}`);
        } finally {
          setRunningScenario(null);
        }
      },
    },
    {
      id: 'SCENARIO_B',
      title: 'Scenario B: Active Encumbrance / Court Stay',
      tag: 'FAIL → AUTO-BLOCKED',
      color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      desc: 'Simulates a mutation attempt on a parcel with an active judicial stay in Case OS/2023/4412. The rule engine halts the pipeline immediately with status BLOCKED.',
      ulpin: 'TSSMSR2Z03QTQD',
      actionText: 'Execute Encumbered Block Demo',
      run: async () => {
        setRunningScenario('SCENARIO_B');
        try {
          const parcelRes = await api.getParcel360('TSSMSR2Z03QTQD');
          const p = parcelRes.data.parcel;
          const appRes = await api.submitMutation({
            parcelId: p.id,
            applicant: {
              name: 'S. K. Verma',
              id_number: 'ID-CIT-9900',
              phone: '+91-9876543210',
            },
          });
          const app = appRes.data;
          setScenarioResult({
            id: 'SCENARIO_B',
            title: 'Scenario B: Judicial Stay Auto-Blocked',
            appNumber: app.application_number,
            status: app.status,
            riskScore: app.risk_score,
            message: `Pipeline halted: ${app.blocked_reason || 'Active court stay blocks mutation.'}`,
            link: `/officer/mutation/${app.id}`,
          });
        } catch (err: any) {
          alert(`Scenario error: ${err.message}`);
        } finally {
          setRunningScenario(null);
        }
      },
    },
    {
      id: 'SCENARIO_C',
      title: 'Scenario C: Seller Title Mismatch',
      tag: 'FAIL → AUTO-BLOCKED',
      color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      desc: 'Simulates a fraudulent or mistaken deed where the seller name on the deed does not match the verified Pattadar on file. The rule engine auto-blocks the application.',
      ulpin: 'TS1EZQMU38RE38',
      actionText: 'Execute Seller Mismatch Demo',
      run: async () => {
        setRunningScenario('SCENARIO_C');
        try {
          const parcelRes = await api.getParcel360('TS1EZQMU38RE38');
          const p = parcelRes.data.parcel;
          const appRes = await api.submitMutation({
            parcelId: p.id,
            sellerName: 'Unauthorized Impersonator',
            applicant: {
              name: 'Innocent Transferee',
              id_number: 'ID-CIT-1234',
              phone: '+91-9876543210',
            },
          });
          const app = appRes.data;
          setScenarioResult({
            id: 'SCENARIO_C',
            title: 'Scenario C: Seller Mismatch Auto-Blocked',
            appNumber: app.application_number,
            status: app.status,
            riskScore: app.risk_score,
            message: `Pipeline halted: ${app.blocked_reason || 'Seller does not match current registered owner.'}`,
            link: `/officer/mutation/${app.id}`,
          });
        } catch (err: any) {
          alert(`Scenario error: ${err.message}`);
        } finally {
          setRunningScenario(null);
        }
      },
    },
    {
      id: 'SCENARIO_D',
      title: 'Scenario D: Duplicate Registration / Churn',
      tag: 'WARNING → FLAGGED FOR OFFICER REVIEW',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
      desc: 'Simulates rapid successive registrations on the same parcel within 180 days. The rule engine flags the application for officer adjudication with medium risk without auto-blocking.',
      ulpin: 'TS9NTJH8MYKGDE',
      actionText: 'Execute Churn Flag Demo',
      run: async () => {
        setRunningScenario('SCENARIO_D');
        try {
          const parcelRes = await api.getParcel360('TS9NTJH8MYKGDE');
          const p = parcelRes.data.parcel;
          const appRes = await api.submitMutation({
            parcelId: p.id,
            sellerName: parcelRes.data.ownership.current_owners[0]?.person_name || 'Owner',
            applicant: {
              name: 'Quick Flipping Buyer',
              id_number: 'ID-CIT-4411',
              phone: '+91-9876543210',
            },
          });
          const app = appRes.data;
          setScenarioResult({
            id: 'SCENARIO_D',
            title: 'Scenario D: Churn Flagged for Officer Review',
            appNumber: app.application_number,
            status: app.status,
            riskScore: app.risk_score,
            message: 'Application flagged due to rapid ownership churn. Routed to Tahsildar adjudication.',
            link: `/officer/mutation/${app.id}`,
          });
        } catch (err: any) {
          alert(`Scenario error: ${err.message}`);
        } finally {
          setRunningScenario(null);
        }
      },
    },
    {
      id: 'SCENARIO_E',
      title: 'Scenario E: Field Verification Required',
      tag: 'ROUTE → FIELD_VERIFICATION → PWA SYNC',
      color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
      desc: 'Demonstrates a parcel with boundary discrepancies or satellite change alerts dispatched to a field inspector, verified on ground with GPS geotags, and approved.',
      ulpin: 'TSHUK8ZNXG7QVJ',
      actionText: 'Inspect Field Workflow Demo',
      run: async () => {
        navigate('/field');
      },
    },
  ];

  const checkpoints = [
    {
      step: '01',
      title: 'ULPIN-Centric Identity & 360° Digital Parcel Dossier',
      ulpin: 'TSQXY9QM4KNXSZ',
      desc: 'Verify that an opaque 14-char ULPIN resolves 11 sub-ledgers (Owners, RoR 1B, SRO Deeds, Encumbrances, Litigation, Zoning, Risk Score, Satellite Alerts, Audit).',
      link: '/parcel/TSQXY9QM4KNXSZ',
      action: 'Open 360° Dossier',
      tag: 'CLEAN TITLE',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
    {
      step: '02',
      title: 'Active Encumbrance & Mortgage Restraint',
      ulpin: 'TSZQ5STGR65JMU',
      desc: 'Verify that an agricultural term loan mortgage registered by State Bank of India is prominently flagged and raises parcel risk score.',
      link: '/parcel/TSZQ5STGR65JMU',
      action: 'Inspect Encumbrance',
      tag: 'SBI MORTGAGE',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    {
      step: '03',
      title: 'Judicial Title Dispute & Court Stay Injunction',
      ulpin: 'TSSMSR2Z03QTQD',
      desc: 'Verify that active court injunction in Case OS/2023/4412 (Senior Civil Judge Medchal) blocks mutation attempts automatically.',
      link: '/parcel/TSSMSR2Z03QTQD',
      action: 'Inspect Court Stay',
      tag: 'STAY ORDER',
      color: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    },
    {
      step: '04',
      title: 'Cross-State Interoperability (Karnataka Bhoomi RTC)',
      ulpin: 'KAQMWVSBJHWXC7',
      desc: 'Verify that Karnataka Bhoomi RTC terms (Hissa, Khatedar, Taluk) normalize seamlessly into the standard GeoDhara schema.',
      link: '/parcel/KAQMWVSBJHWXC7',
      action: 'Inspect Bhoomi Parcel',
      tag: 'KARNATAKA BHOOMI',
      color: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
    },
    {
      step: '05',
      title: 'AI Satellite Change Detection (NDVI Vegetation Loss)',
      ulpin: 'TSHUK8ZNXG7QVJ',
      desc: 'Verify automated satellite differencing alerts flagging vegetation clearance, prompting ground surveyor verification.',
      link: '/parcel/TSHUK8ZNXG7QVJ',
      action: 'View Satellite Alert',
      tag: 'AI CHANGE ALERT',
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    },
    {
      step: '06',
      title: 'Double-Registration & Ownership Churn Detection',
      ulpin: 'TS9NTJH8MYKGDE',
      desc: 'Verify rule-engine detection of multiple deed registrations recorded against the same parcel within 180 days.',
      link: '/parcel/TS9NTJH8MYKGDE',
      action: 'Inspect Churn',
      tag: 'CHURN DETECTED',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    },
    {
      step: '07',
      title: 'Legacy Survey → ULPIN Mapping Pipeline',
      desc: 'Demonstrate deterministic transition: Legacy Identifier (TS-LEG-1000) ↓ Mapped ULPIN ↓ Unified 360° Parcel.',
      link: '/search',
      action: 'Open Resolver',
      tag: 'MAPPING ENGINE',
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
    },
    {
      step: '08',
      title: 'Cryptographic SHA-256 Ledger & Live Tamper Test',
      desc: 'Inspect monotonic hash-chained audit trail and trigger the mathematical verification algorithm.',
      link: '/audit',
      action: 'Verify Hash Chain',
      tag: 'IMMUTABLE AUDIT',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
          <Award className="w-4 h-4" /> Smart India Hackathon 2026 Jury Demonstration Guide
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          GeoDhara Evaluation Walkthrough & Planted Cases
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Problem Statement PS 26014 requires a unified GIS-based digital public infrastructure for land governance.
          This guide lists the pre-planted competition demo cases across Telangana (Medchal) and Karnataka (Devanahalli).
        </p>
      </div>

      {/* 5 Mutation Governance Scenarios Showcase */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">
              Core SIH Differentiator: 5 Mutation Governance Scenarios
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute automated 11-rule evaluations, witness auto-blocks vs officer flags, and adjudicate title transfers.
          </p>
        </div>

        {scenarioResult && (
          <div className="p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">{scenarioResult.title}</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border ${
                scenarioResult.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                scenarioResult.status === 'AUTO_VALIDATED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {scenarioResult.status} (Risk: {scenarioResult.riskScore}/100)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono">{scenarioResult.message}</p>
            <div className="flex items-center gap-3 pt-1">
              <Link
                to={scenarioResult.link}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                Open in Officer Cockpit <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setScenarioResult(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mutationScenarios.map((sc) => (
            <div
              key={sc.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">{sc.id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${sc.color}`}>
                    {sc.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{sc.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.desc}</p>
                <div className="font-mono text-[11px] text-emerald-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  Target: {sc.ulpin}
                </div>
              </div>

              <button
                onClick={sc.run}
                disabled={runningScenario === sc.id}
                className="w-full bg-slate-800 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
              >
                {runningScenario === sc.id ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {sc.actionText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Checkpoints Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
          Platform Architecture & Spatial Verification Checkpoints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checkpoints.map((cp) => (
            <div
              key={cp.step}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-emerald-500/40 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">CHECKPOINT {cp.step}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${cp.color}`}>
                    {cp.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {cp.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">{cp.desc}</p>
                {cp.ulpin && (
                  <div className="font-mono text-xs text-emerald-400 font-bold bg-slate-950 p-2 rounded-lg border border-slate-800">
                    Target ULPIN: {cp.ulpin}
                  </div>
                )}
              </div>

              <Link
                to={cp.link}
                className="w-full bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
              >
                {cp.action} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

