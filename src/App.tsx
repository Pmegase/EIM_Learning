import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ContentProvider } from "@/contexts/ContentContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";
import AdminResetPassword from "@/components/AdminResetPassword";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppRoutes from '@/components/AppRoutes';
import { AuthProvider } from "@/contexts/AuthContext";
import React from 'react';
import { NavigationProvider } from '@/contexts/NavigationContext';

const queryClient = new QueryClient();

const App = () => {
  return (
    <BrowserRouter> {/* Moved to outermost position */}
      <NavigationProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ContentProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <AppRoutes />
              </AuthProvider>
            </ContentProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </NavigationProvider>
    </BrowserRouter>
  );
};

export default App;