
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profiles: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    country: string | null;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        return;
      }

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Fetch profiles for friends
      const friendIds = friendsData.map(f => f.friend_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        return;
      }

      // Combine friendship data with profiles
      const friendsWithProfiles = friendsData.map(friendship => {
        const profile = profilesData?.find(p => p.id === friendship.friend_id);
        return {
          ...friendship,
          status: friendship.status as 'pending' | 'accepted' | 'blocked',
          profiles: profile || {
            id: friendship.friend_id,
            username: null,
            full_name: null,
            avatar_url: null,
            country: null
          }
        };
      });

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error in fetchFriends:', error);
    }
  };

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      // Get pending requests sent to the current user
      const { data: requestsData, error: requestsError } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (requestsError) {
        console.error('Error fetching pending requests:', requestsError);
        return;
      }

      if (!requestsData || requestsData.length === 0) {
        setPendingRequests([]);
        return;
      }

      // Fetch profiles for request senders
      const senderIds = requestsData.map(r => r.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
        return;
      }

      // Combine request data with profiles
      const requestsWithProfiles = requestsData.map(request => {
        const profile = profilesData?.find(p => p.id === request.user_id);
        return {
          ...request,
          status: request.status as 'pending' | 'accepted' | 'blocked',
          profiles: profile || {
            id: request.user_id,
            username: null,
            full_name: null,
            avatar_url: null,
            country: null
          }
        };
      });

      setPendingRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error in fetchPendingRequests:', error);
    }
  };

  const sendFriendRequest = async (friendEmail: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Find user by email (assuming email lookup, adjust as needed)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', friendEmail) // This might need adjustment based on your lookup logic
        .single();

      if (profileError) {
        return { error: new Error('User not found') };
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: profiles.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        return;
      }

      await fetchFriends();
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error removing friend:', error);
        return;
      }

      await fetchFriends();
    } catch (error) {
      console.error('Error in removeFriend:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
      setLoading(false);
    }
  }, [user]);

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    refetch: () => {
      fetchFriends();
      fetchPendingRequests();
    }
  };
};
