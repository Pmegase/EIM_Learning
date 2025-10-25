// src/components/AppRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from "@/pages/Index";
import AdminLogin from "@/components/AdminLogin";
import SignUp from "@/components/SignUp"; // Add import
import AdminSignUp from "@/components/AdminSignUp"; // Add import
import AdminDashboard from "@/components/AdminDashboard";
import AdminResetPassword from "@/components/AdminResetPassword";
import FAQ from "@/pages/FAQ";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from '@/contexts/AuthContext';

const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin-signup" element={<AdminSignUp />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;