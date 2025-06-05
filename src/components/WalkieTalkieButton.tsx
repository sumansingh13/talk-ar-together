
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Radio } from 'lucide-react';
import { useRealTimeAudio } from '@/hooks/useRealTimeAudio';

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
    isTransmitting,
    isReceiving,
    connectedUsers,
    isInitialized,
    initializeAudio,
    startTransmission,
    stopTransmission,
    cleanup
  } = useRealTimeAudio(channelId);

  const handleInitialize = async () => {
    if (!isInitialized) {
      await initializeAudio();
    } else {
      await cleanup();
    }
  };

  const handleTransmissionStart = () => {
    startTransmission();
    onTransmissionStart?.();
  };

  const handleTransmissionEnd = () => {
    stopTransmission();
    onTransmissionEnd?.();
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Connection Button */}
      <Button
        onClick={handleInitialize}
        className={`${
          isInitialized
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        <Radio className="w-4 h-4 mr-2" />
        {isInitialized ? 'Disconnect' : 'Connect Walkie-Talkie'}
      </Button>

      {/* Transmission Button */}
      {isInitialized && (
        <div className="flex flex-col items-center space-y-2 relative">
          <Button
            onMouseDown={handleTransmissionStart}
            onMouseUp={handleTransmissionEnd}
            onTouchStart={handleTransmissionStart}
            onTouchEnd={handleTransmissionEnd}
            className={`w-24 h-24 rounded-full transition-all duration-200 transform ${
              isTransmitting 
                ? 'bg-gradient-to-r from-red-500 to-red-600 scale-110 shadow-lg shadow-red-500/50' 
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:scale-105 shadow-lg shadow-green-500/30'
            }`}
            size="lg"
          >
            {isTransmitting ? (
              <Mic className="w-8 h-8 text-white" />
            ) : (
              <MicOff className="w-8 h-8 text-white" />
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-green-200">
              {isTransmitting ? 'Transmitting...' : isReceiving ? 'Receiving...' : 'Hold to talk'}
            </p>
            <p className="text-xs text-green-300">
              {connectedUsers.length} users connected
            </p>
          </div>

          {/* Visual feedback for transmission */}
          {isTransmitting && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-32 h-32 border-4 border-red-400 rounded-full animate-ping opacity-20" />
              <div className="w-40 h-40 border-2 border-red-300 rounded-full animate-ping opacity-10" style={{ animationDelay: '150ms' }} />
            </div>
          )}

          {/* Visual feedback for receiving */}
          {isReceiving && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-32 h-32 border-4 border-green-400 rounded-full animate-ping opacity-20" />
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div className="text-xs text-center">
        {isInitialized ? (
          <span className="text-green-300">✓ Connected to voice channel</span>
        ) : (
          <span className="text-gray-400">Click to connect</span>
        )}
      </div>
    </div>
  );
};

export default WalkieTalkieButton;
