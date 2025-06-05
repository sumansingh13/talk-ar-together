
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VoiceMessage {
  id: string;
  senderId: string;
  recipientId?: string;
  channelId?: string;
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
  isPlayed: boolean;
}

export const useAdvancedVoiceMessaging = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<VoiceMessage | null>(null);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recording: VoiceMessage = {
          id: crypto.randomUUID(),
          senderId: user?.id || '',
          audioBlob,
          duration: recordingDuration,
          timestamp: new Date(),
          isPlayed: false
        };
        setCurrentRecording(recording);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [user, recordingDuration]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }
  }, [isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isRecording]);

  const previewRecording = useCallback((recording: VoiceMessage) => {
    const audio = new Audio(URL.createObjectURL(recording.audioBlob));
    audio.play();
  }, []);

  const sendVoiceMessage = useCallback(async (
    recording: VoiceMessage, 
    recipientId?: string, 
    channelId?: string
  ) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await recording.audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data, error } = await supabase.functions.invoke('send-voice-message', {
        body: {
          audioData: base64Audio,
          duration: recording.duration,
          recipientId,
          channelId,
          senderId: user?.id
        }
      });

      if (error) {
        console.error('Failed to send voice message:', error);
        return false;
      }

      // Add to local messages
      setVoiceMessages(prev => [
        {
          ...recording,
          recipientId,
          channelId
        },
        ...prev
      ]);

      setCurrentRecording(null);
      setRecordingDuration(0);
      return true;

    } catch (error) {
      console.error('Error sending voice message:', error);
      return false;
    }
  }, [user]);

  const discardRecording = useCallback(() => {
    setCurrentRecording(null);
    setRecordingDuration(0);
  }, []);

  const formatDuration = useCallback((duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    isPaused,
    recordingDuration,
    currentRecording,
    voiceMessages,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    previewRecording,
    sendVoiceMessage,
    discardRecording,
    formatDuration
  };
};
