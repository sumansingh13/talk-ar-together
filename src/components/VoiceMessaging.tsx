
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Play, Pause, Send } from 'lucide-react';
import { useVoiceMessaging } from '@/hooks/useVoiceMessaging';

interface VoiceMessagingProps {
  channelId: string;
  recipientIds: string[];
}

const VoiceMessaging = ({ channelId, recipientIds }: VoiceMessagingProps) => {
  const {
    isRecording,
    voiceMessages,
    recordingDuration,
    startVoiceRecording,
    stopVoiceRecording,
    playVoiceMessage,
    sendInstantVoiceMessage
  } = useVoiceMessaging();

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mic className="w-5 h-5 text-red-300" />
          <span>Voice Messages</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop ({formatDuration(recordingDuration)})
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Record Message
              </>
            )}
          </Button>

          {isRecording && (
            <Button
              onClick={() => sendInstantVoiceMessage(channelId, recipientIds)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Instantly
            </Button>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2 text-red-300">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" />
            <span className="text-sm">Recording... {formatDuration(recordingDuration)}</span>
          </div>
        )}

        {/* Voice Messages List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {voiceMessages.map(message => (
            <div
              key={message.id}
              className={`bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 ${
                !message.isPlayed ? 'border-green-500/30 bg-green-500/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => playVoiceMessage(message.id, message.audioData)}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <span className="text-sm text-blue-300">
                    {formatDuration(message.duration)}
                  </span>
                  {!message.isPlayed && (
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-400 bg-blue-500/10 rounded p-2 border border-blue-500/20">
          💡 Voice messages play automatically on recipient devices, even when the app is in background
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceMessaging;
