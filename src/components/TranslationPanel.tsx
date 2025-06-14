
import React, { useState } from 'react';
import { Globe, Volume2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TranslationPanel = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translations, setTranslations] = useState([
    {
      id: 1,
      original: "Hello everyone, how are you doing today?",
      translated: "Hola a todos, ¿cómo están hoy?",
      from: "English",
      to: "Spanish",
      user: "Alex Johnson",
      timestamp: "2 min ago"
    },
    {
      id: 2,
      original: "こんにちは、今日は調子はどうですか？",
      translated: "Hello, how are you doing today?",
      from: "Japanese",
      to: "English",
      user: "Hiroshi Tanaka",
      timestamp: "5 min ago"
    }
  ]);

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-red-300" />
            <span>Real-time Translation</span>
          </div>
          <Button
            variant={isTranslating ? "destructive" : "secondary"}
            size="sm"
            onClick={() => setIsTranslating(!isTranslating)}
            className={isTranslating ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30"}
          >
            {isTranslating ? 'ON' : 'OFF'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isTranslating && (
          <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-blue-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm">Translation active - AI powered by GPT-4</span>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {translations.map((translation) => (
            <div key={translation.id} className="bg-black/30 border border-blue-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-red-300">{translation.user}</span>
                  <Badge variant="outline" className="text-xs border-red-500/50 text-red-400 bg-red-500/10">
                    {translation.timestamp}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-200 hover:bg-blue-500/20 p-1">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-200">
                  <Badge variant="outline" className="text-xs mr-2 border-blue-400 text-blue-300 bg-blue-500/10">
                    {translation.from}
                  </Badge>
                  {translation.original}
                </div>
                
                <div className="flex items-center space-x-2 text-red-400">
                  <ArrowRight className="w-4 h-4" />
                  <div className="h-px bg-red-400/50 flex-1" />
                </div>
                
                <div className="text-sm text-white">
                  <Badge variant="outline" className="text-xs mr-2 border-green-400 text-green-300 bg-green-500/10">
                    {translation.to}
                  </Badge>
                  {translation.translated}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isTranslating && (
          <div className="text-center text-red-300 py-4">
            <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Enable translation to see real-time voice translations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranslationPanel;
