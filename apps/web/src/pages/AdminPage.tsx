import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DpiOverview } from '../components/stats/DpiOverview';
import { ShieldCheck, Database, Users, Server, Activity, RefreshCw } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full">
              <Server className="w-3.5 h-3.5" /> DPI System Administration & Architecture
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              GeoDhara Infrastructure Governance Cockpit
            </h1>
            <p className="text-xs text-slate-300">
              Platform telemetry, PostgreSQL/PostGIS connection status, Redis cache health, and cross-state sync metrics.
            </p>
          </div>
        </div>
      </div>

      <DpiOverview />
    </div>
  );
};
