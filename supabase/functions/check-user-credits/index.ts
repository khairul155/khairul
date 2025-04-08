
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request data
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id parameter" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First, check if user exists in user_credits table
    const { data: userData, error: userError } = await supabaseClient
      .from('user_credits')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check if daily reset is needed
    const lastResetDate = new Date(userData.last_reset_date);
    lastResetDate.setHours(0, 0, 0, 0);

    let updatedCredits = { ...userData };

    // Reset daily counters if it's a new day
    if (today > lastResetDate) {
      const { data: resetData, error: resetError } = await supabaseClient
        .from('user_credits')
        .update({
          credits_used_today: 0,
          last_reset_date: today.toISOString()
        })
        .eq('user_id', user_id)
        .select()
        .single();

      if (resetError) {
        return new Response(
          JSON.stringify({ error: resetError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      updatedCredits = resetData;
    }

    // Check if user can generate an image
    const canGenerate = 
      userData.subscription_plan === 'premium' || 
      updatedCredits.credits_used_today < updatedCredits.daily_credits;

    // Return information about user's credits
    return new Response(
      JSON.stringify({
        user_id,
        can_generate: canGenerate,
        subscription_plan: updatedCredits.subscription_plan,
        daily_credits: updatedCredits.daily_credits,
        credits_used_today: updatedCredits.credits_used_today,
        monthly_credits: updatedCredits.monthly_credits,
        credits_used_this_month: updatedCredits.credits_used_this_month
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
