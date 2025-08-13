// src/components/AppRoutes.tsx
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import AdminResetPassword from "@/components/AdminResetPassword";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import FAQ from "@/pages/FAQ";

const AppRoutes = () => {
  return (
     <Routes>
      {/* Define specific routes first */}
      <Route path="/" element={<Index />} /> {/* Add explicit home route */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/reset-password" element={<AdminResetPassword />} />
      <Route path="/faq" element={<FAQ />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      {/* 404 catch-all route MUST be last */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;