import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuthStore } from './stores/auth.store';
import { Shell } from './components/layout/Shell';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TherapySlotsPage } from './pages/TherapySlotsPage';
import { DashboardPage } from './pages/DashboardPage';
import { SlotsPage } from './pages/SlotsPage';
import { TherapiesAdminPage } from './pages/TherapiesAdminPage';
import { PatientsPage } from './pages/PatientsPage';
import { ConsultDetailPage } from './pages/ConsultDetailPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { PhysicianSchedulePage } from './pages/PhysicianSchedulePage';
import { PhysicianSlotsPage } from './pages/PhysicianSlotsPage';
import { supabase } from './lib/supabase';
import { Spinner } from './components/ui/Spinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAdminAuthStore();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><Spinner /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function RoleRedirect() {
  const { adminUser } = useAdminAuthStore();
  const dest = adminUser?.role === 'physician' ? '/physician/schedule' : '/dashboard';
  return <Navigate to={dest} replace />;
}

export default function App() {
  const { loadSession, setSession } = useAdminAuthStore();

  useEffect(() => {
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      // Reload full session (including adminUser) on any auth change
      if (session) loadSession();
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/therapy-slots" element={<ProtectedRoute><TherapySlotsPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/slots" element={<ProtectedRoute><SlotsPage /></ProtectedRoute>} />
      <Route path="/therapies" element={<ProtectedRoute><TherapiesAdminPage /></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
      <Route path="/consult/:id" element={<ProtectedRoute><ConsultDetailPage /></ProtectedRoute>} />
      <Route path="/physician/schedule" element={<ProtectedRoute><PhysicianSchedulePage /></ProtectedRoute>} />
      <Route path="/physician/slots" element={<ProtectedRoute><PhysicianSlotsPage /></ProtectedRoute>} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}
