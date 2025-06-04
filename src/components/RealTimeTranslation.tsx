
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Languages } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTranslationAPI } from '@/hooks/useTranslationAPI';

interface RealTimeTranslationProps {
  isActive: boolean;
  onTranslationReceived: (originalText: string, translatedText: string, fromLang: string, toLang: string) => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ne', name: 'Nepali' },
  { code: 'mai', name: 'Maithili' }
];

const RealTimeTranslation = ({ isActive, onTranslationReceived }: RealTimeTranslationProps) => {
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [isTranslationActive, setIsTranslationActive] = useState(false);
  
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: sourceLanguage
  });

  const { translateText, isTranslating } = useTranslationAPI();

  // Handle completed speech recognition
  useEffect(() => {
    if (transcript && isTranslationActive) {
      translateText(transcript, sourceLanguage, targetLanguage).then(translatedText => {
        if (translatedText) {
          onTranslationReceived(transcript, translatedText, sourceLanguage, targetLanguage);
          resetTranscript();
        }
      });
    }
  }, [transcript, isTranslationActive, sourceLanguage, targetLanguage, onTranslationReceived, resetTranscript, translateText]);

  const toggleTranslation = () => {
    if (isTranslationActive) {
      setIsTranslationActive(false);
      stopListening();
    } else {
      setIsTranslationActive(true);
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-red-300" />
            <span>Real-time Translation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-300">Speech recognition is not supported in this browser.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/40 backdrop-blur-lg border-red-300/20 text-white shadow-lg shadow-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Languages className="w-5 h-5 text-red-300" />
          <span>Real-time Translation</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-red-200">From Language</label>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="bg-slate-800/50 border-red-300/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-red-300/20">
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-red-500/20">
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm text-red-200">To Language</label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="bg-slate-800/50 border-red-300/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-red-300/20">
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-red-500/20">
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={toggleTranslation}
          disabled={!isActive || isTranslating}
          className={`w-full ${
            isTranslationActive
              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
          } text-white`}
        >
          {isTranslating ? (
            <>
              <Languages className="w-4 h-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : isTranslationActive ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Translation
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Translation
            </>
          )}
        </Button>

        {error && (
          <div className="text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {(transcript || interimTranscript) && (
          <div className="space-y-2">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <p className="text-sm text-blue-300 mb-1">Listening...</p>
              <p className="text-white">{transcript + interimTranscript}</p>
            </div>
          </div>
        )}

        {isListening && (
          <div className="flex items-center space-x-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Listening for speech...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeTranslation;
