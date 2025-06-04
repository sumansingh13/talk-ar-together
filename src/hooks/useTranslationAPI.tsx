
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTranslationAPI = () => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string | null> => {
    if (!text.trim()) return null;

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: text.trim(),
          from: fromLang,
          to: toLang
        }
      });

      if (error) {
        console.error('Translation error:', error);
        return null;
      }

      return data?.translatedText || null;
    } catch (error) {
      console.error('Translation API error:', error);
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translateText,
    isTranslating
  };
};
