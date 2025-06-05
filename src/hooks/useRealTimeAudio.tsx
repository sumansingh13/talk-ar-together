
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  userId: string;
}

export const useRealTimeAudio = (channelId: string) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const isInitializingRef = useRef(false);

  const initializeAudio = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || isInitialized) {
      return isInitialized;
    }

    isInitializingRef.current = true;

    try {
      // Clean up any existing resources first
      await cleanup();

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isInitializingRef.current = false;
        return false;
      }

      // Create a unique channel name to avoid conflicts
      const uniqueChannelName = `audio-${channelId}-${user.id}-${Date.now()}`;
      
      // Set up real-time channel for audio transmission
      const channel = supabase.channel(uniqueChannelName);

      // Store channel reference before subscribing
      channelRef.current = channel;

      // Set up event handlers before subscribing
      channel
        .on('broadcast', { event: 'audio-chunk' }, handleAudioChunk)
        .on('broadcast', { event: 'user-joined' }, handleUserJoined)
        .on('broadcast', { event: 'user-left' }, handleUserLeft);

      // Subscribe to the channel
      const subscriptionResult = await channel.subscribe();
      
      // Fix: The subscribe method returns a Promise that resolves to the channel instance
      // We need to check the subscription status differently
      if (subscriptionResult) {
        // Announce presence after successful subscription
        channel.send({
          type: 'broadcast',
          event: 'user-joined',
          payload: { userId: user.id }
        });

        setIsInitialized(true);
        isInitializingRef.current = false;
        return true;
      } else {
        console.error('Failed to subscribe to channel');
        await cleanup();
        isInitializingRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      await cleanup();
      isInitializingRef.current = false;
      return false;
    }
  }, [channelId]);

  const handleAudioChunk = useCallback(async (payload: any) => {
    const { audioData, userId, timestamp } = payload;
    
    if (!audioContextRef.current || !audioData) return;

    try {
      // Convert base64 back to ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode and play audio
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);

      setIsReceiving(true);
      setTimeout(() => setIsReceiving(false), 500);
    } catch (error) {
      console.error('Error playing received audio:', error);
    }
  }, []);

  const handleUserJoined = useCallback((payload: any) => {
    const { userId } = payload;
    setConnectedUsers(prev => [...prev.filter(id => id !== userId), userId]);
  }, []);

  const handleUserLeft = useCallback((payload: any) => {
    const { userId } = payload;
    setConnectedUsers(prev => prev.filter(id => id !== userId));
  }, []);

  const startTransmission = useCallback(async () => {
    if (!streamRef.current || !channelRef.current || !isInitialized) return;

    setIsTransmitting(true);

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 64000
    });

    mediaRecorderRef.current.ondataavailable = async (event) => {
      if (event.data.size > 0 && channelRef.current) {
        // Convert audio to base64 for transmission
        const arrayBuffer = await event.data.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Send audio chunk to other users
        channelRef.current.send({
          type: 'broadcast',
          event: 'audio-chunk',
          payload: {
            audioData: base64Audio,
            userId: user?.id,
            timestamp: Date.now()
          }
        });
      }
    };

    mediaRecorderRef.current.start(100); // Send chunks every 100ms
  }, [isInitialized]);

  const stopTransmission = useCallback(() => {
    if (mediaRecorderRef.current && isTransmitting) {
      mediaRecorderRef.current.stop();
      setIsTransmitting(false);
    }
  }, [isTransmitting]);

  const cleanup = useCallback(async () => {
    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clean up channel - use unsubscribe first, then remove
    if (channelRef.current) {
      try {
        await channelRef.current.unsubscribe();
        await supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error cleaning up channel:', error);
      }
      channelRef.current = null;
    }

    // Reset state
    setIsInitialized(false);
    setIsTransmitting(false);
    setIsReceiving(false);
    setConnectedUsers([]);
    isInitializingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isTransmitting,
    isReceiving,
    connectedUsers,
    isInitialized,
    initializeAudio,
    startTransmission,
    stopTransmission,
    cleanup
  };
};
