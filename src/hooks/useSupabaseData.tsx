
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

interface ChannelTranslation {
  id: string;
  channel_id: string;
  user_id: string;
  original_text: string;
  translated_text: string;
  from_language: string;
  to_language: string;
  created_at: string;
  profiles: Profile;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [participants, setParticipants] = useState<ChannelParticipant[]>([]);
  const [translations, setTranslations] = useState<ChannelTranslation[]>([]);
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

  // Create a new channel
  const createChannel = async (name: string, description?: string, isPrivate: boolean = false) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('channels')
      .insert({
        name,
        description,
        is_private: isPrivate,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating channel:', error);
      return { error };
    }

    // Auto-join the creator to the channel
    await joinChannel(data.id);
    await fetchChannels();
    
    return { data, error: null };
  };

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error('User not authenticated') };

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return { error };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      return { error: updateError };
    }

    await fetchUserProfile();
    return { data: publicUrl, error: null };
  };

  // Fetch participants for a specific channel
  const fetchParticipants = async (channelId: string) => {
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

    const userIds = participantsData.map(p => p.user_id);

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

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

  // Fetch translations for a channel
  const fetchTranslations = async (channelId: string) => {
    const { data, error } = await supabase
      .from('channel_translations')
      .select(`
        *,
        profiles!channel_translations_user_id_fkey(*)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching translations:', error);
      return;
    }

    setTranslations(data || []);
  };

  // Add translation
  const addTranslation = async (
    channelId: string, 
    originalText: string, 
    translatedText: string, 
    fromLang: string = 'en', 
    toLang: string = 'es'
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    const { data, error } = await supabase
      .from('channel_translations')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        original_text: originalText,
        translated_text: translatedText,
        from_language: fromLang,
        to_language: toLang
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding translation:', error);
      return { error };
    }

    return { data, error: null };
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

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to channel changes
    const channelSubscription = supabase
      .channel('channels-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'channels' },
        () => {
          fetchChannels();
        }
      )
      .subscribe();

    // Subscribe to translation changes
    const translationSubscription = supabase
      .channel('translations-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'channel_translations' },
        (payload) => {
          console.log('Translation change:', payload);
          // Refetch translations for active channel if needed
        }
      )
      .subscribe();

    return () => {
      channelSubscription.unsubscribe();
      translationSubscription.unsubscribe();
    };
  }, [user]);

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
    translations,
    userProfile,
    loading,
    fetchChannels,
    fetchParticipants,
    fetchTranslations,
    createChannel,
    uploadAvatar,
    addTranslation,
    joinChannel,
    leaveChannel,
    updateSpeakingStatus,
    refetch: () => {
      fetchChannels();
      if (user) fetchUserProfile();
    }
  };
};
