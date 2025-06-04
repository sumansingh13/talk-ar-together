
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WebRTCAudioConfig {
  channelId: string;
  onAudioReceived?: (audioData: ArrayBuffer) => void;
  onRemoteUserConnected?: (userId: string) => void;
  onRemoteUserDisconnected?: (userId: string) => void;
}

export const useWebRTCAudio = (config: WebRTCAudioConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const initializeAudio = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      
      // Subscribe to channel for signaling
      const channel = supabase.channel(`voice-${config.channelId}`)
        .on('broadcast', { event: 'offer' }, handleOffer)
        .on('broadcast', { event: 'answer' }, handleAnswer)
        .on('broadcast', { event: 'ice-candidate' }, handleIceCandidate)
        .on('broadcast', { event: 'user-joined' }, handleUserJoined)
        .on('broadcast', { event: 'user-left' }, handleUserLeft)
        .subscribe();

      // Announce presence
      channel.send({
        type: 'broadcast',
        event: 'user-joined',
        payload: { userId: (await supabase.auth.getUser()).data.user?.id }
      });

      setIsConnected(true);
      return { stream, channel };
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }, [config.channelId]);

  const handleOffer = useCallback(async (payload: any) => {
    const { offer, fromUserId } = payload;
    if (!localStreamRef.current || !offer) return;

    const peerConnection = createPeerConnection(fromUserId);
    peerConnectionsRef.current.set(fromUserId, peerConnection);

    // Add local stream
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send answer back
    const channel = supabase.channel(`voice-${config.channelId}`);
    channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: { answer, toUserId: fromUserId }
    });
  }, [config.channelId]);

  const handleAnswer = useCallback(async (payload: any) => {
    const { answer, toUserId } = payload;
    const peerConnection = peerConnectionsRef.current.get(toUserId);
    
    if (peerConnection && answer) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (payload: any) => {
    const { candidate, fromUserId } = payload;
    const peerConnection = peerConnectionsRef.current.get(fromUserId);
    
    if (peerConnection && candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  const handleUserJoined = useCallback(async (payload: any) => {
    const { userId } = payload;
    if (!userId || !localStreamRef.current) return;

    const peerConnection = createPeerConnection(userId);
    peerConnectionsRef.current.set(userId, peerConnection);

    // Add local stream
    localStreamRef.current.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStreamRef.current!);
    });

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const channel = supabase.channel(`voice-${config.channelId}`);
    channel.send({
      type: 'broadcast',
      event: 'offer',
      payload: { offer, fromUserId: userId }
    });

    setConnectedUsers(prev => [...prev, userId]);
    config.onRemoteUserConnected?.(userId);
  }, [config.channelId, config.onRemoteUserConnected]);

  const handleUserLeft = useCallback((payload: any) => {
    const { userId } = payload;
    const peerConnection = peerConnectionsRef.current.get(userId);
    
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(userId);
    }

    setConnectedUsers(prev => prev.filter(id => id !== userId));
    config.onRemoteUserDisconnected?.(userId);
  }, [config.onRemoteUserDisconnected]);

  const createPeerConnection = useCallback((userId: string) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const channel = supabase.channel(`voice-${config.channelId}`);
        channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, fromUserId: userId }
        });
      }
    };

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream && audioContextRef.current) {
        // Process incoming audio
        const source = audioContextRef.current.createMediaStreamSource(remoteStream);
        const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          config.onAudioReceived?.(inputData.buffer);
        };

        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
      }
    };

    return peerConnection;
  }, [config.channelId, config.onAudioReceived]);

  const startRecording = useCallback(() => {
    if (localStreamRef.current) {
      setIsRecording(true);
      // Enable audio tracks
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = true;
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (localStreamRef.current) {
      setIsRecording(false);
      // Disable audio tracks
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    // Close all peer connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setConnectedUsers([]);
  }, []);

  return {
    isConnected,
    isRecording,
    connectedUsers,
    initializeAudio,
    startRecording,
    stopRecording,
    disconnect
  };
};
