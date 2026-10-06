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
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    {
      step: '02',
      title: 'Active Encumbrance & Mortgage Restraint',
      ulpin: 'TSZQ5STGR65JMU',
      desc: 'Verify that an agricultural term loan mortgage registered by State Bank of India is prominently flagged and raises parcel risk score.',
      link: '/parcel/TSZQ5STGR65JMU',
      action: 'Inspect Encumbrance',
      tag: 'SBI MORTGAGE',
      color: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      step: '03',
      title: 'Judicial Title Dispute & Court Stay Injunction',
      ulpin: 'TSSMSR2Z03QTQD',
      desc: 'Verify that active court injunction in Case OS/2023/4412 (Senior Civil Judge Medchal) blocks mutation attempts automatically.',
      link: '/parcel/TSSMSR2Z03QTQD',
      action: 'Inspect Court Stay',
      tag: 'STAY ORDER',
      color: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    {
      step: '04',
      title: 'Cross-State Interoperability (Karnataka Bhoomi RTC)',
      ulpin: 'KAQMWVSBJHWXC7',
      desc: 'Verify that Karnataka Bhoomi RTC terms (Hissa, Khatedar, Taluk) normalize seamlessly into the standard GeoDhara schema.',
      link: '/parcel/KAQMWVSBJHWXC7',
      action: 'Inspect Bhoomi Parcel',
      tag: 'KARNATAKA BHOOMI',
      color: 'border-blue-200 bg-blue-50 text-[#0B3B60]',
    },
    {
      step: '05',
      title: 'AI Satellite Change Detection (NDVI Vegetation Loss)',
      ulpin: 'TSHUK8ZNXG7QVJ',
      desc: 'Verify automated satellite differencing alerts flagging vegetation clearance, prompting ground surveyor verification.',
      link: '/parcel/TSHUK8ZNXG7QVJ',
      action: 'View Satellite Alert',
      tag: 'AI CHANGE ALERT',
      color: 'border-purple-200 bg-purple-50 text-purple-800',
    },
    {
      step: '06',
      title: 'Double-Registration & Ownership Churn Detection',
      ulpin: 'TS9NTJH8MYKGDE',
      desc: 'Verify rule-engine detection of multiple deed registrations recorded against the same parcel within 180 days.',
      link: '/parcel/TS9NTJH8MYKGDE',
      action: 'Inspect Churn',
      tag: 'CHURN DETECTED',
      color: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      step: '07',
      title: 'Legacy Survey → ULPIN Mapping Pipeline',
      desc: 'Demonstrate deterministic transition: Legacy Identifier (TS-LEG-1000) ↓ Mapped ULPIN ↓ Unified 360° Parcel.',
      link: '/search',
      action: 'Open Resolver',
      tag: 'MAPPING ENGINE',
      color: 'border-blue-200 bg-blue-50 text-[#0B3B60]',
    },
    {
      step: '08',
      title: 'Cryptographic SHA-256 Ledger & Live Tamper Test',
      desc: 'Inspect monotonic hash-chained audit trail and trigger the mathematical verification algorithm.',
      link: '/audit',
      action: 'Verify Hash Chain',
      tag: 'IMMUTABLE AUDIT',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-[#0B3B60] text-xs font-bold rounded-full">
          <Award className="w-4 h-4" /> Smart India Hackathon 2026 Jury Demonstration Guide
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          GeoDhara Evaluation Walkthrough & Planted Cases
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          Problem Statement PS 26014 requires a unified GIS-based digital public infrastructure for land governance.
          This guide lists the pre-planted competition demo cases across Telangana (Medchal) and Karnataka (Devanahalli).
        </p>
      </div>

      {/* Checkpoints Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-3">
          Platform Architecture & Spatial Verification Checkpoints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checkpoints.map((cp) => (
            <div
              key={cp.step}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-[#0B3B60]/40 transition group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">CHECKPOINT {cp.step}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${cp.color}`}>
                    {cp.tag}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0B3B60] transition">
                  {cp.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cp.desc}</p>
                {cp.ulpin && (
                  <div className="font-mono text-xs text-[#0B3B60] font-bold bg-slate-50 p-2 rounded-lg border border-slate-200">
                    Target ULPIN: {cp.ulpin}
                  </div>
                )}
              </div>

              <Link
                to={cp.link}
                className="w-full bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
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

