
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user's ID from the auth token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'You must be logged in to access credits' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Call the RPC function to get user credits
    const { data, error } = await supabaseClient.rpc('get_user_credits')

    if (error) {
      console.error('Error fetching user credits:', error)
      
      // If there's an error, return default free plan values
      return new Response(
        JSON.stringify({
          subscription_plan: 'free',
          daily_credits: 60,
          monthly_credits: 0,
          credits_used_today: 0,
          credits_used_this_month: 0,
          slow_mode_enabled: false,
          tools: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(data || {
        subscription_plan: 'free',
        daily_credits: 60,
        monthly_credits: 0,
        credits_used_today: 0,
        credits_used_this_month: 0,
        slow_mode_enabled: false,
        tools: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Exception in get-user-credits:', error)
    
    // Even on error, return default values to prevent UI breakage
    return new Response(
      JSON.stringify({
        subscription_plan: 'free',
        daily_credits: 60,
        monthly_credits: 0,
        credits_used_today: 0,
        credits_used_this_month: 0,
        slow_mode_enabled: false,
        tools: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
