import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export type UserRole = 'citizen' | 'officer' | 'field_officer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  loginWithCredentials: (email: string, passwordPlain: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; name: string }> = {
  citizen: { email: 'citizen@geodhara.demo', pass: 'DemoCitizen@123', name: 'Ramesh Kumar (Citizen)' },
  officer: { email: 'officer@geodhara.demo', pass: 'DemoOfficer@123', name: 'Smt. Ananya Rao (Tahsildar / Officer)' },
  field_officer: { email: 'field@geodhara.demo', pass: 'DemoField@123', name: 'K. Suresh (Field Surveyor)' },
  admin: { email: 'admin@geodhara.demo', pass: 'DemoAdmin@123', name: 'System Administrator' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Default to officer for rich demo experience
    return {
      id: 'demo-officer-id',
      email: DEMO_CREDENTIALS.officer.email,
      full_name: DEMO_CREDENTIALS.officer.name,
      role: 'officer',
    };
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('geodhara_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Attempt real login for default demo user on startup
  useEffect(() => {
    switchDemoRole('officer').catch(() => {
      // If backend not immediately online, fallback to default state
    });
  }, []);

  const loginWithCredentials = async (email: string, passwordPlain: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, passwordPlain);
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('geodhara_auth_token', res.data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    try {
      await loginWithCredentials(creds.email, creds.pass);
    } catch {
      // Mock fallback if running without backend connected yet
      setUser({
        id: `mock-${role}`,
        email: creds.email,
        full_name: creds.name,
        role,
      });
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('geodhara_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithCredentials,
        switchDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
