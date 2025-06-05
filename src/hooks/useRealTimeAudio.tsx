
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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);

  const initializeAudio = useCallback(async () => {
    try {
      // Clean up any existing channel first
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

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
      if (!user) return false;

      // Set up real-time channel for audio transmission with unique name
      const channel = supabase.channel(`audio-${channelId}-${user.id}`)
        .on('broadcast', { event: 'audio-chunk' }, handleAudioChunk)
        .on('broadcast', { event: 'user-joined' }, handleUserJoined)
        .on('broadcast', { event: 'user-left' }, handleUserLeft)
        .subscribe();

      channelRef.current = channel;

      // Announce presence
      channel.send({
        type: 'broadcast',
        event: 'user-joined',
        payload: { userId: user.id }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
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
    if (!streamRef.current || !channelRef.current) return;

    setIsTransmitting(true);

    mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 64000
    });

    mediaRecorderRef.current.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        // Convert audio to base64 for transmission
        const arrayBuffer = await event.data.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Send audio chunk to other users
        channelRef.current?.send({
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
  }, []);

  const stopTransmission = useCallback(() => {
    if (mediaRecorderRef.current && isTransmitting) {
      mediaRecorderRef.current.stop();
      setIsTransmitting(false);
    }
  }, [isTransmitting]);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isTransmitting,
    isReceiving,
    connectedUsers,
    initializeAudio,
    startTransmission,
    stopTransmission,
    cleanup
  };
};
