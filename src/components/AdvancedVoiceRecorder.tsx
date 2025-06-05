
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Play, Pause, Square, Send, Trash2, Users } from 'lucide-react';

interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
}

interface Friend {
  id: string;
  profiles: {
    full_name: string | null;
    username: string | null;
  };
}

interface AdvancedVoiceRecorderProps {
  channelId: string;
  friends: Friend[];
}

const AdvancedVoiceRecorder = ({ channelId, friends }: AdvancedVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentRecording, setCurrentRecording] = useState<VoiceRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [sendToChannel, setSendToChannel] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
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
        const recording: VoiceRecording = {
          id: Date.now().toString(),
          audioBlob,
          duration: recordingDuration,
          timestamp: new Date()
        };
        setCurrentRecording(recording);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recordingDuration]);

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
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const playRecording = useCallback(async () => {
    if (!currentRecording) return;

    try {
      const audioUrl = URL.createObjectURL(currentRecording.audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  }, [currentRecording]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const discardRecording = useCallback(() => {
    setCurrentRecording(null);
    setRecordingDuration(0);
    setSelectedRecipient('');
    setSendToChannel(true);
  }, []);

  const sendRecording = useCallback(async () => {
    if (!currentRecording) return;

    try {
      // Convert blob to base64
      const arrayBuffer = await currentRecording.audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Here you would send to your voice message API
      console.log('Sending voice message:', {
        audioData: base64Audio,
        duration: currentRecording.duration,
        channelId: sendToChannel ? channelId : undefined,
        recipientId: !sendToChannel ? selectedRecipient : undefined
      });

      // Reset after sending
      discardRecording();
    } catch (error) {
      console.error('Failed to send recording:', error);
    }
  }, [currentRecording, channelId, sendToChannel, selectedRecipient, discardRecording]);

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-red-300" />
          <span>Advanced Voice Recorder</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentRecording ? (
          /* Recording Controls */
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className={`${
                      isPaused
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-yellow-500 hover:bg-yellow-600'
                    } text-white`}
                  >
                    {isPaused ? (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isPaused ? 'bg-yellow-400' : 'bg-red-400 animate-pulse'
                }`} />
                <span className="text-sm">
                  {isPaused ? 'Paused' : 'Recording'} - {formatDuration(recordingDuration)}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Preview and Send Section */
          <div className="space-y-4">
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <h3 className="text-blue-300 font-medium mb-3">Recording Preview</h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-300">
                  Duration: {formatDuration(currentRecording.duration)}
                </span>
                <Button
                  onClick={isPlaying ? stopPlayback : playRecording}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3 h-3 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </>
                  )}
                </Button>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sendToChannel"
                    checked={sendToChannel}
                    onChange={() => setSendToChannel(true)}
                    className="text-red-500"
                  />
                  <label htmlFor="sendToChannel" className="text-sm text-white flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Send to current channel
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sendToFriend"
                    checked={!sendToChannel}
                    onChange={() => setSendToChannel(false)}
                    className="text-red-500"
                  />
                  <label htmlFor="sendToFriend" className="text-sm text-white">
                    Send to friend:
                  </label>
                </div>

                {!sendToChannel && (
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger className="bg-slate-800/50 border-red-300/20 text-white">
                      <SelectValue placeholder="Select a friend" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-red-300/20">
                      {friends.map(friend => (
                        <SelectItem key={friend.id} value={friend.id} className="text-white hover:bg-red-500/20">
                          {friend.profiles.full_name || friend.profiles.username || 'Friend'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={sendRecording}
                  disabled={!sendToChannel && !selectedRecipient}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                
                <Button
                  onClick={discardRecording}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedVoiceRecorder;
