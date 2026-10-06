import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CitizenDashboardView } from './CitizenDashboardView';
import { OfficerDashboardView } from './OfficerDashboardView';
import { FieldSurveyorDashboardView } from './FieldSurveyorDashboardView';
import { AdminDashboardView } from './AdminDashboardView';

export const RoleDashboardRouter: React.FC = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'citizen':
      return <CitizenDashboardView />;
    case 'field_officer':
      return <FieldSurveyorDashboardView />;
    case 'admin':
      return <AdminDashboardView />;
    case 'officer':
    default:
      return <OfficerDashboardView />;
  }
};
