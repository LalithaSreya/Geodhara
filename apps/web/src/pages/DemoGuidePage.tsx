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

