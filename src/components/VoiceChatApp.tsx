
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Users, Globe, Shield, Zap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import PushToTalkButton from './PushToTalkButton';
import ChannelList from './ChannelList';
import UserList from './UserList';
import TranslationPanel from './TranslationPanel';
import VoiceEffects from './VoiceEffects';

const VoiceChatApp = () => {
  const { user, signOut } = useAuth();
  const { 
    channels, 
    participants, 
    userProfile,
    fetchParticipants, 
    joinChannel, 
    updateSpeakingStatus 
  } = useSupabaseData();
  
  const [isConnected, setIsConnected] = useState(false);
  const [activeChannel, setActiveChannel] = useState('');
  const [activeChannelId, setActiveChannelId] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Set first channel as active when channels load
    if (channels.length > 0 && !activeChannel) {
      const firstChannel = channels[0];
      setActiveChannel(firstChannel.name);
      setActiveChannelId(firstChannel.id);
      fetchParticipants(firstChannel.id);
      if (user) {
        joinChannel(firstChannel.id);
      }
    }
  }, [channels, activeChannel, user]);

  useEffect(() => {
    // Simulate connection status
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChannelSelect = async (channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    if (channel) {
      setActiveChannel(channelName);
      setActiveChannelId(channel.id);
      fetchParticipants(channel.id);
      if (user) {
        joinChannel(channel.id);
      }
    }
  };

  const handleSpeakingToggle = (speaking: boolean) => {
    setIsSpeaking(speaking);
    if (activeChannelId && user) {
      updateSpeakingStatus(activeChannelId, speaking);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const activeChannelData = channels.find(c => c.name === activeChannel);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-purple-500 via-pink-500 via-orange-400 to-red-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Voxtrek</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm text-white">{userProfile?.full_name || 'User'}</p>
                    <p className="text-xs text-pink-300">@{userProfile?.username || 'username'}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full flex items-center justify-center text-white font-semibold">
                    {(userProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              
              <Badge variant={isConnected ? "default" : "destructive"} className="bg-green-500/20 text-green-300 border-green-500/30">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </Badge>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Shield className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Globe className="w-5 h-5" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Channels */}
          <div className="lg:col-span-1">
            <ChannelList 
              channels={channels.map(c => ({
                id: c.id,
                name: c.name,
                users: c.participant_count || 0,
                private: c.is_private
              }))}
              activeChannel={activeChannel} 
              onChannelSelect={handleChannelSelect} 
            />
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Channel Info */}
            <Card className="bg-slate-900/40 backdrop-blur-lg border-pink-300/20 text-white shadow-lg shadow-pink-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span># {activeChannel}</span>
                  <Badge variant="secondary" className="bg-pink-500/20 text-pink-200 border-pink-500/30">
                    <Users className="w-4 h-4 mr-1" />
                    {activeChannelData?.participant_count || 0} users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Voice Activity Indicator */}
                  <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-green-300">Voice activity detected</span>
                    </div>
                    
                    {/* Speaking Users */}
                    <div className="space-y-2">
                      {participants.filter(p => p.is_speaking).map(participant => (
                        <div key={participant.id} className="flex items-center space-x-3 bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <span className="text-green-300">{participant.profiles.full_name || participant.profiles.username} is speaking</span>
                        </div>
                      ))}
                      
                      {isSpeaking && (
                        <div className="flex items-center space-x-3 bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
                            <Mic className="w-4 h-4" />
                          </div>
                          <span className="text-green-300">You are speaking</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Push to Talk Button */}
                  <PushToTalkButton isSpeaking={isSpeaking} onToggle={handleSpeakingToggle} />

                  {/* Voice Effects */}
                  <VoiceEffects />
                </div>
              </CardContent>
            </Card>

            {/* Translation Panel */}
            <TranslationPanel />
          </div>

          {/* Right Sidebar - Users */}
          <div className="lg:col-span-1">
            <UserList 
              users={participants.map(p => ({
                id: parseInt(p.id),
                name: p.profiles.full_name || p.profiles.username || 'Anonymous',
                status: 'online' as const,
                speaking: p.is_speaking,
                country: p.profiles.country || 'US'
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatApp;
