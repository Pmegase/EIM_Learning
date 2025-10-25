import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

type AuthUser = {
  id: string | number;
  email: string;
  name?: string;
  role?: 'admin' | 'user' | string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  adminSignup: (name: string, email: string, password: string, adminCode: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing session (if any) — no redirects here
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUser(null);
          return;
        }
        // will include Authorization via axios interceptor
        const data = await apiClient.get<{ user: AuthUser }>(API_ENDPOINTS.AUTH.ME);
        setUser(data.user);
      } catch {
        // invalid/expired token
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: AuthUser }>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );
    localStorage.setItem('authToken', res.token);
    setUser(res.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await apiClient.post<{ token: string; user: AuthUser }>(
      API_ENDPOINTS.AUTH.SIGNUP,
      { name, email, password }
    );
    localStorage.setItem('authToken', res.token);
    setUser(res.user);
  };

  const adminSignup = async (name: string, email: string, password: string, adminCode: string) => {
    const res = await apiClient.post<{ token: string; user: AuthUser }>(
      API_ENDPOINTS.AUTH.ADMIN_SIGNUP,
      { name, email, password, adminCode }
    );
    localStorage.setItem('authToken', res.token);
    setUser(res.user);
  };

  const refreshMe = async () => {
    const data = await apiClient.get<{ user: AuthUser }>(API_ENDPOINTS.AUTH.ME);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      signup,
      adminSignup,
      logout,
      refreshMe,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
