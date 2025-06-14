
import React, { useState } from 'react';
import { Volume2, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const VoiceEffects = () => {
  const [selectedEffect, setSelectedEffect] = useState('none');
  const [volume, setVolume] = useState([75]);
  const [pitch, setPitch] = useState([50]);

  const effects = [
    { id: 'none', name: 'Natural', icon: '🎤' },
    { id: 'robot', name: 'Robot', icon: '🤖' },
    { id: 'deep', name: 'Deep Voice', icon: '🐻' },
    { id: 'high', name: 'High Pitch', icon: '🐭' },
    { id: 'echo', name: 'Echo', icon: '🏔️' },
    { id: 'whisper', name: 'Whisper', icon: '🤫' },
  ];

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-red-300" />
          <span>Voice Effects</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Effects Grid */}
        <div className="grid grid-cols-3 gap-2">
          {effects.map((effect) => (
            <Button
              key={effect.id}
              variant={selectedEffect === effect.id ? "secondary" : "ghost"}
              className={`h-16 flex-col space-y-1 transition-all ${
                selectedEffect === effect.id 
                  ? 'bg-red-500/30 text-red-200 border border-red-400/50 shadow-md' 
                  : 'hover:bg-blue-500/20 text-red-300 border border-transparent hover:border-blue-400/30'
              }`}
              onClick={() => setSelectedEffect(effect.id)}
            >
              <span className="text-lg">{effect.icon}</span>
              <span className="text-xs">{effect.name}</span>
            </Button>
          ))}
        </div>

        {/* Audio Controls */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-red-200 flex items-center space-x-2">
                <Volume2 className="w-4 h-4" />
                <span>Volume</span>
              </label>
              <span className="text-sm text-red-300">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-red-200">Pitch</label>
              <span className="text-sm text-red-300">{pitch[0]}%</span>
            </div>
            <Slider
              value={pitch}
              onValueChange={setPitch}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Noise Cancellation */}
        <div className="flex items-center justify-between pt-2 border-t border-red-300/20">
          <span className="text-sm text-red-200">Noise Cancellation</span>
          <Button variant="outline" size="sm" className="text-green-300 border-green-500/30 bg-green-500/10 hover:bg-green-500/20">
            Active
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceEffects;
