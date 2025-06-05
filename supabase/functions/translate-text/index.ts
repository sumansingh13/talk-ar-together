
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, from, to } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Enhanced mock translation service with better language support
    const mockTranslations: Record<string, Record<string, string>> = {
      'hello': { 
        'es': 'hola', 
        'fr': 'bonjour', 
        'de': 'hallo', 
        'hi': 'नमस्ते',
        'kn': 'ನಮಸ್ಕಾರ',
        'ne': 'नमस्ते',
        'mai': 'प्रणाम',
        'it': 'ciao',
        'pt': 'olá',
        'ru': 'привет',
        'ja': 'こんにちは',
        'ko': '안녕하세요',
        'zh': '你好'
      },
      'goodbye': { 
        'es': 'adiós', 
        'fr': 'au revoir', 
        'de': 'auf wiedersehen',
        'hi': 'अलविदा',
        'kn': 'ವಿದಾಯ',
        'ne': 'बिदाइ',
        'mai': 'बिदाइ',
        'it': 'arrivederci',
        'pt': 'tchau',
        'ru': 'до свидания',
        'ja': 'さようなら',
        'ko': '안녕히 가세요',
        'zh': '再见'
      },
      'thank you': { 
        'es': 'gracias', 
        'fr': 'merci', 
        'de': 'danke',
        'hi': 'धन्यवाद',
        'kn': 'ಧನ್ಯವಾದಗಳು',
        'ne': 'धन्यवाद',
        'mai': 'धन्यवाद',
        'it': 'grazie',
        'pt': 'obrigado',
        'ru': 'спасибо',
        'ja': 'ありがとう',
        'ko': '감사합니다',
        'zh': '谢谢'
      },
      'how are you': {
        'es': '¿cómo estás?',
        'fr': 'comment allez-vous?',
        'de': 'wie geht es dir?',
        'hi': 'आप कैसे हैं?',
        'kn': 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
        'ne': 'तपाईं कस्तो हुनुहुन्छ?',
        'mai': 'अहाँ कोना छी?',
        'it': 'come stai?',
        'pt': 'como você está?',
        'ru': 'как дела?',
        'ja': '元気ですか？',
        'ko': '어떻게 지내세요?',
        'zh': '你好吗？'
      },
      'yes': {
        'es': 'sí',
        'fr': 'oui',
        'de': 'ja',
        'hi': 'हाँ',
        'kn': 'ಹೌದು',
        'ne': 'हो',
        'mai': 'हँ',
        'it': 'sì',
        'pt': 'sim',
        'ru': 'да',
        'ja': 'はい',
        'ko': '네',
        'zh': '是的'
      },
      'no': {
        'es': 'no',
        'fr': 'non',
        'de': 'nein',
        'hi': 'नहीं',
        'kn': 'ಇಲ್ಲ',
        'ne': 'होइन',
        'mai': 'नै',
        'it': 'no',
        'pt': 'não',
        'ru': 'нет',
        'ja': 'いいえ',
        'ko': '아니요',
        'zh': '不是'
      }
    };

    // Try exact match first, then partial match
    const lowerText = text.toLowerCase().trim();
    let translatedText = mockTranslations[lowerText]?.[to];
    
    if (!translatedText) {
      // Try finding partial matches
      for (const [key, translations] of Object.entries(mockTranslations)) {
        if (lowerText.includes(key) || key.includes(lowerText)) {
          translatedText = translations[to];
          break;
        }
      }
    }
    
    // If still no translation found, provide a generic response
    if (!translatedText) {
      const languageNames: Record<string, string> = {
        'hi': 'हिंदी में',
        'kn': 'ಕನ್ನಡದಲ್ಲಿ',
        'ne': 'नेपालीमा',
        'mai': 'मैथिलीमे',
        'es': 'en español',
        'fr': 'en français',
        'de': 'auf deutsch',
        'it': 'in italiano',
        'pt': 'em português',
        'ru': 'по-русски',
        'ja': '日本語で',
        'ko': '한국어로',
        'zh': '用中文'
      };
      
      translatedText = `[${languageNames[to] || to.toUpperCase()}] ${text}`;
    }

    return new Response(
      JSON.stringify({ 
        translatedText,
        fromLanguage: from,
        toLanguage: to,
        originalText: text
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
