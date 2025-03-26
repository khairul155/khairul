
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, action } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the current date in UTC+6 (Bangladesh Standard Time)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bstTime = new Date(utcTime + (6 * 60 * 60 * 1000));
    const today = bstTime.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // If action is "deduct", deduct 4 credits for image generation
    if (action === "deduct") {
      // Get current user credits
      const { data: userData, error: userError } = await supabaseClient
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (userError) {
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve user credits', details: userError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Check if user has enough credits
      if (userData.credits_used_today + 4 > userData.daily_credits) {
        return new Response(
          JSON.stringify({ 
            error: 'Not enough credits', 
            details: 'You do not have enough credits to generate an image',
            remaining: userData.daily_credits - userData.credits_used_today
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      // Update user credits (deduct 4)
      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({ 
          credits_used_today: userData.credits_used_today + 4,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to update credits', details: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Return updated credits
      return new Response(
        JSON.stringify({ 
          credits: userData.daily_credits - (userData.credits_used_today + 4),
          deducted: 4,
          status: 'success'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no action or action is "get", just return the current credits
    // Check if user has credits in the database
    // If not found, assume they are on the free plan with 60 tokens that reset daily
    
    // For this example, we're just returning the default free plan tokens
    // In a production app, you would implement proper token tracking and deduction
    
    return new Response(
      JSON.stringify({ 
        credits: 60,
        resetDate: `${today}T00:00:00+06:00`, // Midnight in UTC+6
        plan: 'free'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
