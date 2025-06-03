
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import VoiceChatApp from '../components/VoiceChatApp';
import AuthPage from '../components/AuthPage';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 via-purple-700 via-red-600 to-red-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <VoiceChatApp /> : <AuthPage />;
};

export default Index;
