
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
    if (!user) {
      console.log('No user found, skipping friends fetch');
      return;
    }

    try {
      console.log('Fetching friends for user:', user.id);
      
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

      console.log('Raw friends data:', friendsData);

      if (!friendsData || friendsData.length === 0) {
        console.log('No friends found');
        setFriends([]);
        return;
      }

      // Get the friend IDs (the other person in the friendship)
      const friendIds = friendsData.map(friendship => 
        friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
      );

      console.log('Friend IDs:', friendIds);

      // Fetch profiles for friends
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        return;
      }

      console.log('Friend profiles data:', profilesData);

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

      console.log('Final friends with profiles:', friendsWithProfiles);
      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error in fetchFriends:', error);
    }
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) {
      console.log('No user found, skipping pending requests fetch');
      return;
    }

    try {
      console.log('Fetching pending requests for user:', user.id);
      
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

      console.log('Raw pending requests data:', requestsData);

      if (!requestsData || requestsData.length === 0) {
        console.log('No pending requests found');
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

      console.log('Final pending requests with profiles:', requestsWithProfiles);
      setPendingRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error in fetchPendingRequests:', error);
    }
  }, [user]);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!user) {
      console.log('No user found, cannot send friend request');
      return { error: new Error('Not authenticated') };
    }

    try {
      console.log('Sending friend request from', user.id, 'to', friendId);
      
      // Check if friendship already exists (in either direction)
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing friendship:', checkError);
        return { error: checkError };
      }

      console.log('Existing friendship check result:', existingFriendship);

      if (existingFriendship) {
        console.log('Friendship already exists with status:', existingFriendship.status);
        return { error: new Error(`Friendship already exists with status: ${existingFriendship.status}`) };
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

      console.log('Friend request sent successfully:', data);
      
      // Refresh data after sending request
      await fetchFriends();
      await fetchPendingRequests();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in sendFriendRequest:', error);
      return { error: error as Error };
    }
  }, [user, fetchFriends, fetchPendingRequests]);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      console.log('Accepting friend request:', requestId);
      
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting friend request:', error);
        return;
      }

      console.log('Friend request accepted successfully');
      await fetchFriends();
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error in acceptFriendRequest:', error);
    }
  }, [fetchFriends, fetchPendingRequests]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    try {
      console.log('Removing friend:', friendshipId);
      
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error removing friend:', error);
        return;
      }

      console.log('Friend removed successfully');
      await fetchFriends();
    } catch (error) {
      console.error('Error in removeFriend:', error);
    }
  }, [fetchFriends]);

  useEffect(() => {
    if (user) {
      console.log('User changed, fetching friends and pending requests');
      fetchFriends();
      fetchPendingRequests();
      setLoading(false);
    } else {
      console.log('No user, resetting friends data');
      setFriends([]);
      setPendingRequests([]);
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
      console.log('Manual refetch triggered');
      fetchFriends();
      fetchPendingRequests();
    }, [fetchFriends, fetchPendingRequests])
  };
};
