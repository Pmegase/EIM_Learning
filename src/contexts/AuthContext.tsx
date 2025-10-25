// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { API_ENDPOINTS } from '@/config/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  adminSignup: (name: string, email: string, password: string, adminCode: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const data = await apiClient.get(API_ENDPOINTS.AUTH.ME);
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    navigate('/admin/dashboard', { replace: true });
  };

  const signup = async (name: string, email: string, password: string) => {
    const data = await apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, { name, email, password });
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    navigate('/', { replace: true });
  };

  const adminSignup = async (name: string, email: string, password: string, adminCode: string) => {
    const data = await apiClient.post(API_ENDPOINTS.AUTH.ADMIN_SIGNUP, {
      name, email, password, adminCode
    });
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    navigate('/admin/dashboard', { replace: true });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  // Handle redirects after auth state is initialized
  useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname.startsWith('/admin')) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      signup,
      adminSignup,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};