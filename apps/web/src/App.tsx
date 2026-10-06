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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-400">
            GeoDhara — Digital Public Infrastructure for Land Governance (PS 26014)
          </p>
          <p className="text-[11px] text-slate-600">
            Competition Prototype for Smart India Hackathon 2026. All cadastral data and state adapters are synthetic.
          </p>
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
