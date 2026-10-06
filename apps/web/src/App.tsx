import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StateJurisdictionProvider } from './context/StateJurisdictionContext';
import { DemoNoticeBanner } from './components/common/DemoNoticeBanner';
import { Navbar } from './components/common/Navbar';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Step Gateways & Role Dashboards
import { StateSelectionGateway } from './components/gateway/StateSelectionGateway';
import { RoleSelectionGateway } from './components/gateway/RoleSelectionGateway';
import { RoleDashboardRouter } from './pages/dashboards/RoleDashboardRouter';

// Page Views
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { UnifiedParcelPage } from './pages/UnifiedParcelPage';
import { MutationPage } from './pages/MutationPage';
import { OfficerDashboardPage } from './pages/OfficerDashboardPage';
import { OfficerMutationReviewPage } from './pages/OfficerMutationReviewPage';
import { FieldSurveyorPage } from './pages/FieldSurveyorPage';
import { ChangeAlertsPage } from './pages/ChangeAlertsPage';
import { AuditLedgerPage } from './pages/AuditLedgerPage';
import { AdminPage } from './pages/AdminPage';
import { DemoGuidePage } from './pages/DemoGuidePage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user } = useAuth();
  // In demo environment, user is always active; role-checking can be soft or strict
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const MainApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#0B3B60] selection:text-white">
      {/* 1. Mandatory Demo Notice Banner */}
      <DemoNoticeBanner />

      {/* 2. Main Navigation Header */}
      <Navbar />

      {/* 3. Dynamic Router Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <ErrorBoundary fallbackTitle="View Navigation Interruption">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/select-state" element={<StateSelectionGateway />} />
            <Route path="/select-role" element={<RoleSelectionGateway />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Personalized Modular Role Dashboard */}
            <Route path="/dashboard" element={<RoleDashboardRouter />} />
            <Route path="/citizen" element={<RoleDashboardRouter />} />
            <Route path="/legacy-dashboard" element={<DashboardPage />} />
            
            <Route path="/search" element={<SearchPage />} />
            <Route path="/parcel/:ulpin" element={<UnifiedParcelPage />} />
            
            {/* Mutation Workflow */}
            <Route path="/mutation" element={<MutationPage />} />
            <Route path="/mutation/:id" element={<MutationPage />} />

            {/* Revenue Officer Adjudication Portal */}
            <Route path="/officer" element={<OfficerDashboardPage />} />
            <Route path="/officer/mutation/:id" element={<OfficerMutationReviewPage />} />

            {/* Field Surveyor Studio (Offline PWA) */}
            <Route path="/field" element={<FieldSurveyorPage />} />

            {/* AI Satellite Change Hub */}
            <Route path="/change-alerts" element={<ChangeAlertsPage />} />

            {/* Cryptographic SHA-256 Audit Ledger */}
            <Route path="/audit" element={<AuditLedgerPage />} />

            {/* Administration & Telemetry */}
            <Route path="/admin" element={<AdminPage />} />

            {/* SIH 2026 Competition Jury Demo Guide */}
            <Route path="/demo-guide" element={<DemoGuidePage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Government of India Official Portal Footer */}
      <footer className="border-t-2 border-slate-200 bg-white text-slate-600 mt-auto">
        <div className="bg-[#0B3B60] py-3 text-white text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-4">
              <span className="font-semibold tracking-wide">National Land Records Modernization Programme (DILRMP)</span>
              <span className="text-white/40">|</span>
              <span className="text-white/80">Department of Land Resources (DoLR), MoRD, GoI</span>
            </div>
            <div className="flex items-center gap-4 text-white/90 text-[11px]">
              <span className="bg-emerald-600/80 px-2 py-0.5 rounded text-white font-mono font-medium">ULPIN / Bhu-Aadhaar Standard</span>
              <span>ISO 19152 LADM Aligned</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">About GeoDhara</h5>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                A federated Digital Public Infrastructure (DPI) establishing a single source of spatial and legal truth across Indian state revenue boundaries.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">Integrated State Systems</h5>
              <ul className="space-y-1 text-slate-500 text-[11px]">
                <li>Karnataka — Bhoomi Revenue Engine</li>
                <li>Telangana — Dharani Portal Adapter</li>
                <li>Maharashtra — Mahabhulekh & e-Ferfar</li>
                <li>Interoperable Bhu-Aadhaar 14-digit ULPIN</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">Compliance & Standards</h5>
              <ul className="space-y-1 text-slate-500 text-[11px]">
                <li>SHA-256 Tamper-Evident Ledger</li>
                <li>Copernicus Sentinel-2 & ISRO Cartosat Data</li>
                <li>GIGW 3.0 Guidelines for Indian Govt Websites</li>
                <li>DPDP Act 2023 Compliant Citizen Privacy</li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">Hackathon Edition</h5>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                <strong className="text-slate-700">Smart India Hackathon 2026</strong><br />
                Problem Statement: <strong>PS 26014</strong><br />
                Prototype Demonstration Environment with simulated land records.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
            <p>© 2026 Ministry of Rural Development / National Informatics Centre (NIC). Designed for SIH 2026 PS 26014.</p>
            <p className="flex items-center gap-3">
              <span className="text-slate-400">Strictly for Evaluation & Jury Demonstration</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StateJurisdictionProvider>
        <BrowserRouter>
          <MainApp />
        </BrowserRouter>
      </StateJurisdictionProvider>
    </AuthProvider>
  );
}
