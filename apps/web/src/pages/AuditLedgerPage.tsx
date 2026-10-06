import React from 'react';
import { AuditLedgerViewer } from '../components/audit/AuditLedgerViewer';
import { Lock, ShieldCheck, Database, Award } from 'lucide-react';

export const AuditLedgerPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
              <Lock className="w-3.5 h-3.5" /> Immutable Cryptographic Audit Chain
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Tamper-Evident SHA-256 Hash Chain Ledger
            </h1>
            <p className="text-xs text-slate-600">
              Every parcel creation, deed registration, mutation approval, and attribute update is cryptographically chained.
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Audit Viewer */}
      <AuditLedgerViewer />
    </div>
  );
};
