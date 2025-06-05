
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Play, Pause, Send, Trash2, Square } from 'lucide-react';
import { useAdvancedVoiceMessaging } from '@/hooks/useAdvancedVoiceMessaging';

interface Friend {
  id: string;
  profiles: {
    full_name: string | null;
    username: string | null;
  };
}

interface ImprovedVoiceMessagingProps {
  channelId: string;
  friends: Friend[];
}

const ImprovedVoiceMessaging = ({ channelId, friends }: ImprovedVoiceMessagingProps) => {
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [sendToChannel, setSendToChannel] = useState(true);
  
  const {
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
  } = useAdvancedVoiceMessaging();

  const handleSend = async () => {
    if (!currentRecording) return;

    const success = await sendVoiceMessage(
      currentRecording,
      sendToChannel ? undefined : selectedRecipient,
      sendToChannel ? channelId : undefined
    );

    if (success) {
      console.log('Voice message sent successfully!');
    }
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
        {!currentRecording ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                className={`${
                  isRecording && !isPaused
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : isPaused
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isRecording && !isPaused ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause ({formatDuration(recordingDuration)})
                  </>
                ) : isPaused ? (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Resume ({formatDuration(recordingDuration)})
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {isRecording && (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-300">
                <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-400 animate-pulse'}`} />
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
                  onClick={() => previewRecording(currentRecording)}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Preview
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
                  <label htmlFor="sendToChannel" className="text-sm text-white">
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
                  onClick={handleSend}
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
                    onClick={() => previewRecording(message)}
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

export default ImprovedVoiceMessaging;
