
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData, duration, recipientId, channelId, senderId } = await req.json()

    if (!audioData || !senderId) {
      throw new Error('Audio data and sender ID are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store voice message in database
    const { data: voiceMessage, error: dbError } = await supabase
      .from('voice_messages')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        channel_id: channelId,
        audio_data: audioData,
        duration: duration,
        is_played: false
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to store voice message')
    }

    // Send real-time notification to recipient(s)
    const notificationChannel = channelId ? `channel-${channelId}` : `user-${recipientId}`
    
    const { error: realtimeError } = await supabase
      .channel(notificationChannel)
      .send({
        type: 'broadcast',
        event: 'voice-message',
        payload: {
          messageId: voiceMessage.id,
          senderId: senderId,
          duration: duration,
          timestamp: new Date().toISOString()
        }
      })

    if (realtimeError) {
      console.error('Realtime error:', realtimeError)
    }

    // For demonstration, we'll simulate background notification
    // In a real app, you'd integrate with push notification services
    console.log(`Voice message sent to ${recipientId || 'channel ' + channelId}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: voiceMessage.id,
        message: 'Voice message sent successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
