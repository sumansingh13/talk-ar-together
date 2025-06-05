
import { useState, useCallback } from 'react';
import { useTranslationAPI } from '@/hooks/useTranslationAPI';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface TranslationResult {
  original: string;
  translated: string;
  fromLang: string;
  toLang: string;
  timestamp: Date;
}

export const useRealTimeTranslation = () => {
  const [isActive, setIsActive] = useState(false);
  const [translations, setTranslations] = useState<TranslationResult[]>([]);
  const [currentTranslation, setCurrentTranslation] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('hi');
  
  const { translateText, isTranslating } = useTranslationAPI();
  
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    language: sourceLanguage
  });

  const handleTranslation = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      const translated = await translateText(text, sourceLanguage, targetLanguage);
      
      if (translated) {
        const result: TranslationResult = {
          original: text,
          translated,
          fromLang: sourceLanguage,
          toLang: targetLanguage,
          timestamp: new Date()
        };
        
        setTranslations(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
        setCurrentTranslation(translated);
        
        // Clear after showing translation
        setTimeout(() => {
          setCurrentTranslation('');
          resetTranscript();
        }, 3000);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }
  }, [sourceLanguage, targetLanguage, translateText, resetTranscript]);

  const startTranslation = useCallback(() => {
    if (!isSupported) return;
    
    setIsActive(true);
    startListening();
  }, [isSupported, startListening]);

  const stopTranslation = useCallback(() => {
    setIsActive(false);
    stopListening();
    
    // Process final transcript
    if (transcript) {
      handleTranslation(transcript);
    }
  }, [stopListening, transcript, handleTranslation]);

  const clearTranslations = useCallback(() => {
    setTranslations([]);
    setCurrentTranslation('');
    resetTranscript();
  }, [resetTranscript]);

  return {
    isActive,
    isListening,
    isTranslating,
    isSupported,
    transcript: interimTranscript || transcript,
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
  };
};
