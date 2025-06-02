
import React, { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PushToTalkButtonProps {
  isSpeaking: boolean;
  onToggle: (speaking: boolean) => void;
}

const PushToTalkButton = ({ isSpeaking, onToggle }: PushToTalkButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseDown = () => {
    setIsPressed(true);
    onToggle(true);
    console.log('Started speaking');
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    onToggle(false);
    console.log('Stopped speaking');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && !isPressed) {
      e.preventDefault();
      handleMouseDown();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && isPressed) {
      e.preventDefault();
      handleMouseUp();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <Button
        className={`w-24 h-24 rounded-full transition-all duration-200 transform ${
          isPressed 
            ? 'bg-gradient-to-r from-orange-500 to-red-500 scale-110 shadow-lg shadow-orange-500/50' 
            : 'bg-gradient-to-r from-pink-500 to-orange-500 hover:scale-105 shadow-lg shadow-pink-500/30'
        }`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        tabIndex={0}
        size="lg"
      >
        {isPressed ? (
          <Mic className="w-8 h-8 text-white" />
        ) : (
          <MicOff className="w-8 h-8 text-white" />
        )}
      </Button>
      
      <div className="text-center">
        <p className="text-sm text-pink-200">
          {isPressed ? 'Release to stop' : 'Hold to talk'}
        </p>
        <p className="text-xs text-pink-300">
          Press and hold SPACE or click
        </p>
      </div>

      {/* Visual feedback */}
      {isPressed && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-32 h-32 border-4 border-orange-400 rounded-full animate-ping opacity-20" />
          <div className="w-40 h-40 border-2 border-orange-300 rounded-full animate-ping opacity-10 animation-delay-150" />
        </div>
      )}
    </div>
  );
};

export default PushToTalkButton;
