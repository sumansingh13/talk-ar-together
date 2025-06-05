
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Languages, Trash2 } from 'lucide-react';
import { useRealTimeTranslation } from '@/hooks/useRealTimeTranslation';

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

interface ImprovedRealTimeTranslationProps {
  onTranslationReceived: (originalText: string, translatedText: string, fromLang: string, toLang: string) => void;
}

const ImprovedRealTimeTranslation = ({ onTranslationReceived }: ImprovedRealTimeTranslationProps) => {
  const {
    isActive,
    isListening,
    isTranslating,
    isSupported,
    transcript,
    currentTranslation,
    translations,
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
    startTranslation,
    stopTranslation,
    clearTranslations,
    handleTranslation
  } = useRealTimeTranslation();

  React.useEffect(() => {
    if (currentTranslation && transcript) {
      onTranslationReceived(transcript, currentTranslation, sourceLanguage, targetLanguage);
    }
  }, [currentTranslation, transcript, sourceLanguage, targetLanguage, onTranslationReceived]);

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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-red-300" />
            <span>Real-time Translation</span>
          </div>
          {translations.length > 0 && (
            <Button
              onClick={clearTranslations}
              size="sm"
              variant="outline"
              className="border-red-300/20 text-red-200 hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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
          onClick={isActive ? stopTranslation : startTranslation}
          disabled={isTranslating}
          className={`w-full ${
            isActive
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          } text-white`}
        >
          {isTranslating ? (
            <>
              <Languages className="w-4 h-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : isActive ? (
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

        {/* Real-time transcript and translation */}
        {transcript && (
          <div className="space-y-3">
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <p className="text-sm text-blue-300 mb-1">Listening ({sourceLanguage.toUpperCase()}):</p>
              <p className="text-white">{transcript}</p>
            </div>
            
            {currentTranslation && (
              <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <p className="text-sm text-green-300 mb-1">Translation ({targetLanguage.toUpperCase()}):</p>
                <p className="text-white font-medium">{currentTranslation}</p>
              </div>
            )}
          </div>
        )}

        {isListening && !transcript && (
          <div className="flex items-center space-x-2 text-green-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm">Listening for speech...</span>
          </div>
        )}

        {/* Translation history */}
        {translations.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <h4 className="text-sm font-medium text-red-200">Recent Translations:</h4>
            {translations.map((translation, index) => (
              <div key={index} className="bg-purple-500/10 rounded-lg p-2 border border-purple-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-300">
                    {translation.fromLang.toUpperCase()} → {translation.toLang.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {translation.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-300">{translation.original}</p>
                <p className="text-xs text-white font-medium">{translation.translated}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovedRealTimeTranslation;
