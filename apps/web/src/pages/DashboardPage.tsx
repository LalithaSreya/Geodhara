import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { 
  User, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  Search, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const citizenParcels = [
    { ulpin: 'TSQXY9QM4KNXSZ', village: 'Medchal', survey: '101/1', area: '14500 m²', status: 'CLEAN', share: '60%' },
    { ulpin: 'TS1EZQMU38RE38', village: 'Medchal', survey: '106/2', area: '8200 m²', status: 'CLEAN', share: '100%' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
              <User className="w-3.5 h-3.5" /> Citizen Land Portfolio
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              Welcome back, {user?.full_name || 'Citizen User'}
            </h1>
            <p className="text-xs text-slate-300">
              Manage your registered land parcels, track pending mutation applications, and download certified Record of Rights copies.
            </p>
          </div>

          <Link
            to="/mutation"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Apply for Mutation
          </Link>
        </div>

        {/* Quick Search */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-400 block mb-2">Search any parcel across India:</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter 14-char ULPIN (e.g. TSQXY9QM4KNXSZ) or Survey Number..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) navigate(`/parcel/${val}`);
                }
              }}
            />
            <button
              onClick={() => navigate('/search')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Land Parcels */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide border-b border-slate-800 pb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" /> Your Verified Registered Land Holdings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {citizenParcels.map((p) => (
            <div
              key={p.ulpin}
              className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 space-y-3 transition shadow group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">{p.ulpin}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {p.status}
                </span>
              </div>

              <div className="text-xs text-slate-300">
                Survey Number: <span className="font-bold text-white">{p.survey}</span> ({p.village})
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between font-mono">
                <span>Total Extent: {p.area}</span>
                <span className="text-emerald-400 font-bold">Ownership: {p.share}</span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <Link
                  to={`/parcel/${p.ulpin}`}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View 360° Record <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
