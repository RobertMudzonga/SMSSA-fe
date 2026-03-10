
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from './Login';

const InnerApp: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Login />;
  return <AppLayout />;
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <InnerApp />
      </AppProvider>
    </AuthProvider>
  );
};

export default Index;
