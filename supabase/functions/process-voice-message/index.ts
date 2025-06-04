
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
    const { audioData, duration, channelId } = await req.json()

    if (!audioData || !channelId) {
      throw new Error('Audio data and channel ID are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Store voice message in database
    const { data: voiceMessage, error: dbError } = await supabase
      .from('voice_messages')
      .insert({
        user_id: user.id,
        channel_id: channelId,
        audio_data: audioData,
        duration: duration,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Get channel participants for instant delivery
    const { data: participants, error: participantsError } = await supabase
      .from('channel_participants')
      .select('user_id')
      .eq('channel_id', channelId)
      .neq('user_id', user.id)

    if (participantsError) {
      console.error('Error fetching participants:', participantsError)
    }

    // Send real-time notification to all participants
    if (participants && participants.length > 0) {
      const channel = supabase.channel(`voice-messages-${channelId}`)
      
      await channel.send({
        type: 'broadcast',
        event: 'new-voice-message',
        payload: {
          messageId: voiceMessage.id,
          senderId: user.id,
          audioData: audioData,
          duration: duration,
          timestamp: voiceMessage.created_at
        }
      })

      // Here you would typically send push notifications for background delivery
      console.log(`Voice message sent to ${participants.length} participants`)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: voiceMessage.id,
        deliveredTo: participants?.length || 0
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
