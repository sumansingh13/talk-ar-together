
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
}

interface Channel {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string | null;
  participant_count?: number;
}

interface ChannelParticipant {
  id: string;
  channel_id: string;
  user_id: string;
  is_speaking: boolean;
  profiles: Profile;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [participants, setParticipants] = useState<ChannelParticipant[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch channels
  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('channels')
      .select(`
        *,
        channel_participants(count)
      `)
      .order('created_at');

    if (error) {
      console.error('Error fetching channels:', error);
      return;
    }

    const channelsWithCount = data.map(channel => ({
      ...channel,
      participant_count: channel.channel_participants?.[0]?.count || 0
    }));

    setChannels(channelsWithCount);
  };

  // Fetch participants for a specific channel
  const fetchParticipants = async (channelId: string) => {
    // First, get the channel participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('channel_participants')
      .select('*')
      .eq('channel_id', channelId);

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return;
    }

    if (!participantsData || participantsData.length === 0) {
      setParticipants([]);
      return;
    }

    // Get user IDs from participants
    const userIds = participantsData.map(p => p.user_id);

    // Fetch profiles for these users
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Combine participants with their profiles
    const participantsWithProfiles = participantsData.map(participant => {
      const profile = profilesData?.find(p => p.id === participant.user_id);
      return {
        ...participant,
        profiles: profile || {
          id: participant.user_id,
          username: null,
          full_name: null,
          avatar_url: null,
          country: null
        }
      };
    });

    setParticipants(participantsWithProfiles);
  };

  // Join a channel
  const joinChannel = async (channelId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('channel_participants')
      .insert({
        channel_id: channelId,
        user_id: user.id
      });

    if (error && !error.message.includes('duplicate')) {
      console.error('Error joining channel:', error);
    }
  };

  // Leave a channel
  const leaveChannel = async (channelId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('channel_participants')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving channel:', error);
    }
  };

  // Update speaking status
  const updateSpeakingStatus = async (channelId: string, isSpeaking: boolean) => {
    if (!user) return;

    const { error } = await supabase
      .from('channel_participants')
      .update({ is_speaking: isSpeaking })
      .eq('channel_id', channelId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating speaking status:', error);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }

    setUserProfile(data);
  };

  useEffect(() => {
    if (user) {
      fetchChannels();
      fetchUserProfile();
    }
    setLoading(false);
  }, [user]);

  return {
    channels,
    participants,
    userProfile,
    loading,
    fetchChannels,
    fetchParticipants,
    joinChannel,
    leaveChannel,
    updateSpeakingStatus,
    refetch: () => {
      fetchChannels();
      if (user) fetchUserProfile();
    }
  };
};
