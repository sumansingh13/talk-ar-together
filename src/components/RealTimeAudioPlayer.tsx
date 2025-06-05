
import React, { useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
  userId: string;
}

interface RealTimeAudioPlayerProps {
  channelId: string;
  onAudioReceived?: (audioData: ArrayBuffer) => void;
}

class AudioQueue {
  private queue: AudioChunk[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(chunk: AudioChunk) {
    this.queue.push(chunk);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const chunk = this.queue.shift()!;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(chunk.data.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      this.playNext(); // Continue with next chunk even if current fails
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

const RealTimeAudioPlayer = ({ channelId, onAudioReceived }: RealTimeAudioPlayerProps) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const isInitializedRef = useRef(false);

  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
      isInitializedRef.current = true;
      console.log('Real-time audio player initialized');
    } catch (error) {
      console.error('Failed to initialize audio player:', error);
    }
  }, []);

  const handleAudioChunk = useCallback(async (audioData: ArrayBuffer, userId: string) => {
    if (!audioQueueRef.current || !audioContextRef.current) {
      await initializeAudio();
    }

    if (audioQueueRef.current) {
      const chunk: AudioChunk = {
        data: audioData,
        timestamp: Date.now(),
        userId
      };

      await audioQueueRef.current.addToQueue(chunk);
      onAudioReceived?.(audioData);
    }
  }, [initializeAudio, onAudioReceived]);

  // Auto-play received audio
  const playAudioData = useCallback(async (audioData: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) {
        await initializeAudio();
      }

      if (audioContextRef.current) {
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.slice(0));
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
      }
    } catch (error) {
      console.error('Error playing received audio:', error);
    }
  }, [initializeAudio]);

  useEffect(() => {
    initializeAudio();

    return () => {
      if (audioQueueRef.current) {
        audioQueueRef.current.clear();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      isInitializedRef.current = false;
    };
  }, [initializeAudio]);

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-red-300" />
          <span>Real-time Audio</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 text-sm text-green-300">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Real-time audio playback active</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Incoming voice messages will play automatically
        </p>
      </CardContent>
    </Card>
  );
};

export default RealTimeAudioPlayer;
