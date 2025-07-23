import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active users (those who have profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, trainer_name')
      .not('trainer_name', 'eq', 'PENDING') // Only users who have completed profile setup

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user profiles',
          success: false 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No active users found to notify',
          notificationsSent: 0,
          success: true 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create notification records for all users
    const currentTime = new Date().toISOString()
    const notifications = profiles.map(profile => ({
      user_id: profile.user_id,
      message: "It's a new day! Time to update your daily stats and climb the leaderboard.",
      notification_type: 'stats_update',
      is_read: false,
      created_at: currentTime
    }))

    // Batch insert all notifications
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select('id')

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert notifications',
          success: false 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const notificationCount = insertedNotifications?.length || 0
    console.log(`Successfully sent ${notificationCount} daily notifications at ${currentTime}`)

    return new Response(
      JSON.stringify({ 
        message: 'Daily notifications sent successfully',
        notificationsSent: notificationCount,
        timestamp: currentTime,
        success: true
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 