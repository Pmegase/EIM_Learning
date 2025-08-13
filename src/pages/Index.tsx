
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from '@/components/Landing';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';
import FAQ from '@/pages/FAQ';

const Index = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/faq" element={<FAQ />} />
      {/* Admin routes */}  
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
};

export default Index;
