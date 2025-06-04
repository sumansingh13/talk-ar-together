
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VoiceMessage {
  id: string;
  senderId: string;
  channelId: string;
  audioData: string; // base64 encoded
  duration: number;
  timestamp: Date;
  isPlayed: boolean;
}

export const useVoiceMessaging = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      audioContextRef.current = new AudioContext();
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceMessage(audioBlob);
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(100); // Record in 100ms chunks
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);

    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const processVoiceMessage = useCallback(async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to Supabase function for processing
      const { data, error } = await supabase.functions.invoke('process-voice-message', {
        body: {
          audioData: base64Audio,
          duration: recordingDuration,
          channelId: 'current-channel-id' // This should come from context
        }
      });

      if (error) {
        console.error('Failed to process voice message:', error);
        return;
      }

      console.log('Voice message processed:', data);
    } catch (error) {
      console.error('Error processing voice message:', error);
    }
  }, [recordingDuration]);

  const playVoiceMessage = useCallback(async (messageId: string, audioData: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Decode base64 audio
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create audio buffer and play
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        // Mark message as played
        setVoiceMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, isPlayed: true } : msg
          )
        );
      };

      source.start(0);

    } catch (error) {
      console.error('Failed to play voice message:', error);
    }
  }, []);

  const sendInstantVoiceMessage = useCallback(async (channelId: string, recipientIds: string[]) => {
    if (!isRecording) return;

    // Stop current recording and send immediately
    stopVoiceRecording();

    // The processing will be handled by processVoiceMessage
    console.log('Sending instant voice message to:', recipientIds);
  }, [isRecording, stopVoiceRecording]);

  return {
    isRecording,
    voiceMessages,
    recordingDuration,
    startVoiceRecording,
    stopVoiceRecording,
    playVoiceMessage,
    sendInstantVoiceMessage
  };
};
