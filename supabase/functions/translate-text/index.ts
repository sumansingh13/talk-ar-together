
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

    // Use Google Translate API
    const response = await fetch('https://translate.googleapis.com/translate_a/single', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // For now, use a mock translation service
    // In production, you would use Google Translate API, Azure Translator, or similar
    const mockTranslations: Record<string, Record<string, string>> = {
      'hello': { 
        'es': 'hola', 
        'fr': 'bonjour', 
        'de': 'hallo', 
        'hi': 'नमस्ते',
        'kn': 'ನಮಸ್ಕಾರ',
        'ne': 'नमस्ते',
        'mai': 'प्रणाम'
      },
      'goodbye': { 
        'es': 'adiós', 
        'fr': 'au revoir', 
        'de': 'auf wiedersehen',
        'hi': 'अलविदा',
        'kn': 'ವಿದಾಯ',
        'ne': 'बिदाइ',
        'mai': 'बिदाइ'
      },
      'thank you': { 
        'es': 'gracias', 
        'fr': 'merci', 
        'de': 'danke',
        'hi': 'धन्यवाद',
        'kn': 'ಧನ್ಯವಾದಗಳು',
        'ne': 'धन्यवाद',
        'mai': 'धन्यवाद'
      }
    };

    const lowerText = text.toLowerCase();
    const translatedText = mockTranslations[lowerText]?.[to] || `[${to.toUpperCase()}] ${text}`;

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
