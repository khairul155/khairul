
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

    // Get user's current credits
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

    // Premium users don't use credits
    if (userData.subscription_plan === 'premium') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Premium user - no credits deducted",
          updated: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update the user's credits
    const { data: updateData, error: updateError } = await supabaseClient
      .from('user_credits')
      .update({
        credits_used_today: userData.credits_used_today + 1,
        credits_used_this_month: userData.credits_used_this_month + 1
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Credits updated successfully",
        updated: true,
        daily_credits: updateData.daily_credits,
        credits_used_today: updateData.credits_used_today,
        monthly_credits: updateData.monthly_credits,
        credits_used_this_month: updateData.credits_used_this_month
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
