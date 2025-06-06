
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Users, Globe, Shield, Zap, LogOut, User, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFriends } from '@/hooks/useFriends';
import PushToTalkButton from './PushToTalkButton';
import ChannelList from './ChannelList';
import UserList from './UserList';
import VoiceEffects from './VoiceEffects';
import WalkieTalkieButton from './WalkieTalkieButton';
import UserProfileModal from './UserProfileModal';
import AddFriendModal from './AddFriendModal';
import AdvancedVoiceRecorder from './AdvancedVoiceRecorder';
import RealTimeAudioPlayer from './RealTimeAudioPlayer';
import ImprovedRealTimeTranslation from './ImprovedRealTimeTranslation';

const VoiceChatApp = () => {
  const { user, signOut } = useAuth();
  const { 
    channels, 
    participants, 
    translations,
    userProfile,
    fetchParticipants, 
    fetchTranslations,
    joinChannel, 
    updateSpeakingStatus,
    createChannel,
    addTranslation,
    refetch
  } = useSupabaseData();
  
  const { friends, pendingRequests } = useFriends();
  
  const [isConnected, setIsConnected] = useState(false);
  const [activeChannel, setActiveChannel] = useState('');
  const [activeChannelId, setActiveChannelId] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // Show ALL channels, not just friend channels
  const displayChannels = channels;

  // Show ALL participants, not just friends
  const displayParticipants = participants;

  const connectedUserIds = displayParticipants.map(p => p.user_id).filter(Boolean) as string[];

  useEffect(() => {
    if (channels.length > 0 && !activeChannel) {
      const firstChannel = channels[0];
      setActiveChannel(firstChannel.name);
      setActiveChannelId(firstChannel.id);
      fetchParticipants(firstChannel.id);
      fetchTranslations(firstChannel.id);
      if (user) {
        joinChannel(firstChannel.id);
      }
    }
  }, [channels, activeChannel, user]);

  useEffect(() => {
    const timer = setTimeout(() => setIsConnected(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChannelSelect = async (channelName: string) => {
    const channel = channels.find(c => c.name === channelName);
    if (channel) {
      setActiveChannel(channelName);
      setActiveChannelId(channel.id);
      fetchParticipants(channel.id);
      fetchTranslations(channel.id);
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

  const handleCreateChannel = async (name: string, description?: string, isPrivate?: boolean) => {
    const result = await createChannel(name, description, isPrivate);
    return result;
  };

  const handleTranslationReceived = async (originalText: string, translatedText: string, fromLang: string, toLang: string) => {
    if (activeChannelId) {
      await addTranslation(activeChannelId, originalText, translatedText, fromLang, toLang);
      fetchTranslations(activeChannelId);
    }
  };

  const activeChannelData = channels.find(c => c.name === activeChannel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Voxtrek</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm text-white">{userProfile?.full_name || 'User'}</p>
                    <p className="text-xs text-blue-300">@{userProfile?.username || 'username'}</p>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(true)}
                    className="relative"
                  >
                    <Avatar className="w-8 h-8 hover:ring-2 hover:ring-blue-400 transition-all">
                      <AvatarImage src={userProfile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold">
                        {(userProfile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </div>
              )}
              
              <Badge variant={isConnected ? "default" : "destructive"} className="bg-green-500/20 text-green-300 border-green-500/30">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </Badge>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowAddFriendModal(true)}
              >
                <UserPlus className="w-5 h-5" />
              </Button>
              
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
          {/* Left Sidebar - Channels (show all channels) */}
          <div className="lg:col-span-1">
            <ChannelList 
              channels={displayChannels.map(c => ({
                id: c.id,
                name: c.name,
                users: c.participant_count || 0,
                private: c.is_private
              }))}
              activeChannel={activeChannel} 
              onChannelSelect={handleChannelSelect}
              onCreateChannel={handleCreateChannel}
            />
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Channel Info */}
            <Card className="bg-slate-900/40 backdrop-blur-lg border-purple-300/20 text-white shadow-lg shadow-purple-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span># {activeChannel}</span>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    <Users className="w-4 h-4 mr-1" />
                    {displayParticipants.length} users online
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Voice Activity Indicator */}
                  <div className="bg-black/30 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-green-300">Voice activity detected</span>
                    </div>
                    
                    {/* Speaking Users */}
                    <div className="space-y-2">
                      {displayParticipants.filter(p => p.is_speaking).map(participant => (
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

                  {/* Walkie-Talkie Button */}
                  <WalkieTalkieButton 
                    channelId={activeChannelId}
                    onTransmissionStart={() => handleSpeakingToggle(true)}
                    onTransmissionEnd={() => handleSpeakingToggle(false)}
                  />

                  {/* Voice Effects */}
                  <VoiceEffects />
                </div>
              </CardContent>
            </Card>

            {/* Real-time Audio Player */}
            <RealTimeAudioPlayer 
              channelId={activeChannelId}
              onAudioReceived={(audioData) => console.log('Audio received:', audioData.byteLength, 'bytes')}
            />

            {/* Advanced Voice Recorder */}
            <AdvancedVoiceRecorder 
              channelId={activeChannelId}
              friends={friends}
            />

            {/* Improved Real-time Translation */}
            <ImprovedRealTimeTranslation 
              onTranslationReceived={handleTranslationReceived}
            />

            {/* Translation History */}
            {translations.length > 0 && (
              <Card className="bg-slate-900/40 backdrop-blur-lg border-purple-300/20 text-white shadow-lg shadow-purple-500/10">
                <CardHeader>
                  <CardTitle className="text-purple-200">Recent Translations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {translations.slice(0, 10).map(translation => (
                      <div key={translation.id} className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-300">
                            {translation.profiles?.full_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {translation.from_language.toUpperCase()} → {translation.to_language.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-300">{translation.original_text}</p>
                          <p className="text-sm text-white font-medium">{translation.translated_text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Users (show all participants) */}
          <div className="lg:col-span-1">
            <UserList 
              users={displayParticipants.map(p => ({
                id: parseInt(p.id),
                name: p.profiles.full_name || p.profiles.username || 'Anonymous',
                status: 'online' as const,
                speaking: p.is_speaking,
                country: p.profiles.country || 'US',
                avatar: p.profiles.avatar_url
              }))}
            />
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <UserProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Add Friend Modal */}
      <AddFriendModal 
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />
    </div>
  );
};

export default VoiceChatApp;
