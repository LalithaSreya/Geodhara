import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Lock, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  FileCode, 
  CheckCircle2, 
  Hash,
  Clock,
  Layers
} from 'lucide-react';

export const AuditLedgerViewer: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLedger(100, 0);
      setEntries(res.data.entries);
      const verifyRes = await api.verifyAuditChain();
      setVerificationResult(verifyRes.data);
    } catch (err) {
      console.error('Failed to load audit ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const verifyRes = await api.verifyAuditChain();
      setVerificationResult(verifyRes.data);
    } finally {
      setIsVerifying(false);
    }
  };

  const filtered = entries.filter((e) => {
    if (filterEntity === 'ALL') return true;
    return e.entity_type === filterEntity;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner with Cryptographic Integrity Status */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0B3B60]" />
              Cryptographic Tamper-Evident Audit Ledger
            </h2>
            {verificationResult && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border shadow-sm ${
                verificationResult.is_valid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {verificationResult.is_valid ? 'Chain Valid & Tamper-Free' : 'INTEGRITY VIOLATION DETECTED'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable SHA-256 hash chaining (prev_hash + payload) ensuring complete non-repudiation of land governance operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="bg-[#0B3B60] hover:bg-[#07263F] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            Verify Cryptographic Chain ({verificationResult?.chain_length || entries.length} Blocks)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-600 mr-1">Filter Entity:</span>
          {['ALL', 'PARCEL', 'MUTATION_APPLICATION', 'FIELD_OBSERVATION', 'CHANGE_ALERT', 'SYSTEM'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterEntity(type)}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-all ${
                filterEntity === type
                  ? 'bg-[#0B3B60] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <span className="text-slate-500 font-mono text-[11px]">{filtered.length} entries shown</span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Previous Hash Pointer</th>
                <th className="py-3 px-4">Cryptographic Hash (SHA-256)</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Loading blockchain-style hash ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No audit records matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isExpanded = expandedEntryId === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                            {entry.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#0B3B60] font-sans font-semibold">
                          {entry.entity_type}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-sans">
                          {entry.actor_id}
                        </td>
                        <td className="py-2.5 px-4 text-[10px] text-slate-500 max-w-[140px] truncate" title={entry.prev_hash}>
                          {entry.prev_hash.slice(0, 16)}...
                        </td>
                        <td className="py-2.5 px-4 text-[10px] text-emerald-700 font-semibold max-w-[140px] truncate" title={entry.hash}>
                          {entry.hash.slice(0, 16)}...
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                            className="text-[#0B3B60] hover:underline font-sans text-[11px] font-semibold"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
                              <div className="flex items-center justify-between text-[11px] font-sans">
                                <span className="font-bold text-slate-900">Full Cryptographic Audit Payload</span>
                                <span className="text-slate-500 font-mono">ID: {entry.id}</span>
                              </div>
                              <pre className="bg-slate-900 p-3 rounded-lg text-emerald-400 text-[11px] overflow-x-auto">
                                {JSON.stringify(entry.payload_json, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
