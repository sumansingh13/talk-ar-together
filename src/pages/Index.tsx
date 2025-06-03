
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import VoiceChatApp from '../components/VoiceChatApp';
import AuthPage from '../components/AuthPage';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-600 via-purple-500 via-pink-500 via-orange-400 to-red-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <VoiceChatApp /> : <AuthPage />;
};

export default Index;
