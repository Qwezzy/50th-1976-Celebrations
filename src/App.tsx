import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import LegacyAssistant from './components/LegacyAssistant';

function AppContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-black/40">Loading Legacy Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profile && !profile.onboarded) {
    return <Onboarding />;
  }

  // Simple routing based on URL path
  const path = window.location.pathname;
  if (path === '/admin' && profile?.role === 'Admin') {
    return <AdminPanel />;
  }

  return (
    <>
      <Dashboard />
      <LegacyAssistant />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
