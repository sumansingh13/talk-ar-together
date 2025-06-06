
import { useState, useEffect, useCallback } from 'react';
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

  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      // Get accepted friends where user is either the requester or the receiver
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        return;
      }

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Get the friend IDs (the other person in the friendship)
      const friendIds = friendsData.map(friendship => 
        friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
      );

      // Fetch profiles for friends
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
        const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
        const profile = profilesData?.find(p => p.id === friendId);
        return {
          ...friendship,
          friend_id: friendId,
          status: friendship.status as 'pending' | 'accepted' | 'blocked',
          profiles: profile || {
            id: friendId,
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
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    try {
      // Get pending requests sent TO the current user
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
  }, [user]);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing friendship:', checkError);
        return { error: checkError };
      }

      if (existingFriendship) {
        return { error: new Error('Friendship already exists') };
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating friendship:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      return { error: error as Error };
    }
  }, [user]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
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
  }, [fetchFriends, fetchPendingRequests]);

  const removeFriend = useCallback(async (friendshipId: string) => {
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
  }, [fetchFriends]);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchPendingRequests();
      setLoading(false);
    }
  }, [user, fetchFriends, fetchPendingRequests]);

  return {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    refetch: useCallback(() => {
      fetchFriends();
      fetchPendingRequests();
    }, [fetchFriends, fetchPendingRequests])
  };
};
