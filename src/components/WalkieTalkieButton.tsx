
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Radio } from 'lucide-react';
import { useWebRTCAudio } from '@/hooks/useWebRTCAudio';

interface WalkieTalkieButtonProps {
  channelId: string;
  onTransmissionStart?: () => void;
  onTransmissionEnd?: () => void;
}

const WalkieTalkieButton = ({ 
  channelId, 
  onTransmissionStart, 
  onTransmissionEnd 
}: WalkieTalkieButtonProps) => {
  const {
    isConnected,
    isRecording,
    connectedUsers,
    initializeAudio,
    startRecording,
    stopRecording,
    disconnect
  } = useWebRTCAudio({
    channelId,
    onAudioReceived: (audioData) => {
      console.log('Received audio data:', audioData);
      // Auto-play received audio
    },
    onRemoteUserConnected: (userId) => {
      console.log('User connected:', userId);
    },
    onRemoteUserDisconnected: (userId) => {
      console.log('User disconnected:', userId);
    }
  });

  const handleInitialize = async () => {
    if (!isConnected) {
      try {
        await initializeAudio();
      } catch (error) {
        console.error('Failed to initialize walkie-talkie:', error);
      }
    } else {
      disconnect();
    }
  };

  const handleTransmission = () => {
    if (isRecording) {
      stopRecording();
      onTransmissionEnd?.();
    } else {
      startRecording();
      onTransmissionStart?.();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Connection Button */}
      <Button
        onClick={handleInitialize}
        className={`${
          isConnected
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        <Radio className="w-4 h-4 mr-2" />
        {isConnected ? 'Disconnect' : 'Connect Walkie-Talkie'}
      </Button>

      {/* Transmission Button */}
      {isConnected && (
        <div className="flex flex-col items-center space-y-2">
          <Button
            onMouseDown={handleTransmission}
            onMouseUp={handleTransmission}
            onTouchStart={handleTransmission}
            onTouchEnd={handleTransmission}
            className={`w-24 h-24 rounded-full transition-all duration-200 transform ${
              isRecording 
                ? 'bg-gradient-to-r from-red-500 to-red-600 scale-110 shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 shadow-lg shadow-green-500/30'
            }`}
            size="lg"
          >
            {isRecording ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <MicOff className="w-8 h-8 text-white" />
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-green-200">
              {isRecording ? 'Transmitting...' : 'Hold to talk'}
            </p>
            <p className="text-xs text-green-300">
              {connectedUsers.length} users connected
            </p>
          </div>

          {/* Visual feedback */}
          {isRecording && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-32 h-32 border-4 border-red-400 rounded-full animate-ping opacity-20" />
              <div className="w-40 h-40 border-2 border-red-300 rounded-full animate-ping opacity-10 animation-delay-150" />
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-center">
        {isConnected ? (
          <span className="text-green-300">✓ Connected to voice channel</span>
        ) : (
          <span className="text-gray-400">Click to connect</span>
        )}
      </div>
    </div>
  );
};

export default WalkieTalkieButton;
