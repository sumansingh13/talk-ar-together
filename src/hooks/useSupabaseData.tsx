
import { useState, useEffect, useCallback } from 'react';
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
  const fetchChannels = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error('Error in fetchChannels:', error);
    }
  }, []);

  // Create a new channel
  const createChannel = useCallback(async (name: string, description?: string, isPrivate: boolean = false) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
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
    } catch (error) {
      console.error('Error in createChannel:', error);
      return { error };
    }
  }, [user, fetchChannels]);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
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
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return { error };
    }
  }, [user]);

  // Fetch participants for a specific channel
  const fetchParticipants = useCallback(async (channelId: string) => {
    try {
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
    } catch (error) {
      console.error('Error in fetchParticipants:', error);
    }
  }, []);

  // Fetch translations for a channel
  const fetchTranslations = useCallback(async (channelId: string) => {
    try {
      const { data: translationsData, error: translationsError } = await supabase
        .from('channel_translations')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (translationsError) {
        console.error('Error fetching translations:', translationsError);
        return;
      }

      if (!translationsData || translationsData.length === 0) {
        setTranslations([]);
        return;
      }

      const userIds = translationsData.map(t => t.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles for translations:', profilesError);
      }

      const translationsWithProfiles = translationsData.map(translation => {
        const profile = profilesData?.find(p => p.id === translation.user_id);
        return {
          ...translation,
          profiles: profile || {
            id: translation.user_id,
            username: null,
            full_name: null,
            avatar_url: null,
            country: null
          }
        };
      });

      setTranslations(translationsWithProfiles);
    } catch (error) {
      console.error('Error in fetchTranslations:', error);
    }
  }, []);

  // Add translation
  const addTranslation = useCallback(async (
    channelId: string, 
    originalText: string, 
    translatedText: string, 
    fromLang: string = 'en', 
    toLang: string = 'es'
  ) => {
    if (!user) return { error: new Error('User not authenticated') };

    try {
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

      // Refresh translations after adding a new one
      await fetchTranslations(channelId);
      return { data, error: null };
    } catch (error) {
      console.error('Error in addTranslation:', error);
      return { error };
    }
  }, [user, fetchTranslations]);

  // Join a channel
  const joinChannel = useCallback(async (channelId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('channel_participants')
        .insert({
          channel_id: channelId,
          user_id: user.id
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error joining channel:', error);
      }
    } catch (error) {
      console.error('Error in joinChannel:', error);
    }
  }, [user]);

  // Leave a channel
  const leaveChannel = useCallback(async (channelId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('channel_participants')
        .delete()
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving channel:', error);
      }
    } catch (error) {
      console.error('Error in leaveChannel:', error);
    }
  }, [user]);

  // Update speaking status
  const updateSpeakingStatus = useCallback(async (channelId: string, isSpeaking: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('channel_participants')
        .update({ is_speaking: isSpeaking })
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating speaking status:', error);
      }
    } catch (error) {
      console.error('Error in updateSpeakingStatus:', error);
    }
  }, [user]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchChannels();
      fetchUserProfile();
    }
    setLoading(false);
  }, [user, fetchChannels, fetchUserProfile]);

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
    refetch: useCallback(() => {
      fetchChannels();
      if (user) fetchUserProfile();
    }, [fetchChannels, fetchUserProfile, user])
  };
};
