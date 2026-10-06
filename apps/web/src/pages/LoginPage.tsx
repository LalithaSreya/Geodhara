import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';
import { ShieldCheck, Lock, User, CheckCircle2, ArrowRight, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithCredentials, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'officer' as UserRole,
      title: 'Tahsildar / Revenue Officer',
      email: 'officer@geodhara.demo',
      desc: 'Approves mutations, reviews risk flags, and manages state jurisdiction.',
      badge: 'OFFICER ACCESS',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      redirect: '/officer',
    },
    {
      role: 'citizen' as UserRole,
      title: 'Citizen / Land Owner',
      email: 'citizen@geodhara.demo',
      desc: 'Views 360° parcel dossiers, tracks title history, and submits mutations.',
      badge: 'CITIZEN PORTAL',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      redirect: '/dashboard',
    },
    {
      role: 'field_officer' as UserRole,
      title: 'Field Surveyor / Inspector',
      email: 'field@geodhara.demo',
      desc: 'Conducts ground inspections, captures geotagged photos, and syncs offline.',
      badge: 'FIELD PWA',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      redirect: '/field',
    },
    {
      role: 'admin' as UserRole,
      title: 'System Administrator',
      email: 'admin@geodhara.demo',
      desc: 'Oversees cryptographic audit ledger, system health, and cross-state sync.',
      badge: 'ADMIN OVERSIGHT',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      redirect: '/admin',
    },
  ];

  const handleSelectDemo = async (acc: typeof demoAccounts[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      await switchDemoRole(acc.role);
      navigate(acc.redirect);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);
    try {
      await loginWithCredentials(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          GeoDhara Authentication Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Role-Based Access Control (RBAC) supporting Citizens, Revenue Officers, Field Surveyors, and Administrators.
        </p>
      </div>

      {/* Demo Fast-Persona Switcher (Recommended for Jury) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Fast Demo Persona Selector (1-Click Authentication):</span>
          <span className="text-[11px] text-emerald-400 font-semibold">SIH 2026 Competition Mode</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demoAccounts.map((acc) => (
            <div
              key={acc.role}
              onClick={() => handleSelectDemo(acc)}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 cursor-pointer transition shadow-xl space-y-3 group hover:bg-slate-900/90"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${acc.badgeColor}`}>
                  {acc.badge}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {acc.title}
                </h3>
                <p className="text-xs font-mono text-slate-400">{acc.email}</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{acc.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Form */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-md mx-auto space-y-4 shadow-xl">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider text-center border-b border-slate-800 pb-2">
          Manual Credential Login
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. officer@geodhara.demo"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Sign In with JWT
          </button>
        </form>
      </div>
    </div>
  );
};
